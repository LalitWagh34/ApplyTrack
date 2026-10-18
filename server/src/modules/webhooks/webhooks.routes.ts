/**
 * Webhooks Module Routes
 * Public endpoints for external webhook providers (Google Pub/Sub)
 */
import { FastifyInstance } from 'fastify';
import { webhooksController } from './webhooks.controller.js';

export async function webhookRoutes(fastify: FastifyInstance): Promise<void> {
  // Google Cloud Pub/Sub Push Webhook
  fastify.post(
    '/google-pubsub',
    webhooksController.handleGooglePubSub.bind(webhooksController)
  );
}

export default webhookRoutes;
