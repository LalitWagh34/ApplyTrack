/**
 * Auth Module Routes
 * Endpoints for Google OAuth, GitHub OAuth, session check, and logout
 */
import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authSchemas } from './auth.schemas.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const oauthStartLimit = fastify.rateLimit({ keyPrefix: 'oauth-start', max: 20, windowSeconds: 600 });
  const oauthCallbackLimit = fastify.rateLimit({ keyPrefix: 'oauth-callback', max: 30, windowSeconds: 600 });

  // Google OAuth
  fastify.get('/google', { preHandler: [oauthStartLimit] }, authController.googleRedirect.bind(authController));
  fastify.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/google/callback',
    { schema: authSchemas.callbackQuerySchema, preHandler: [oauthCallbackLimit] },
    authController.googleCallback.bind(authController)
  );

  // GitHub OAuth
  fastify.get('/github', { preHandler: [oauthStartLimit] }, authController.githubRedirect.bind(authController));
  fastify.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/github/callback',
    { schema: authSchemas.callbackQuerySchema, preHandler: [oauthCallbackLimit] },
    authController.githubCallback.bind(authController)
  );

  // Exchanges the short-lived, single-use OAuth callback code for the existing bearer JWT.
  fastify.post<{ Body: { code: string } }>(
    '/exchange',
    {
      schema: authSchemas.exchangeCodeSchema,
      preHandler: [fastify.rateLimit({ keyPrefix: 'auth-exchange', max: 15, windowSeconds: 600 })]
    },
    authController.exchangeCode.bind(authController)
  );

  // Protected Routes
  fastify.get(
    '/me',
    {
      preHandler: [fastify.authenticate]
    },
    authController.getMe.bind(authController)
  );

  fastify.post(
    '/logout',
    {
      preHandler: [fastify.authenticate]
    },
    authController.logout.bind(authController)
  );
}

export default authRoutes;
