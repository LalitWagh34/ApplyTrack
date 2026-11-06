/**
 * Email Ingest BullMQ Worker
 * Processes background mailbox updates, identifies outgoing job applications,
 * auto-tracks candidates, and marks inbound replies to cancel follow-up timers.
 */
import { Worker, Job } from 'bullmq';
import { prisma, ApplicationStatus, PriorityLevel } from '@applytrack/database';
import { QUEUE_NAMES, redisConnectionOptions } from '../config/bullmq.js';
import { gmailService } from '../services/gmail.service.js';
import { isUniqueConstraintViolation, shouldAdvanceHistoryCursor } from '../services/gmail-consistency.utils.js';

interface EmailIngestJobPayload {
  emailAddress: string;
  historyId: string;
}

interface MessageChangeSet {
  sentMessageIds: string[];
  inboxMessageIds: string[];
}

export function initEmailIngestWorker(): Worker {
  const worker = new Worker<EmailIngestJobPayload>(
    QUEUE_NAMES.GMAIL_INGEST,
    async (job: Job<EmailIngestJobPayload>) => {
      const { emailAddress, historyId } = job.data;

      // 1. Find user by email
      const user = await prisma.user.findUnique({
        where: { email: emailAddress, isArchived: false },
        select: {
          id: true,
          email: true,
          googleHistoryId: true,
          encryptedGoogleToken: true
        }
      });

      if (!user || !user.encryptedGoogleToken) {
        return { status: 'user_skipped_no_google' };
      }

      const startHistoryId = user.googleHistoryId || historyId;

      let newTrackedCount = 0;
      let replyDetectedCount = 0;

      const processChanges = async (changes: MessageChangeSet): Promise<void> => {
        // Process OUTBOUND Sent Messages (Detect Job Applications)
        for (const messageId of changes.sentMessageIds) {
          const meta = await gmailService.fetchMessageMetadata(user.id, messageId);
          if (!meta) continue;

          // Check if thread is already tracked
          const existing = await prisma.application.findFirst({
            where: {
              userId: user.id,
              OR: [
                { gmailThreadId: meta.threadId },
                {
                  companyName: { equals: meta.companyName, mode: 'insensitive' },
                  createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                }
              ]
            }
          });

          if (existing) {
            if (existing.isArchived) {
              await prisma.application.update({
                where: { id: existing.id },
                data: {
                  isArchived: false,
                  status: ApplicationStatus.APPLIED
                }
              });
              newTrackedCount++;
            }
            continue;
          }

          if (meta.isLikelyJobApplication) {
            // Auto-create application card
            const initialFollowUp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            try {
              await prisma.application.create({
                data: {
                userId: user.id,
                companyName: meta.companyName,
                companyDomain: meta.companyDomain || null,
                roleTitle: meta.subject || 'Application via Cold Email',
                notes: 'Source: Cold Mail',
                status: ApplicationStatus.APPLIED,
                priority: PriorityLevel.MEDIUM,
                appliedDate: meta.date,
                gmailThreadId: meta.threadId,
                lastOutboundDate: meta.date,
                nextFollowUpDate: initialFollowUp,
                timeline: {
                  create: {
                    eventType: 'EMAIL_SENT',
                    description: `Auto-detected application to ${meta.companyName} via Gmail sync`,
                    metadata: {
                      threadId: meta.threadId,
                      recipient: meta.to,
                      subject: meta.subject
                    }
                  }
                }
                }
              });
            } catch (error: unknown) {
              if (!isUniqueConstraintViolation(error)) throw error;

              const concurrentApplication = await prisma.application.findFirst({
                where: { userId: user.id, gmailThreadId: meta.threadId }
              });
              if (!concurrentApplication) throw error;
              continue;
            }

            newTrackedCount++;
          }
        }

        // Process INBOUND Messages (Recruiter Reply & Stage Progression Radar)
        for (const messageId of changes.inboxMessageIds) {
          const meta = await gmailService.fetchMessageMetadata(user.id, messageId);
          if (!meta) continue;

          // Skip spam/transactional
          if (gmailService.isTransactionalOrSpam(meta.from, meta.subject)) continue;

          // Process 3-layer domain match and OA/Interview progression
          const res = await gmailService.processInboundStageProgression(user.id, user.email, meta);
          if (res.updated) {
            replyDetectedCount++;
          }
        }
      };

      // Read and process a delta first. A cursor is never advanced before all
      // relevant messages have completed successfully.
      const history = await gmailService.fetchHistoryChanges(user.id, startHistoryId);
      let latestHistoryId: string;

      if (history.status === 'expired') {
        // The initial snapshot covers retained mailbox messages. Reading history
        // from its captured cursor afterwards covers messages arriving while the
        // snapshot is enumerated and processed.
        const snapshot = await gmailService.fetchMailboxSnapshot(user.id);
        await processChanges(snapshot);

        const catchUp = await gmailService.fetchHistoryChanges(user.id, snapshot.historyId);
        if (catchUp.status === 'expired') {
          throw new Error('Gmail history expired again during mailbox recovery.');
        }

        await processChanges(catchUp);
        latestHistoryId = catchUp.latestHistoryId;
      } else {
        await processChanges(history);
        latestHistoryId = history.latestHistoryId;
      }

      // Equivalent per-user serialization: only the job that read the current
      // cursor may move it. Overlapping/out-of-order jobs cannot skip history.
      if (shouldAdvanceHistoryCursor({
        storedHistoryId: user.googleHistoryId,
        startHistoryId,
        nextHistoryId: latestHistoryId
      })) {
        await prisma.user.updateMany({
          where: { id: user.id, googleHistoryId: user.googleHistoryId },
          data: { googleHistoryId: latestHistoryId }
        });
      }

      return {
        processed: true,
        newTrackedCount,
        replyDetectedCount
      };
    },
    {
      connection: redisConnectionOptions,
      drainDelay: 60,
      concurrency: 5
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ] Ingest job ${job?.id} failed:`, err);
  });

  return worker;
}

export default initEmailIngestWorker;
