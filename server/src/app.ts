/**
 * Fastify Application Factory
 * Composes security headers, CORS, infrastructure plugins, and health-check routes
 */
import Fastify, { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { loggerConfig } from './config/logger.js';
import prismaPlugin from './plugins/prisma.plugin.js';
import redisPlugin from './plugins/redis.plugin.js';
import jwtPlugin from './plugins/jwt.plugin.js';
import pubSubPlugin from './plugins/pubsub.plugin.js';
import { errorHandler } from './utils/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { applicationRoutes } from './modules/applications/applications.routes.js';
import { webhookRoutes } from './modules/webhooks/webhooks.routes.js';
import { followUpRoutes } from './modules/followups/followups.routes.js';
import { profileRoutes } from './modules/profile/profile.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerConfig,
    disableRequestLogging: false,
    bodyLimit: 15 * 1024 * 1024 // 15MB limit to allow PDF base64 payloads
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Security Headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false // Allows API communication without CSP collisions
  });

  // CORS Configuration
  await app.register(fastifyCors, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Core Infrastructure Plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(jwtPlugin);
  await app.register(pubSubPlugin);

  // Health-check Endpoints
  const healthHandler = async () => {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';

    try {
      await app.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {
      dbStatus = 'error';
    }

    try {
      if (app.redis && (await app.redis.ping()) === 'PONG') {
        redisStatus = 'connected';
      }
    } catch {
      redisStatus = 'error';
    }

    return {
      status: 'ok',
      service: 'applytrack-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies: {
        database: dbStatus,
        redis: redisStatus
      }
    };
  };

  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // Feature Routes Registration
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(applicationRoutes, { prefix: '/api/v1/applications' });
  await app.register(webhookRoutes, { prefix: '/api/v1/webhooks' });
  await app.register(followUpRoutes, { prefix: '/api/v1/followups' });
  await app.register(profileRoutes, { prefix: '/api/v1/profile' });

  return app;
}

export default buildApp;
