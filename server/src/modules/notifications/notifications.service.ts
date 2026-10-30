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
  constructor() {
    if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          env.VAPID_SUBJECT,
          env.VAPID_PUBLIC_KEY,
          env.VAPID_PRIVATE_KEY
        );
      } catch (err) {
        console.warn('[WebPush] VAPID initialization warning:', err);
      }
    }
  }

  /**
   * Returns the public VAPID key so client browser can subscribe to push manager
   */
  public getPublicKey(): string {
    return env.VAPID_PUBLIC_KEY || '';
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
  public async sendPushToUser(userId: string, payload: PushNotificationPayload): Promise<{ sent: number; failed: number }> {
    if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) {
      return { sent: 0, failed: 0 };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    const notificationString = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/icon-192.png',
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
        // If device token has expired (404/410 Gone), prune from database
        if (err.statusCode === 404 || err.statusCode === 410) {
          await this.removeSubscription(sub.endpoint);
        }
      }
    }

    return { sent, failed };
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;
