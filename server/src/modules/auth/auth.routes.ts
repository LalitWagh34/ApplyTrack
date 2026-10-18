/**
 * Auth Module Routes
 * Endpoints for Google OAuth, GitHub OAuth, session check, and logout
 */
import { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authSchemas } from './auth.schemas.js';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Google OAuth
  fastify.get('/google', authController.googleRedirect.bind(authController));
  fastify.get(
    '/google/callback',
    { schema: authSchemas.callbackQuerySchema },
    authController.googleCallback.bind(authController)
  );

  // GitHub OAuth
  fastify.get('/github', authController.githubRedirect.bind(authController));
  fastify.get(
    '/github/callback',
    { schema: authSchemas.callbackQuerySchema },
    authController.githubCallback.bind(authController)
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
