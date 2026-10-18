/**
 * Follow-Ups Service
 * 7-Day Follow-Up Radar, contextual AI draft generator, and reminder lifecycle
 */
import { prisma, ApplicationStatus } from '@applytrack/database';

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

    return pending;
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

    const { companyName, roleTitle, gmailThreadId } = application;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true }
    });
    const senderName = user?.fullName || 'Best';

    let subject = `Following up: Application for ${roleTitle} at ${companyName}`;
    let body = '';

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

    return {
      applicationId,
      companyName,
      roleTitle,
      gmailThreadId,
      tone,
      subject,
      body
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
