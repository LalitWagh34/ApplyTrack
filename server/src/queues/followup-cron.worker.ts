/**
 * Follow-Up Radar BullMQ Cron Worker
 * Daily recurring worker that identifies dormant threads (4/8/14 days without reply),
 * triggers notifications, and tracks candidates.
 */
import { Worker } from 'bullmq';
import { prisma, ApplicationStatus } from '@applytrack/database';
import { QUEUE_NAMES, redisConnectionOptions } from '../config/bullmq.js';

export function initFollowUpCronWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.FOLLOW_UP,
    async () => {
      const now = new Date();

      // Find all pending applications across all active users where follow-up date has arrived
      const pendingFollowUps = await prisma.application.findMany({
        where: {
          isArchived: false,
          hasReply: false,
          nextFollowUpDate: { lte: now },
          status: {
            notIn: [ApplicationStatus.OFFER, ApplicationStatus.REJECTED, ApplicationStatus.GHOSTED]
          }
        },
        select: {
          id: true,
          userId: true,
          companyName: true,
          roleTitle: true,
          followUpCount: true,
          nextFollowUpDate: true
        }
      });

      console.log(`[Follow-Up Radar] Found ${pendingFollowUps.length} applications needing follow-up.`);

      return {
        scannedCount: pendingFollowUps.length,
        items: pendingFollowUps.map((p) => ({ id: p.id, company: p.companyName }))
      };
    },
    {
      connection: redisConnectionOptions,
      concurrency: 1
    }
  );

  return worker;
}

export default initFollowUpCronWorker;
