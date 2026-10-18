/**
 * Fastify Type Augmentations
 * Decorates Fastify instance with Prisma, Redis, JWT authentication, and Pub/Sub
 */
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { FastifyReply, FastifyRequest } from 'fastify';
import { PubSubPluginDecorators } from '../plugins/pubsub.plugin.js';
import { UserSessionPayload } from '../modules/auth/auth.types.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    redis: Redis;
    pubsub: PubSubPluginDecorators;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: UserSessionPayload;
    user: UserSessionPayload;
  }
}
