/**
 * Watch Renewal BullMQ Worker
 * Automatically renews Google users.watch() subscriptions before the 7-day expiration deadline
 */
import { Worker } from 'bullmq';
import { prisma } from '@applytrack/database';
import { QUEUE_NAMES, redisConnectionOptions } from '../config/bullmq.js';
import { gmailService } from '../services/gmail.service.js';

export function initWatchRenewalWorker(): Worker {
  const worker = new Worker(
    QUEUE_NAMES.WATCH_RENEWAL,
    async () => {
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

      for (const user of usersToRenew) {
        try {
          await gmailService.setupWatch(user.id);
          renewedCount++;
        } catch {
          // If token revoked, continue to next user
        }
      }

      return { renewedCount };
    },
    {
      connection: redisConnectionOptions,
      concurrency: 2
    }
  );

  return worker;
}

export default initWatchRenewalWorker;
