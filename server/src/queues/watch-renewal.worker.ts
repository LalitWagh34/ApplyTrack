/**
 * Watch Renewal BullMQ Worker
 * Automatically renews Google users.watch() subscriptions before the 7-day expiration deadline
 */
import { Job, Worker } from 'bullmq';
import { prisma } from '@applytrack/database';
import { QUEUE_NAMES, redisConnectionOptions, WatchRenewalJobPayload } from '../config/bullmq.js';
import { gmailService } from '../services/gmail.service.js';
import { startPeriodicWorker } from './worker-lifecycle.js';

export function initWatchRenewalWorker(): { close: () => Promise<void> } {
  return startPeriodicWorker(createWatchRenewalWorker, 5 * 60 * 1000, error => {
    console.error('[WatchRenewal] Failed to close maintenance worker:', error);
  });
}

function createWatchRenewalWorker(): Worker {
  const worker = new Worker<WatchRenewalJobPayload>(
    QUEUE_NAMES.WATCH_RENEWAL,
    async (_job: Job<WatchRenewalJobPayload>) => {
      // Find all users with Google connected whose watch expires in the next 48 hours
      const threshold = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const usersToRenew = await prisma.user.findMany({
        where: {
          isArchived: false,
          encryptedGoogleToken: { not: null },
          OR: [
            { googleWatchExpiry: null },
            { googleWatchExpiry: { lte: threshold } }
          ]
        },
        select: { id: true, email: true }
      });

      let renewedCount = 0;
      let failedCount = 0;

      for (const user of usersToRenew) {
        try {
          await gmailService.setupWatch(user.id);
          renewedCount++;
      } catch (error) {
          failedCount++;
          console.error(`[WatchRenewal] Failed to renew Gmail watch for user ${user.id}:`, error);
        }
      }

      // Throw after processing every due user so BullMQ retries the idempotent scan.
      if (failedCount > 0) {
        throw new Error(`Failed to renew ${failedCount} Gmail watch subscription(s)`);
      }

      return { renewedCount };
    },
    {
      connection: redisConnectionOptions,
      concurrency: 2
    }
  );

  worker.on('error', error => console.error('[WatchRenewal] Worker error:', error));
  return worker;
}

export default initWatchRenewalWorker;
