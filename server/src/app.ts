/**
 * Fastify Application Factory
 * Composes security headers, CORS, infrastructure plugins, and health-check routes
 */
import Fastify, { FastifyInstance } from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import { loggerConfig } from './config/logger.js';
import { env } from './config/env.js';
import prismaPlugin from './plugins/prisma.plugin.js';
import redisPlugin from './plugins/redis.plugin.js';
import jwtPlugin from './plugins/jwt.plugin.js';
import pubSubPlugin from './plugins/pubsub.plugin.js';
import rateLimitPlugin from './plugins/rate-limit.plugin.js';
import { errorHandler } from './utils/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { applicationRoutes } from './modules/applications/applications.routes.js';
import { webhookRoutes } from './modules/webhooks/webhooks.routes.js';
import { followUpRoutes } from './modules/followups/followups.routes.js';
import { profileRoutes } from './modules/profile/profile.routes.js';
import { notificationRoutes } from './modules/notifications/notifications.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: loggerConfig,
    disableRequestLogging: false,
    bodyLimit: 15 * 1024 * 1024 // 15MB limit to allow PDF base64 payloads
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Expose Fastify's request identifier so clients and operators can correlate failures.
  app.addHook('onRequest', async (request, reply) => {
    void reply.header('x-request-id', request.id);
  });

  // Security Headers
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false // Allows API communication without CSP collisions
  });

  // CORS Configuration
  const allowedOrigins = [env.CLIENT_URL];
  if (env.NODE_ENV !== 'production') {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    );
  }

  await app.register(fastifyCors, {
    origin: [...new Set(allowedOrigins)],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  });

  // Core Infrastructure Plugins
  await app.register(prismaPlugin);
  await app.register(redisPlugin);
  await app.register(rateLimitPlugin);
  await app.register(jwtPlugin);
  await app.register(pubSubPlugin);

  // Dependency checks are shared by backward-compatible health and strict readiness endpoints.
  const getDependencyStatus = async () => {
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
      database: dbStatus,
      redis: redisStatus
    };
  };

  // Existing health response remains available for deployment and client compatibility.
  const healthHandler = async () => {
    const dependencies = await getDependencyStatus();

    return {
      status: 'ok',
      service: 'applytrack-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dependencies
    };
  };

  const readinessHandler = async (_request: unknown, reply: { status: (code: number) => void }) => {
    const dependencies = await getDependencyStatus();
    const isReady = dependencies.database === 'connected' && dependencies.redis === 'connected';

    if (!isReady) {
      reply.status(503);
    }

    return {
      status: isReady ? 'ready' : 'not_ready',
      service: 'applytrack-api',
      timestamp: new Date().toISOString(),
      dependencies
    };
  };

  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);
  app.get('/ready', readinessHandler);
  app.get('/api/v1/ready', readinessHandler);

  // Feature Routes Registration
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(applicationRoutes, { prefix: '/api/v1/applications' });
  await app.register(webhookRoutes, { prefix: '/api/v1/webhooks' });
  await app.register(followUpRoutes, { prefix: '/api/v1/followups' });
  await app.register(profileRoutes, { prefix: '/api/v1/profile' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });

  return app;
}

export default buildApp;
