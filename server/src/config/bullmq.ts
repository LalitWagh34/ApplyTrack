/**
 * BullMQ Queue Definitions & Redis Connection Settings
 * Supports both local Redis and cloud providers like Upstash over TLS
 */
import { Queue, QueueOptions } from 'bullmq';
import { RedisOptions } from 'ioredis';
import { env } from './env.js';

export function getRedisOptions(): RedisOptions {
  if (env.REDIS_URL) {
    try {
      const parsed = new URL(env.REDIS_URL);
      const isTls = env.REDIS_URL.startsWith('rediss://') || parsed.hostname.includes('upstash.io');

      return {
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 6379,
        username: parsed.username ? decodeURIComponent(parsed.username) : 'default',
        password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        ...(isTls && { tls: { rejectUnauthorized: false } })
      };
    } catch {
      // Fallback if URL parsing fails
      return {
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        password: env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: null,
        enableReadyCheck: false
      };
    }
  }

  const isUpstash = env.REDIS_HOST.includes('upstash.io');

  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(isUpstash && { tls: { rejectUnauthorized: false } })
  };
}

export const redisConnectionOptions = getRedisOptions();

const defaultQueueOptions: QueueOptions = {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      count: 100
    },
    removeOnFail: {
      count: 500
    }
  }
};

// Queue Names Constants
export const QUEUE_NAMES = {
  GMAIL_INGEST: 'gmail-ingest-queue',
  FOLLOW_UP: 'followup-radar-queue',
  WATCH_RENEWAL: 'watch-renewal-queue'
} as const;

// Queue Instances
export const gmailIngestQueue = new Queue(QUEUE_NAMES.GMAIL_INGEST, defaultQueueOptions);
export const followUpQueue = new Queue(QUEUE_NAMES.FOLLOW_UP, defaultQueueOptions);
export const watchRenewalQueue = new Queue(QUEUE_NAMES.WATCH_RENEWAL, defaultQueueOptions);

export const allQueues = [gmailIngestQueue, followUpQueue, watchRenewalQueue];
