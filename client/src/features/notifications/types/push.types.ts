/**
 * Client Push Notifications TypeScript Type Definitions
 */

export interface WebPushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}
