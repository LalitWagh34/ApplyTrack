/**
 * Notifications Business Logic & Web Push Dispatch
 * Handles VAPID configuration, client subscription storage, and Web Push delivery
 */
import webpush from 'web-push';
import { prisma } from '@applytrack/database';
import { env } from '../../config/env.js';

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
  badge?: string;
  icon?: string;
  tag?: string;
}

export class NotificationsService {
  private publicKey: string = '';
  private privateKey: string = '';
  private subject: string = 'mailto:support@applytrack.dev';

  constructor() {
    this.publicKey = env.VAPID_PUBLIC_KEY || '';
    this.privateKey = env.VAPID_PRIVATE_KEY || '';
    this.subject = env.VAPID_SUBJECT || 'mailto:support@applytrack.dev';

    let keysLoaded = false;
    if (this.publicKey && this.privateKey) {
      try {
        webpush.setVapidDetails(
          this.subject,
          this.publicKey,
          this.privateKey
        );
        keysLoaded = true;
      } catch (err) {
        console.warn('[WebPush] ⚠️ Configured VAPID keys are invalid or mismatched. Falling back to fresh keys.', err);
      }
    }

    // If keys not set or invalid, generate standard cryptographic VAPID keypair automatically
    if (!keysLoaded) {
      try {
        const generated = webpush.generateVAPIDKeys();
        this.publicKey = generated.publicKey;
        this.privateKey = generated.privateKey;
        webpush.setVapidDetails(
          this.subject,
          this.publicKey,
          this.privateKey
        );
        console.log('[WebPush] 🔑 Fresh valid VAPID keys generated for active session:');
        console.log(`[WebPush] Public Key: ${this.publicKey}`);
      } catch (err) {
        console.error('[WebPush] Could not initialize VAPID details:', err);
      }
    }
  }

  /**
   * Returns the public VAPID key so client browser can subscribe to push manager
   */
  public getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Saves or updates a browser Web Push subscription for a user
   */
  public async saveSubscription(userId: string, subscription: webpush.PushSubscription) {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    });

    if (existing) {
      return prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          userId,
          keys: subscription.keys as any
        }
      });
    }

    return prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys as any
      }
    });
  }

  /**
   * Removes a subscription when user revokes permissions
   */
  public async removeSubscription(endpoint: string) {
    try {
      await prisma.pushSubscription.delete({
        where: { endpoint }
      });
    } catch {
      // Ignored if already removed
    }
  }

  /**
   * Dispatches push notification to all active devices/browsers of a specific user
   */
  public async sendPushToUser(
    userId: string,
    payload: PushNotificationPayload
  ): Promise<{ sent: number; failed: number; total: number; errorDetails?: string }> {
    if (!this.publicKey || !this.privateKey) {
      return { sent: 0, failed: 0, total: 0, errorDetails: 'VAPID keys not configured' };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0, total: 0, errorDetails: 'NO_SUBSCRIPTIONS' };
    }

    let sent = 0;
    let failed = 0;
    let lastError = '';

    const notificationString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/icon.svg',
      badge: payload.badge || '/icon.svg',
      tag: payload.tag || 'applytrack-alert'
    });

    for (const sub of subscriptions) {
      try {
        const pushSub: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys as any
        };

        await webpush.sendNotification(pushSub, notificationString);
        sent++;
      } catch (err: any) {
        failed++;
        lastError = err?.message || String(err);
        console.error(`[WebPush] ❌ Error sending push notification (status ${err?.statusCode}):`, err?.body || err?.message || err);
        // If device token has expired (404/410 Gone), prune from database
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await this.removeSubscription(sub.endpoint);
        }
      }
    }

    return { sent, failed, total: subscriptions.length, errorDetails: lastError || undefined };
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
