/**
 * Webhooks Controller
 * Handles Google Cloud Pub/Sub incoming push webhook requests with verification and deduplication
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { webhooksService } from './webhooks.service.js';
import { GmailNotificationData } from './webhooks.types.js';

export class WebhooksController {
  /**
   * Receives Google Cloud Pub/Sub push notification for Gmail mailbox updates
   */
  public async handleGooglePubSub(request: FastifyRequest, reply: FastifyReply) {
    // 1. Verify that the request comes from authorized Pub/Sub subscription
    const isAuthorized = request.server.pubsub.verifyPubSubRequest(request);
    if (!isAuthorized) {
      request.log.warn('Unauthorized Pub/Sub webhook attempt rejected.');
      return reply.status(403).send({ error: 'Unauthorized webhook source' });
    }

    // 2. Decode Base64 message payload
    const decoded = request.server.pubsub.decodePubSubPayload<GmailNotificationData>(request.body);
    if (!decoded || !decoded.data?.emailAddress || !decoded.data?.historyId) {
      // Return 200 so Google does not retry unparsable payloads endlessly
      return reply.status(200).send({ status: 'ignored_unparsable' });
    }

    // 3. Deduplicate message using Redis SETNX
    const isDuplicate = await request.server.pubsub.isMessageDuplicate(decoded.messageId);
    if (isDuplicate) {
      request.log.info({ messageId: decoded.messageId }, 'Duplicate Pub/Sub message dropped.');
      return reply.status(200).send({ status: 'ignored_duplicate' });
    }

    // 4. Dispatch async processing job to BullMQ
    try {
      await webhooksService.dispatchGmailSyncJob(decoded.data);
      request.log.info(
        { email: decoded.data.emailAddress, historyId: decoded.data.historyId },
        'Gmail sync job dispatched to BullMQ.'
      );

      return reply.status(200).send({ status: 'acknowledged' });
    } catch (err) {
      request.log.error({ err }, 'Failed to dispatch Gmail sync job:');
      // Return 200 to acknowledge Pub/Sub receipt to prevent redelivery storms
      return reply.status(200).send({ status: 'error_logged' });
    }
  }
}

export const webhooksController = new WebhooksController();
export default webhooksController;
