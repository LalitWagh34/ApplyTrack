import assert from 'node:assert/strict';
import test from 'node:test';
import {
  scheduleDailyWatchRenewal,
  WatchRenewalJobPayload,
  WatchRenewalQueueScheduler
} from '../queues/watch-renewal.schedule.js';

test('registers one retryable daily Gmail watch-renewal scan', async () => {
  const calls: Array<{ name: string; data: WatchRenewalJobPayload; options: unknown }> = [];
  const queue: WatchRenewalQueueScheduler = {
    add: async (name, data, options) => {
      calls.push({ name, data, options });
      return undefined;
    }
  };

  await scheduleDailyWatchRenewal(queue);

  assert.deepEqual(calls, [{
    name: 'renew-expiring-watches',
    data: { trigger: 'daily-scan' },
    options: {
      jobId: 'daily-watch-renewal',
      repeat: { pattern: '0 3 * * *', tz: 'UTC' },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    }
  }]);
});
