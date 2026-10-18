/**
 * Webhooks Service
 * Dispatches verified Google Pub/Sub push messages to BullMQ queue for async processing
 */
import { gmailIngestQueue } from '../../config/bullmq.js';
import { GmailNotificationData } from './webhooks.types.js';

export class WebhooksService {
  /**
   * Enqueues incoming Gmail mailbox notification to BullMQ
   */
  public async dispatchGmailSyncJob(notification: GmailNotificationData): Promise<string> {
    const job = await gmailIngestQueue.add(
      'process-mailbox-delta',
      {
        emailAddress: notification.emailAddress,
        historyId: notification.historyId,
        receivedAt: new Date().toISOString()
      },
      {
        jobId: `gmail-${notification.emailAddress}-${notification.historyId}`,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000
        }
      }
    );

    return job.id || 'queued';
  }
}

export const webhooksService = new WebhooksService();
export default webhooksService;
