import { FastifyReply, FastifyRequest } from 'fastify';
import { notificationsService } from './notifications.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import webpush from 'web-push';

export class NotificationsController {
  /**
   * Get public VAPID key for browser PushManager subscription
   */
  public async getPublicKey(_request: FastifyRequest, reply: FastifyReply) {
    const publicKey = notificationsService.getPublicKey();
    return reply.send(successResponse({ publicKey }));
  }

  /**
   * Save client push subscription in database
   */
  public async subscribe(
    request: FastifyRequest<{ Body: { subscription: webpush.PushSubscription } }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const { subscription } = request.body || {};

    if (!subscription || !subscription.endpoint) {
      return reply.status(400).send(errorResponse('Invalid push subscription payload'));
    }

    await notificationsService.saveSubscription(userId, subscription);
    return reply.send(successResponse(null, 'Web Push subscription saved successfully'));
  }

  /**
   * Remove push subscription on permission revocation or opt-out
   */
  public async unsubscribe(
    request: FastifyRequest<{ Body: { endpoint: string } }>,
    reply: FastifyReply
  ) {
    const { endpoint } = request.body || {};
    if (endpoint) {
      await notificationsService.removeSubscription(endpoint);
    }
    return reply.send(successResponse(null, 'Unsubscribed successfully'));
  }

  /**
   * Send a test push notification to verify setup on desktop or mobile lockscreen
   */
  public async sendTestPush(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    const result = await notificationsService.sendPushToUser(userId, {
      title: '⚡ ApplyTrack Notification Active!',
      body: 'You are now ready to receive OA deadlines and interview alerts directly on your device.',
      url: '/'
    });

    if (result.sent === 0) {
      if (result.errorDetails === 'NO_SUBSCRIPTIONS' || result.total === 0) {
        return reply.status(400).send(
          errorResponse('No active push subscriptions found. Please click "Enable" to activate notifications on this browser.')
        );
      }
      return reply.status(400).send(
        errorResponse(`Push dispatch failed: ${result.errorDetails || 'Push service rejected notification'}. Please toggle notifications Off and On again.`)
      );
    }

    return reply.send(successResponse(result, 'Test notification sent to your device!'));
  }
}

export const notificationsController = new NotificationsController();
export default notificationsController;
