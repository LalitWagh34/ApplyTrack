/**
 * Email Ingest BullMQ Worker
 * Processes background mailbox updates, identifies outgoing job applications,
 * auto-tracks candidates, and marks inbound replies to cancel follow-up timers.
 */
import { Worker, Job } from 'bullmq';
import { prisma, ApplicationStatus, PriorityLevel } from '@applytrack/database';
import { QUEUE_NAMES, redisConnectionOptions } from '../config/bullmq.js';
import { gmailService } from '../services/gmail.service.js';

interface EmailIngestJobPayload {
  emailAddress: string;
  historyId: string;
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

      // 2. Fetch mailbox delta since startHistoryId
      const changes = await gmailService.fetchHistoryChanges(user.id, startHistoryId);

      // 3. Update user's latest historyId pointer
      if (changes.latestHistoryId && changes.latestHistoryId !== user.googleHistoryId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleHistoryId: changes.latestHistoryId }
        });
      }

      let newTrackedCount = 0;
      let replyDetectedCount = 0;

      // 4. Process OUTBOUND Sent Messages (Detect Job Applications)
      for (const messageId of changes.sentMessageIds) {
        try {
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

          if (!existing && meta.isLikelyJobApplication) {
            // Auto-create application card
            const initialFollowUp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

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

            newTrackedCount++;
          }
        } catch {
          // Continue processing other messages
        }
      }

      // 5. Process INBOUND Messages (Recruiter Reply & Stage Progression Radar)
      for (const messageId of changes.inboxMessageIds) {
        try {
          const meta = await gmailService.fetchMessageMetadata(user.id, messageId);
          if (!meta) continue;

          // Skip spam/transactional
          if (gmailService.isTransactionalOrSpam(meta.from, meta.subject)) continue;

          // Process 3-layer domain match and OA/Interview progression
          const res = await gmailService.processInboundStageProgression(user.id, user.email, meta);
          if (res.updated) {
            replyDetectedCount++;
          }
        } catch {
          // Continue processing other messages
        }
      }

      return {
        processed: true,
        newTrackedCount,
        replyDetectedCount
      };
    },
    {
      connection: redisConnectionOptions,
      concurrency: 5
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ] Ingest job ${job?.id} failed:`, err);
  });

  return worker;
}

export default initEmailIngestWorker;
