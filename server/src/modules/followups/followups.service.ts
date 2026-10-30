import { prisma, ApplicationStatus } from '@applytrack/database';
import { cryptoService } from '../../services/crypto.service.js';

export class FollowUpsService {
  /**
   * Fetches applications where follow-up date has passed and no reply has been received
   */
  public async getPendingFollowUps(userId: string) {
    const now = new Date();

    const pending = await prisma.application.findMany({
      where: {
        userId,
        isArchived: false,
        hasReply: false,
        nextFollowUpDate: { lte: now },
        status: {
          notIn: [ApplicationStatus.OFFER, ApplicationStatus.REJECTED]
        }
      },
      orderBy: { nextFollowUpDate: 'asc' },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        appliedDate: true,
        nextFollowUpDate: true,
        followUpCount: true,
        gmailThreadId: true,
        priority: true
      }
    });

    return pending.map((item) => ({
      ...item,
      id: item.id,
      applicationId: item.id,
      companyName: cryptoService.safeDecrypt(item.companyName) || item.companyName,
      roleTitle: cryptoService.safeDecrypt(item.roleTitle) || item.roleTitle
    }));
  }

  /**
   * Calls Groq API to generate a hyper-personalized follow-up draft using Llama 3.3 70B
   */
  private async generateWithGroq(params: {
    companyName: string;
    roleTitle: string;
    notes?: string | null;
    senderName: string;
    tone: 'polite_nudge' | 'value_add' | 'polite_breakup';
    followUpCount: number;
    userContext?: {
      targetRole?: string;
      topSkills?: string[];
      portfolioLink?: string;
      topProjects?: string[];
    };
  }): Promise<{ subject: string; body: string } | null> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return null;
    }

    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    const systemPrompt = `You are an elite, top-1% tech career strategist and executive ghostwriter.
Your task is to write a concise, punchy, hyper-effective follow-up email from a job applicant to a recruiter or hiring team.

Rules:
1. Keep the body short (under 120 words), direct, and respectful of the recruiter's time.
2. Tone instructions:
   - polite_nudge: Friendly, professional check-in on review status.
   - value_add: Highly personalized! Naturally reference how the applicant recently built or shipped a project using their featured skills (e.g. 'Since applying, I recently shipped [project/skill]...'). Mention portfolio link if provided.
   - polite_breakup: Graceful final check-in, removing pressure, keeping the door open for future roles.
3. No AI-cliche phrases ("I hope this email finds you well", "delving into", "testament", "beacon", "in today's fast-paced world").
4. Return strictly a JSON object with two keys: "subject" (string) and "body" (string with proper line breaks). Do not wrap in markdown quotes or extra text.`;

    const userPrompt = `Generate a follow-up email with the following details:
- Applicant Name: ${params.senderName}
- Target Role: ${params.userContext?.targetRole || params.roleTitle}
- Company: ${params.companyName}
- Role Applied: ${params.roleTitle}
- Tone: ${params.tone}
- Follow-up attempt number: ${params.followUpCount + 1}
${params.userContext?.topSkills?.length ? `- Applicant Featured Skills: ${params.userContext.topSkills.join(', ')}` : ''}
${params.userContext?.topProjects?.length ? `- Applicant Top Projects: ${params.userContext.topProjects.join('; ')}` : ''}
${params.userContext?.portfolioLink ? `- Applicant Portfolio Link: ${params.userContext.portfolioLink}` : ''}
${params.notes ? `- Recruiter/Role Notes: ${params.notes}` : ''}`;

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        console.warn(`[Groq AI] API responded with status ${response.status}`);
        return null;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) return null;

      const parsed = JSON.parse(content) as { subject?: string; body?: string };
      if (parsed.subject && parsed.body) {
        return {
          subject: parsed.subject.trim(),
          body: parsed.body.trim()
        };
      }
      return null;
    } catch (err) {
      console.warn('[Groq AI] Generation failed, falling back to smart template:', err);
      return null;
    }
  }

  /**
   * Generates a 1-click tailored follow-up draft based on company, role, and tone
   */
  public async generateContextualDraft(
    userId: string,
    applicationId: string,
    tone: 'polite_nudge' | 'value_add' | 'polite_breakup' = 'polite_nudge'
  ) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId, isArchived: false }
    });

    if (!application) {
      return null;
    }

    const companyName = cryptoService.safeDecrypt(application.companyName) || application.companyName;
    const roleTitle = cryptoService.safeDecrypt(application.roleTitle) || application.roleTitle;
    const notes = cryptoService.safeDecrypt(application.notes) ?? application.notes;
    const { gmailThreadId, followUpCount } = application;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, preferences: true }
    });
    const senderName = user?.fullName || 'Best';
    const userContext = (user?.preferences as {
      targetRole?: string;
      topSkills?: string[];
      portfolioLink?: string;
      topProjects?: string[];
    }) || {};

    let subject = `Following up: Application for ${roleTitle} at ${companyName}`;
    let body = '';
    let isAiGenerated = false;

    // 1. Try Groq AI Ghostwriter first
    const groqResult = await this.generateWithGroq({
      companyName,
      roleTitle,
      notes,
      senderName,
      tone,
      followUpCount,
      userContext
    });

    if (groqResult) {
      subject = groqResult.subject;
      body = groqResult.body;
      isAiGenerated = true;
    } else {
      // 2. Deterministic High-Quality Fallback Template
      switch (tone) {
        case 'value_add':
          body = `Hi Team,\n\nI wanted to quickly follow up on my recent application for the ${roleTitle} position at ${companyName}.\n\nSince applying, I’ve recently shipped a new feature/project that aligns closely with what you are building, and I’d love the opportunity to share how my experience can contribute to the team.\n\nPlease let me know if you need any additional information from my side.\n\nBest regards,\n${senderName}`;
          break;

        case 'polite_breakup':
          subject = `Checking in one last time: ${roleTitle} at ${companyName}`;
          body = `Hi Team,\n\nI know schedules get incredibly busy, so I wanted to check in one final time regarding the ${roleTitle} opening at ${companyName}.\n\nIf the position has already been filled or the team decided to move in another direction, no worries at all! I appreciate your time and hope to stay connected for future opportunities.\n\nThank you,\n${senderName}`;
          break;

        case 'polite_nudge':
        default:
          body = `Hi Team,\n\nHope you're having a productive week!\n\nI wanted to gently follow up on my application for the ${roleTitle} role at ${companyName}. I'm genuinely excited about your mission and would love to know if there are any updates regarding the next steps in the review process.\n\nLooking forward to hearing from you.\n\nWarm regards,\n${senderName}`;
          break;
      }
    }

    return {
      applicationId,
      companyName,
      roleTitle,
      gmailThreadId,
      threadId: gmailThreadId || '',
      tone,
      subject,
      body,
      isAiGenerated
    };
  }

  /**
   * Snoozes or dismisses a follow-up reminder
   */
  public async dismissReminder(userId: string, applicationId: string, snoozeDays = 7) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId, isArchived: false }
    });

    if (!application) {
      return null;
    }

    const nextDate = new Date(Date.now() + snoozeDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        nextFollowUpDate: nextDate,
        timeline: {
          create: {
            eventType: 'NOTE_ADDED',
            description: `Follow-up snoozed by ${snoozeDays} days`
          }
        }
      }
    });

    return updated;
  }

  /**
   * Logs a follow-up sent by user and schedules the next cycle (Day + 7)
   */
  public async logFollowUpSent(userId: string, applicationId: string, draftBody?: string) {
    const application = await prisma.application.findFirst({
      where: { id: applicationId, userId, isArchived: false }
    });

    if (!application) {
      return null;
    }

    const newCount = application.followUpCount + 1;
    // Max 3 follow-ups before giving up / moving to ghosted
    const nextDate = newCount < 3 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

    const [updated] = await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          followUpCount: newCount,
          lastOutboundDate: new Date(),
          nextFollowUpDate: nextDate,
          ...(newCount >= 3 && { status: ApplicationStatus.GHOSTED }),
          timeline: {
            create: {
              eventType: 'EMAIL_SENT',
              description: `Follow-up #${newCount} sent to ${application.companyName}`
            }
          }
        }
      }),
      prisma.followUpLog.create({
        data: {
          applicationId,
          attemptNumber: newCount,
          sentDate: new Date(),
          status: 'SENT',
          draftBody: draftBody || null
        }
      })
    ]);

    return updated;
  }
}

export const followUpsService = new FollowUpsService();
export default followUpsService;
