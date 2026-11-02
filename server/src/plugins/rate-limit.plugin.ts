/**
 * Lightweight Redis-backed route rate limiting with an in-process fallback.
 * Keeps limits explicit at sensitive routes without introducing another runtime dependency.
 */
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface RateLimitOptions {
  keyPrefix: string;
  max: number;
  windowSeconds: number;
}

interface LocalRateLimitEntry {
  count: number;
  expiresAt: number;
}

export type RateLimitHandler = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

function parseRedisResult(result: unknown): { count: number; ttl: number } | null {
  if (!Array.isArray(result) || result.length !== 2) return null;
  const count = Number(result[0]);
  const ttl = Number(result[1]);
  return Number.isFinite(count) && Number.isFinite(ttl) ? { count, ttl } : null;
}

async function rateLimitPlugin(fastify: FastifyInstance): Promise<void> {
  const localEntries = new Map<string, LocalRateLimitEntry>();

  fastify.decorate('rateLimit', (options: RateLimitOptions): RateLimitHandler => {
    return async (request, reply) => {
      const identity = request.user?.userId || request.ip;
      const key = `rate-limit:${options.keyPrefix}:${identity}`;
      let count: number;
      let ttl: number;

      try {
        const result = await fastify.redis.eval(
          "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return {count, redis.call('TTL', KEYS[1])}",
          1,
          key,
          String(options.windowSeconds)
        );
        const parsed = parseRedisResult(result);
        if (!parsed) throw new Error('Unexpected Redis rate-limit response');
        count = parsed.count;
        ttl = parsed.ttl;
      } catch {
        const now = Date.now();
        const existing = localEntries.get(key);
        const entry = existing && existing.expiresAt > now
          ? { count: existing.count + 1, expiresAt: existing.expiresAt }
          : { count: 1, expiresAt: now + options.windowSeconds * 1000 };
        localEntries.set(key, entry);
        count = entry.count;
        ttl = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
      }

      reply.header('x-ratelimit-limit', options.max);
      reply.header('x-ratelimit-remaining', Math.max(0, options.max - count));

      if (count > options.max) {
        reply.header('retry-after', Math.max(1, ttl));
        return reply.status(429).send({
          success: false,
          error: 'Too many requests. Please try again later.'
        });
      }
    };
  });
}

export default fp(rateLimitPlugin, {
  name: 'rate-limit-plugin',
  dependencies: ['redis-plugin']
});
