import type { Queue } from 'bullmq';

export interface WatchRenewalJobPayload {
  trigger: 'daily-scan';
}

export interface WatchRenewalQueueScheduler {
  add: (
    name: string,
    data: WatchRenewalJobPayload,
    options: {
      jobId: string;
      repeat: { pattern: string; tz: string };
      attempts: number;
      backoff: { type: 'exponential'; delay: number };
    }
  ) => Promise<unknown>;
}

/**
 * Registers a stable daily scan. BullMQ stores one repeat definition per queue/job configuration,
 * so calling this at every process boot is safe and idempotent.
 */
export async function scheduleDailyWatchRenewal(queue: WatchRenewalQueueScheduler): Promise<void> {
  await queue.add(
    'renew-expiring-watches',
    { trigger: 'daily-scan' },
    {
      jobId: 'daily-watch-renewal',
      repeat: {
        pattern: '0 3 * * *',
        tz: 'UTC'
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    }
  );
}

export function createWatchRenewalScheduler(queue: Queue): WatchRenewalQueueScheduler {
  return queue;
}
