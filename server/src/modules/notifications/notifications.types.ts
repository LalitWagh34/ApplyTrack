/**
 * Notifications Module TypeScript Type Definitions
 */

export interface PushSubscriptionDTO {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: {
    actionType: 'TRACK_PROMPT' | 'FOLLOWUP_REMINDER';
    applicationId?: string;
    threadId?: string;
    url?: string;
  };
}
