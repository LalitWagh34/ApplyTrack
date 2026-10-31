/**
 * Notifications Fastify Route Declarations
 * Endpoints: POST /notifications/subscribe, DELETE /notifications/unsubscribe, GET /notifications/vapid-key
 */
import { FastifyInstance } from 'fastify';
import { notificationsController } from './notifications.controller.js';

export async function notificationRoutes(fastify: FastifyInstance): Promise<void> {
  // Requires valid user authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Get public VAPID key
  fastify.get('/vapid-key', notificationsController.getPublicKey.bind(notificationsController));

  // Subscribe to web push
  fastify.post('/subscribe', notificationsController.subscribe.bind(notificationsController));

  // Unsubscribe from web push
  fastify.delete('/unsubscribe', notificationsController.unsubscribe.bind(notificationsController));

  // Trigger immediate test push notification
  fastify.post('/test', notificationsController.sendTestPush.bind(notificationsController));
}

export default notificationRoutes;
