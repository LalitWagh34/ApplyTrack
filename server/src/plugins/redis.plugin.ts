/**
 * Redis Fastify Plugin
 * Injects shared ioredis client into Fastify instance (supports local Redis & Upstash TLS)
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import Redis, { RedisOptions } from 'ioredis';
import { env } from '../config/env.js';

async function redisPlugin(fastify: FastifyInstance): Promise<void> {
  let redis: Redis;

  if (env.REDIS_URL) {
    const isTls = env.REDIS_URL.startsWith('rediss://') || env.REDIS_URL.includes('upstash.io');
    redis = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(isTls && { tls: { rejectUnauthorized: false } }),
      retryStrategy: (times) => Math.min(times * 100, 3000)
    });
  } else {
    const isUpstash = env.REDIS_HOST.includes('upstash.io');
    const options: RedisOptions = {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      lazyConnect: true,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      ...(isUpstash && { tls: { rejectUnauthorized: false } }),
      retryStrategy: (times) => Math.min(times * 100, 3000)
    };
    redis = new Redis(options);
  }

  redis.on('error', (err) => {
    fastify.log.error({ err }, 'Redis connection error:');
  });

  redis.on('connect', () => {
    fastify.log.info('Redis connected successfully.');
  });

  // Attempt connection
  try {
    await redis.connect();
  } catch (err) {
    fastify.log.warn({ err }, 'Could not connect to Redis immediately; will retry in background.');
  }

  fastify.decorate('redis', redis);

  // Clean shutdown hook
  fastify.addHook('onClose', async (server) => {
    server.log.info('Closing Redis connection...');
    await redis.quit();
    server.log.info('Redis connection closed.');
  });
}

export default fp(redisPlugin, {
  name: 'redis-plugin'
});
