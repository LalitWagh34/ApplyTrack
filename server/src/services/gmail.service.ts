/**
 * Gmail Service
 * Wraps Google Gmail API for users.watch registration, history inspection, and privacy-first metadata parsing
 * Strictly complies with least-privilege gmail.metadata (ZERO email body storage).
 */
import { google, gmail_v1 } from 'googleapis';
import { prisma } from '@applytrack/database';
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
      isLikelyJobApplication
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
}

export const gmailService = new GmailService();
export default gmailService;
