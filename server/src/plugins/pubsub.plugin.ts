/**
 * Google Cloud Pub/Sub Fastify Plugin
 * Provides utilities to verify, decode, and deduplicate push webhook messages from Gmail users.watch()
 */
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest } from 'fastify';
import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

export interface DecodedPubSubMessage<T = unknown> {
  data: T;
  messageId: string;
  publishTime: string;
  subscription: string;
}

export interface PubSubPluginDecorators {
  verifyPubSubRequest: (request: FastifyRequest) => boolean;
  decodePubSubPayload: <T = unknown>(body: unknown) => DecodedPubSubMessage<T> | null;
  isMessageDuplicate: (messageId: string, ttlSeconds?: number) => Promise<boolean>;
}

async function pubSubPlugin(fastify: FastifyInstance): Promise<void> {
  const tokenMatches = (candidate: string | undefined): boolean => {
    if (!candidate || !env.GOOGLE_PUBSUB_VERIFICATION_TOKEN) return false;
    const candidateBuffer = Buffer.from(candidate);
    const expectedBuffer = Buffer.from(env.GOOGLE_PUBSUB_VERIFICATION_TOKEN);
    return candidateBuffer.length === expectedBuffer.length && timingSafeEqual(candidateBuffer, expectedBuffer);
  };

  /**
   * Verify that incoming push webhook comes from configured Google Pub/Sub subscription
   */
  const verifyPubSubRequest = (request: FastifyRequest): boolean => {
    if (!env.GOOGLE_PUBSUB_VERIFICATION_TOKEN) {
      return env.NODE_ENV !== 'production';
    }

    const tokenFromQuery = (request.query as Record<string, string>)?.token;
    const tokenFromHeader = request.headers['x-goog-subscription-token'] as string | undefined;

    return tokenMatches(tokenFromQuery) || tokenMatches(tokenFromHeader);
  };

  /**
   * Decode base64 Google Pub/Sub message data into typed object
   */
  const decodePubSubPayload = <T = unknown>(body: unknown): DecodedPubSubMessage<T> | null => {
    try {
      const payload = body as {
        message?: {
          data?: string;
          messageId?: string;
          publishTime?: string;
        };
        subscription?: string;
      };

      if (!payload?.message?.data) {
        return null;
      }

      const rawJson = Buffer.from(payload.message.data, 'base64').toString('utf-8');
      const parsedData = JSON.parse(rawJson) as T;

      return {
        data: parsedData,
        messageId: payload.message.messageId || '',
        publishTime: payload.message.publishTime || '',
        subscription: payload.subscription || ''
      };
    } catch (err) {
      fastify.log.error({ err }, 'Failed to decode Pub/Sub payload:');
      return null;
    }
  };

  /**
   * Deduplicate Pub/Sub messages using Redis SETNX with expiration
   */
  const isMessageDuplicate = async (messageId: string, ttlSeconds = 3600): Promise<boolean> => {
    if (!fastify.redis || !messageId) {
      return false;
    }

    const key = `pubsub:msg:${messageId}`;
    const result = await fastify.redis.set(key, '1', 'EX', ttlSeconds, 'NX');
    // If result is null, the key already existed -> duplicate!
    return result === null;
  };

  fastify.decorate('pubsub', {
    verifyPubSubRequest,
    decodePubSubPayload,
    isMessageDuplicate
  });
}

export default fp(pubSubPlugin, {
  name: 'pubsub-plugin'
});
