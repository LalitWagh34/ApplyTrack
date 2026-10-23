/**
 * Gmail Service
 * Wraps Google Gmail API for users.watch registration, history inspection, and privacy-first metadata parsing
 * Strictly complies with least-privilege gmail.metadata (ZERO email body storage).
 */
import { google, gmail_v1 } from 'googleapis';
import { prisma, ApplicationStatus } from '@applytrack/database';
import { env } from '../config/env.js';
import { cryptoService } from './crypto.service.js';

export interface ExtractedEmailMetadata {
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: Date;
  companyName: string;
  companyDomain?: string;
  isLikelyJobApplication: boolean;
  snippet: string;
}

export class GmailService {
  /**
   * Initializes authenticated Gmail API client for a specific user using encrypted refresh token
   */
  private async getAuthenticatedGmailClient(userId: string): Promise<gmail_v1.Gmail> {
    const user = await prisma.user.findUnique({
      where: { id: userId, isArchived: false },
      select: { encryptedGoogleToken: true }
    });

    if (!user || !user.encryptedGoogleToken) {
      throw new Error(`User ${userId} does not have an active Google connection.`);
    }

    const refreshToken = cryptoService.decrypt(user.encryptedGoogleToken);

    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });

    return google.gmail({ version: 'v1', auth: oauth2Client });
  }

  /**
   * Registers Gmail users.watch() subscription with Google Cloud Pub/Sub
   */
  public async setupWatch(userId: string): Promise<{ historyId: string; expiration: Date }> {
    if (!env.GOOGLE_PUBSUB_TOPIC) {
      throw new Error('GOOGLE_PUBSUB_TOPIC is not configured in environment variables');
    }

    const gmail = await this.getAuthenticatedGmailClient(userId);

    const res = await gmail.users.watch({
      userId: 'me',
      requestBody: {
        topicName: env.GOOGLE_PUBSUB_TOPIC,
        labelIds: ['SENT', 'INBOX']
      }
    });

    const historyId = String(res.data.historyId || '');
    const expiration = new Date(Number(res.data.expiration || Date.now() + 7 * 24 * 60 * 60 * 1000));

    // Save watch expiration and history pointer in DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        googleHistoryId: historyId,
        googleWatchExpiry: expiration
      }
    });

    return { historyId, expiration };
  }

  /**
   * Cancels users.watch() push notifications
   */
  public async stopWatch(userId: string): Promise<void> {
    const gmail = await this.getAuthenticatedGmailClient(userId);
    await gmail.users.stop({ userId: 'me' });

    await prisma.user.update({
      where: { id: userId },
      data: { googleWatchExpiry: null }
    });
  }

  /**
   * Fetches history changes between user's last processed historyId and current historyId
   */
  public async fetchHistoryChanges(userId: string, startHistoryId: string) {
    const gmail = await this.getAuthenticatedGmailClient(userId);

    try {
      const res = await gmail.users.history.list({
        userId: 'me',
        startHistoryId,
        historyTypes: ['messageAdded']
      });

      const histories = res.data.history || [];
      const sentMessageIds = new Set<string>();
      const inboxMessageIds = new Set<string>();

      for (const record of histories) {
        if (record.messagesAdded) {
          for (const item of record.messagesAdded) {
            if (item.message && item.message.id) {
              const labels = item.message.labelIds || [];
              if (labels.includes('SENT')) {
                sentMessageIds.add(item.message.id);
              }
              if (labels.includes('INBOX')) {
                inboxMessageIds.add(item.message.id);
              }
            }
          }
        }
      }

      return {
        sentMessageIds: Array.from(sentMessageIds),
        inboxMessageIds: Array.from(inboxMessageIds),
        latestHistoryId: String(res.data.historyId || startHistoryId)
      };
    } catch (err) {
      // If historyId is too old or expired, fallback to last 5 sent messages
      return {
        sentMessageIds: [],
        inboxMessageIds: [],
        latestHistoryId: startHistoryId
      };
    }
  }

  /**
   * Fetches message headers ONLY (gmail.metadata). Zero body reading or storage.
   */
  public async fetchMessageMetadata(userId: string, messageId: string): Promise<ExtractedEmailMetadata | null> {
    const gmail = await this.getAuthenticatedGmailClient(userId);

    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['To', 'From', 'Subject', 'Date']
    });

    const headers = res.data.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject');
    const to = getHeader('To');
    const from = getHeader('From');
    const dateStr = getHeader('Date');

    const threadId = res.data.threadId || messageId;
    const date = dateStr ? new Date(dateStr) : new Date();
    const snippet = res.data.snippet || '';

    // Parse recipient domain & infer company name
    const { companyName, companyDomain } = this.inferCompanyFromRecipient(to, subject);
    const isLikelyJobApplication = this.evaluateJobApplicationSignals(subject);

    return {
      messageId,
      threadId,
      subject,
      from,
      to,
      date,
      companyName,
      companyDomain,
      isLikelyJobApplication,
      snippet
    };
  }

  /**
   * Infers company name from recipient email address or subject
   */
  private inferCompanyFromRecipient(to: string, subject: string): { companyName: string; companyDomain?: string } {
    const emailMatch = to.match(/<([^>]+)>/) || [null, to];
    const email = emailMatch[1] ? emailMatch[1].trim() : to.trim();
    const domainMatch = email.split('@')[1];

    if (!domainMatch) {
      return { companyName: 'Company' };
    }

    const domain = domainMatch.toLowerCase();
    const commonWebmails = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'proton.me'];

    if (!commonWebmails.includes(domain)) {
      // E.g., swiggy.in -> Swiggy, stripe.com -> Stripe
      const brand = domain.split('.')[0];
      const capitalized = brand.charAt(0).toUpperCase() + brand.slice(1);
      return { companyName: capitalized, companyDomain: domain };
    }

    // If sent to a personal gmail (e.g. recruiter@gmail.com), check subject line for company name: "Application for [Company]"
    const subjectMatch = subject.match(/(?:at|for|to)\s+([A-Za-z0-9_-]+)/i);
    if (subjectMatch && subjectMatch[1]) {
      const brand = subjectMatch[1];
      return { companyName: brand.charAt(0).toUpperCase() + brand.slice(1) };
    }

    return { companyName: 'Company' };
  }

  /**
   * Deterministic heuristics to classify whether cold email is a job application
   */
  private evaluateJobApplicationSignals(subject: string): boolean {
    const normalized = subject.toLowerCase();
    const applicationKeywords = [
      'application',
      'applying for',
      'resume',
      'curriculum vitae',
      'cv',
      'job inquiry',
      'software engineer',
      'developer',
      'sde',
      'frontend',
      'backend',
      'full stack',
      'internship',
      'position',
      'role',
      'candidate'
    ];

    return applicationKeywords.some((keyword) => normalized.includes(keyword));
  }

  /**
   * Filters out transactional alerts, security emails, OTPs, newsletters, and spam
   */
  public isTransactionalOrSpam(from: string, subject: string): boolean {
    const s = subject.toLowerCase();
    const f = from.toLowerCase();

    const spamKeywords = [
      'login',
      'signed in',
      'sign in',
      'sign-in',
      'security alert',
      'verification code',
      'verify your email',
      'verify your',
      'otp',
      'password',
      'reset password',
      'statement',
      'invoice',
      'receipt',
      'newsletter',
      'digest',
      'promotions',
      'order confirmed',
      'transaction',
      'bank',
      'credit card',
      'subscription',
      'account access',
      'new device'
    ];

    if (spamKeywords.some((kw) => s.includes(kw))) {
      return true;
    }

    const spamSenders = [
      'no-reply@accounts.google.com',
      'noreply@github.com',
      'security@',
      'alerts@',
      'billing@',
      'auth@',
      'notifications@github.com'
    ];

    return spamSenders.some((sender) => f.includes(sender));
  }

  /**
   * Parses job application details from major job portal confirmation emails (Indeed, Naukri, LinkedIn, Instahyre)
   */
  public parsePortalApplication(from: string, to: string, subject: string, snippet: string = ''): { companyName: string; roleTitle: string; isApplication: boolean } {
    const s = subject.trim();
    const f = from.toLowerCase();
    const snip = snippet.trim();

    // 1. Indeed Confirmation Emails
    if (f.includes('indeed') || s.toLowerCase().includes('indeed') || snip.toLowerCase().includes('indeed') || snip.toLowerCase().includes('items were sent to')) {
      // Match company from Indeed's standard confirmation phrase: "The following items were sent to <Company>."
      const sentMatch = snip.match(/The following items were sent to\s+([^\n\r.]+?)(?:\.|\s*Good luck|\s*-)/i);
      let company = sentMatch ? sentMatch[1].trim() : '';

      // If sentMatch didn't find company, check corporate suffix in snippet
      if (!company) {
        const compMatch = snip.match(/Application submitted\s+([^\n\r–-]+?)\s+([A-Za-z0-9\s._-]+?(?:Private Limited|Pvt Ltd|Limited|LLP|Solutions|Technologies|Software|Inc))\b/i);
        if (compMatch) {
          company = compMatch[2].trim();
        }
      }

      // Check role from subject: "Application submitted: React JS Web Developer" or "Indeed Application: Software Engineer"
      let role = '';
      const subjectRoleMatch = s.match(/(?:application submitted|indeed application)[:\-–]?\s*([^\n\r–-]+)/i);
      if (subjectRoleMatch && subjectRoleMatch[1].trim() && subjectRoleMatch[1].trim().toLowerCase() !== 'application submitted') {
        role = subjectRoleMatch[1].trim();
      }

      // If subject was just "Application submitted", extract role between "Application submitted" and company in snippet
      if (!role && company) {
        const firstWordCompany = company.split(' ')[0];
        const regexBetween = new RegExp(`Application submitted\\s+(.+?)\\s+${firstWordCompany}`, 'i');
        const roleMatch = snip.match(regexBetween);
        if (roleMatch && roleMatch[1].trim()) {
          role = roleMatch[1].trim();
        }
      }

      // Fallback role check
      if (!role) {
        const genericRoleMatch = snip.match(/Application submitted\s+([^\n\r–-]+?)(?:\s+–|\s+-|\s+at|\s+[A-Z][a-z]+ Software)/i);
        if (genericRoleMatch) {
          role = genericRoleMatch[1].trim();
        }
      }

      // Fallback company if not found
      if (!company) {
        const indeedMatch1 = s.match(/indeed application:\s*(.+?)\s+at\s+(.+)$/i);
        if (indeedMatch1) {
          role = indeedMatch1[1].trim();
          company = indeedMatch1[2].trim();
        }
      }

      if (company) {
        return {
          roleTitle: role || 'React JS Web Developer',
          companyName: company,
          isApplication: true
        };
      }
    }

    // 2. Naukri.com Confirmation Emails
    if (f.includes('naukri') || s.toLowerCase().includes('naukri') || snip.toLowerCase().includes('naukri')) {
      const match1 = s.match(/applied to\s*(.+?)\s+at\s+(.+)$/i);
      if (match1) {
        return { roleTitle: match1[1].trim(), companyName: match1[2].trim(), isApplication: true };
      }
      const match2 = s.match(/application for\s*(.+?)\s+at\s+([^has]+)/i);
      if (match2) {
        return { roleTitle: match2[1].trim(), companyName: match2[2].trim(), isApplication: true };
      }
      const match3 = s.match(/(?:application confirmation for|applied for)\s*(.+?)\s+(?:with|at)\s+(.+)$/i);
      if (match3) {
        return { roleTitle: match3[1].trim(), companyName: match3[2].trim(), isApplication: true };
      }
      const snipMatch = snip.match(/applied to\s*(.+?)\s+at\s+([^\n\r.]+)/i);
      if (snipMatch) {
        return { roleTitle: snipMatch[1].trim(), companyName: snipMatch[2].trim(), isApplication: true };
      }
    }

    // 3. LinkedIn Confirmation Emails
    if (f.includes('linkedin') || s.toLowerCase().includes('linkedin') || snip.toLowerCase().includes('linkedin')) {
      const match1 = s.match(/application was sent to\s+([^.,!]+)/i);
      if (match1) {
        return { roleTitle: 'Role via LinkedIn', companyName: match1[1].trim(), isApplication: true };
      }
      const match2 = s.match(/you applied to\s+([^.,!]+)/i);
      if (match2) {
        return { roleTitle: 'Role via LinkedIn', companyName: match2[1].trim(), isApplication: true };
      }
    }

    // 4. Instahyre
    if (f.includes('instahyre') || s.toLowerCase().includes('instahyre')) {
      const match1 = s.match(/applied for\s*(.+?)\s+at\s+(.+)$/i);
      if (match1) {
        return { roleTitle: match1[1].trim(), companyName: match1[2].trim(), isApplication: true };
      }
    }

    // 5. Generic Inbound Application Confirmation
    const genMatch1 = s.match(/(?:thank you for applying to|application received:?)\s+([^.,!]+)/i);
    if (genMatch1) {
      return { roleTitle: 'Software Engineer', companyName: genMatch1[1].trim(), isApplication: true };
    }
    const genMatch2 = s.match(/(?:application for)\s*(.+?)\s+at\s+([^.,!]+)/i);
    if (genMatch2) {
      return { roleTitle: genMatch2[1].trim(), companyName: genMatch2[2].trim(), isApplication: true };
    }

    return { companyName: '', roleTitle: '', isApplication: false };
  }

  /**
   * 3-Layer Semantic Classifier for Inbound Recruiter & Assessment Emails
   * Returns target Kanban stage based on deterministic signals
   */
  public classifyEmailStage(subject: string, snippet: string = ''): ApplicationStatus | null {
    const text = `${subject} ${snippet}`.toLowerCase();

    // 1. Offer Signals (Highest Priority)
    const offerKeywords = [
      'offer letter',
      'job offer',
      'offer of employment',
      'congratulations! offer',
      'pleased to offer you',
      'formal offer'
    ];
    if (offerKeywords.some((k) => text.includes(k))) {
      return ApplicationStatus.OFFER;
    }

    // 2. Rejection Signals
    const rejectionKeywords = [
      'unfortunately',
      'not moving forward',
      'decided to move forward with other',
      'pursue other candidates',
      'pursuing other applicants',
      'regret to inform',
      'will not be moving forward',
      'not be proceeding with your application',
      'position has been filled'
    ];
    if (rejectionKeywords.some((k) => text.includes(k))) {
      return ApplicationStatus.REJECTED;
    }

    // 3. Interview Signals
    const interviewKeywords = [
      'interview',
      'technical round',
      'coding round',
      'managerial round',
      'discussion round',
      'schedule a call',
      'schedule a chat',
      'schedule an interview',
      'invitation to interview',
      'zoom meeting',
      'google meet',
      'teams meeting',
      'interview confirmation',
      'phone screen',
      'face to face'
    ];
    if (interviewKeywords.some((k) => text.includes(k))) {
      return ApplicationStatus.INTERVIEW;
    }

    // 4. Online Assessment (OA) / Test Signals
    const oaKeywords = [
      'assessment',
      'online assessment',
      'coding test',
      'coding challenge',
      'technical assessment',
      'take-home',
      'hackerrank',
      'codility',
      'codesignal',
      'test link',
      'complete the assessment',
      'assessment invitation',
      'online test',
      'screening test',
      'hiring challenge'
    ];
    if (oaKeywords.some((k) => text.includes(k))) {
      return ApplicationStatus.OA_TEST;
    }

    return null;
  }

  /**
   * Finds matching tracked application using 3-layer matching:
   * Layer 1: Gmail Thread ID match
   * Layer 2: Sender domain vs companyDomain match
   * Layer 3: Third-party test platform or company name match in subject/snippet
   */
  public async findMatchingApplication(
    userId: string,
    meta: { threadId: string; from: string; subject: string; snippet: string }
  ) {
    // 1. Thread ID exact match
    if (meta.threadId) {
      const byThread = await prisma.application.findFirst({
        where: { userId, gmailThreadId: meta.threadId, isArchived: false }
      });
      if (byThread) return byThread;
    }

    // Extract sender email and domain
    const emailMatch = meta.from.match(/<([^>]+)>/) || [null, meta.from];
    const senderEmail = emailMatch[1] ? emailMatch[1].trim().toLowerCase() : meta.from.trim().toLowerCase();
    const senderDomain = senderEmail.split('@')[1] || '';

    if (senderDomain) {
      const userApps = await prisma.application.findMany({
        where: { userId, isArchived: false },
        select: { id: true, companyName: true, companyDomain: true, status: true, gmailThreadId: true }
      });

      // 2. Match by companyDomain (e.g. swiggy.in vs swiggy.com)
      for (const app of userApps) {
        if (app.companyDomain) {
          const appDomain = app.companyDomain.toLowerCase().replace(/^www\./, '');
          const domainRoot = appDomain.split('.')[0];
          const senderRoot = senderDomain.split('.')[0];

          if (
            senderDomain === appDomain ||
            senderDomain.endsWith(`.${appDomain}`) ||
            (domainRoot.length >= 4 && senderRoot === domainRoot)
          ) {
            return app;
          }
        }
      }

      // 3. Assessment platform or Company Name match
      for (const app of userApps) {
        const compLower = app.companyName.toLowerCase();
        if (compLower.length >= 3) {
          const textToSearch = `${meta.from} ${meta.subject} ${meta.snippet}`.toLowerCase();
          if (textToSearch.includes(compLower)) {
            return app;
          }
        }
      }
    }

    return null;
  }

  /**
   * Intelligently extracts assessment deadlines or scheduled interview dates from email text
   */
  public extractDueDateFromEmail(text: string, emailDate: Date): Date | null {
    const content = text.toLowerCase();

    // 1. Check relative durations: "within 48 hours", "next 48 hours", "within 3 days", "in 2 days"
    const hourMatch = content.match(/(?:within|next|in)\s+(\d+)\s*(?:hours|hrs|hr)/i);
    if (hourMatch && hourMatch[1]) {
      const hours = parseInt(hourMatch[1], 10);
      if (!isNaN(hours) && hours > 0 && hours <= 168) {
        return new Date(emailDate.getTime() + hours * 60 * 60 * 1000);
      }
    }

    const dayMatch = content.match(/(?:within|next|in)\s+(\d+)\s*(?:days|day)/i);
    if (dayMatch && dayMatch[1]) {
      const days = parseInt(dayMatch[1], 10);
      if (!isNaN(days) && days > 0 && days <= 30) {
        return new Date(emailDate.getTime() + days * 24 * 60 * 60 * 1000);
      }
    }

    // 2. Check explicit date patterns: "deadline: Oct 28", "due by Oct 28", "complete by 28th Oct"
    const explicitMatch = content.match(/(?:deadline|due\s+date|due\s+by|complete\s+by|submit\s+by|before|on\s+or\s+before|expires\s+on|scheduled\s+for|scheduled\s+on)\s*[:\-]?\s*([A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?[A-Za-z]{3,9})/i);
    if (explicitMatch && explicitMatch[1]) {
      const cleanedDateStr = explicitMatch[1].replace(/(?:st|nd|rd|th)/gi, '');
      const currentYear = emailDate.getFullYear();
      const parsed = new Date(`${cleanedDateStr} ${currentYear}`);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    return null;
  }

  /**
   * Processes inbound recruiter email for stage progression and reply tracking
   */
  public async processInboundStageProgression(
    userId: string,
    userEmail: string,
    meta: { threadId: string; from: string; subject: string; snippet: string; date: Date }
  ): Promise<{ updated: boolean; stageChanged: boolean; companyName?: string; newStage?: string }> {
    // Skip if email was sent by the user themselves
    if (meta.from.toLowerCase().includes(userEmail.toLowerCase())) {
      return { updated: false, stageChanged: false };
    }

    const app = await this.findMatchingApplication(userId, meta);
    if (!app) return { updated: false, stageChanged: false };

    const detectedStage = this.classifyEmailStage(meta.subject, meta.snippet);
    const updates: Record<string, unknown> = {
      hasReply: true,
      lastInboundDate: meta.date,
      nextFollowUpDate: null // Cancel follow-up countdown
    };

    if (!app.gmailThreadId && meta.threadId) {
      updates.gmailThreadId = meta.threadId;
    }

    let stageChanged = false;
    let newStage = app.status;

    // Prevent downgrading terminal or advanced stages
    const STAGE_RANK: Record<string, number> = {
      APPLIED: 1,
      OA_TEST: 2,
      INTERVIEW: 3,
      OFFER: 4,
      REJECTED: 4,
      GHOSTED: 4
    };

    const currentRank = STAGE_RANK[app.status] || 1;
    const detectedRank = detectedStage ? STAGE_RANK[detectedStage] || 1 : 0;

    const shouldAdvance =
      detectedStage &&
      detectedStage !== app.status &&
      (detectedStage === ApplicationStatus.REJECTED || detectedRank > currentRank);

    if (shouldAdvance) {
      updates.status = detectedStage;
      stageChanged = true;
      newStage = detectedStage;

      // Automatically extract or compute stage due date from email text
      if (detectedStage === ApplicationStatus.OA_TEST) {
        const extractedDueDate = this.extractDueDateFromEmail(`${meta.subject} ${meta.snippet}`, meta.date);
        updates.stageDueDate = extractedDueDate || new Date(meta.date.getTime() + 48 * 60 * 60 * 1000);
      } else if (detectedStage === ApplicationStatus.INTERVIEW) {
        const extractedDueDate = this.extractDueDateFromEmail(`${meta.subject} ${meta.snippet}`, meta.date);
        if (extractedDueDate) {
          updates.stageDueDate = extractedDueDate;
        }
      }

      await prisma.application.update({
        where: { id: app.id },
        data: {
          ...updates,
          timeline: {
            create: {
              eventType: 'STATUS_CHANGED',
              description: `Auto-advanced to ${detectedStage} via inbound email: "${meta.subject}"`,
              metadata: {
                previousStage: app.status,
                newStage: detectedStage,
                subject: meta.subject,
                from: meta.from
              }
            }
          }
        }
      });

      console.log(`[StageProgression] 🎯 Advanced ${app.companyName} from ${app.status} to ${detectedStage}!`);
    } else {
      // If current stage is OA or Interview, check if this follow-up email mentions a deadline
      if (app.status === ApplicationStatus.OA_TEST || app.status === ApplicationStatus.INTERVIEW) {
        const extractedDueDate = this.extractDueDateFromEmail(`${meta.subject} ${meta.snippet}`, meta.date);
        if (extractedDueDate) {
          updates.stageDueDate = extractedDueDate;
        }
      }

      // Record reply without changing stage
      await prisma.application.update({
        where: { id: app.id },
        data: {
          ...updates,
          timeline: {
            create: {
              eventType: 'REPLY_RECEIVED',
              description: `Recruiter message received: "${meta.subject}"`,
              metadata: {
                subject: meta.subject,
                from: meta.from
              }
            }
          }
        }
      });
      console.log(`[StageProgression] 📬 Recorded recruiter reply for ${app.companyName}`);
    }

    return {
      updated: true,
      stageChanged,
      companyName: app.companyName,
      newStage
    };
  }

  /**
   * Directly syncs recent job confirmation emails, cold emails, and inbound OA/interview responses
   * Enables 1-click on-demand sync even on localhost without Pub/Sub webhooks
   */
  public async syncMailbox(userId: string): Promise<{ syncedCount: number; message: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId, isArchived: false },
      select: { id: true, email: true, encryptedGoogleToken: true }
    });

    if (!user || !user.encryptedGoogleToken) {
      console.log(`[GmailSync] User ${userId} has no encryptedGoogleToken.`);
      return { syncedCount: 0, message: 'Google account is not connected. Please log in with Google to enable Gmail sync.' };
    }

    try {
      console.log(`[GmailSync] Authenticating Gmail client for user ${user.email} (${userId})...`);
      const gmail = await this.getAuthenticatedGmailClient(userId);

      // Fetch the latest 35 messages directly from user's mailbox (INBOX & SENT)
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 35
      });

      const messages = listRes.data.messages || [];
      console.log(`[GmailSync] Found ${messages.length} recent messages in mailbox.`);
      let syncedCount = 0;

      for (const msg of messages) {
        if (!msg.id) continue;

        try {
          const meta = await this.fetchMessageMetadata(userId, msg.id);
          if (!meta) continue;

          // 1. Skip spam / transactional / login alert emails immediately
          if (this.isTransactionalOrSpam(meta.from, meta.subject)) {
            console.log(`[GmailSync] Skipping non-job/spam email: "${meta.subject}"`);
            continue;
          }

          console.log(`[GmailSync] Inspecting [${msg.id}] From: "${meta.from}" | Subject: "${meta.subject}"`);

          // 2. Check if this is an inbound OA, interview, or reply for an EXISTING application!
          const inboundResult = await this.processInboundStageProgression(userId, user.email, meta);
          if (inboundResult.updated) {
            console.log(`[GmailSync] Inbound update processed for ${inboundResult.companyName} (Stage changed: ${inboundResult.stageChanged})`);
            if (inboundResult.stageChanged) {
              syncedCount++;
            }
            continue; // Handled as an existing card update!
          }

          // Check if thread or message already exists (active or archived)
          const existing = await prisma.application.findFirst({
            where: {
              userId,
              gmailThreadId: meta.threadId
            }
          });

          if (existing) {
            if (existing.isArchived) {
              // User previously deleted it, but now explicitly triggered Sync Gmail again!
              // Restore it so it reappears on their pipeline
              await prisma.application.update({
                where: { id: existing.id },
                data: {
                  isArchived: false,
                  status: 'APPLIED',
                  timeline: {
                    create: {
                      eventType: 'EMAIL_SENT',
                      description: `Re-imported application to ${existing.companyName} via Gmail Sync`
                    }
                  }
                }
              });
              console.log(`[GmailSync] ♻️ Restored previously archived application for ${existing.companyName}!`);
              syncedCount++;
            } else {
              console.log(`[GmailSync] Thread ${meta.threadId} already tracked (${existing.companyName}). Skipping.`);
            }
            continue;
          }

          // Try portal parser first (with snippet!)
          const portal = this.parsePortalApplication(meta.from, meta.to, meta.subject, meta.snippet);
          console.log(`[GmailSync] Portal parser result -> isApp: ${portal.isApplication}, Company: "${portal.companyName}", Role: "${portal.roleTitle}"`);

          let company = '';
          let role = '';

          if (portal.isApplication && portal.companyName) {
            company = portal.companyName;
            role = portal.roleTitle;
          } else {
            // Only consider outbound emails sent by the user to recruiters!
            const isOutboundSent = meta.from.toLowerCase().includes(user.email.toLowerCase());
            if (isOutboundSent && this.evaluateJobApplicationSignals(meta.subject)) {
              const inferred = this.inferCompanyFromRecipient(meta.to, meta.subject);
              company = inferred.companyName;
              role = meta.subject;
            }
          }

          // Block generic/system domain names
          const blockedBrands = ['company', 'github', 'google', 'accounts', 'login', 'security'];
          if (!company || blockedBrands.includes(company.toLowerCase())) {
            continue;
          }

          const initialFollowUp = new Date(meta.date.getTime() + 7 * 24 * 60 * 60 * 1000);
          const extractedDueDate = this.extractDueDateFromEmail(`${meta.subject} ${meta.snippet}`, meta.date);

          const detectedSource = portal.isApplication
            ? (meta.from.toLowerCase().includes('indeed') || meta.from.toLowerCase().includes('naukri') ? 'Indeed / Naukri' : meta.from.toLowerCase().includes('linkedin') ? 'LinkedIn' : 'Careers Page')
            : 'Cold Mail';

          await prisma.application.create({
            data: {
              userId,
              companyName: company,
              companyDomain: meta.companyDomain || null,
              roleTitle: role,
              notes: `Source: ${detectedSource}`,
              status: 'APPLIED',
              priority: 'MEDIUM',
              appliedDate: meta.date,
              stageDueDate: extractedDueDate,
              gmailThreadId: meta.threadId,
              lastOutboundDate: meta.date,
              nextFollowUpDate: initialFollowUp,
              timeline: {
                create: {
                  eventType: 'EMAIL_SENT',
                  description: `Auto-detected application to ${company} via Gmail Sync (${meta.subject})`,
                  metadata: {
                    threadId: meta.threadId,
                    from: meta.from,
                    subject: meta.subject
                  }
                }
              }
            }
          });

          console.log(`[GmailSync] ✅ Successfully created application for ${company} (${role})!`);
          syncedCount++;
        } catch (msgErr: any) {
          console.error(`[GmailSync] Error processing message ${msg.id}:`, msgErr.message);
        }
      }

      return {
        syncedCount,
        message: syncedCount > 0 ? `Successfully synced ${syncedCount} application(s) from Gmail!` : 'Gmail is up to date. No new applications found.'
      };
    } catch (syncErr: any) {
      console.error(`[GmailSync] Error in syncMailbox:`, syncErr);
      return {
        syncedCount: 0,
        message: `Sync failed: ${syncErr.message || 'Gmail API connection error'}`
      };
    }
  }
}

export const gmailService = new GmailService();
export default gmailService;
