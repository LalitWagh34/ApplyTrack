/**
 * Webhooks Module TypeScript Type Definitions
 */

export interface GooglePubSubMessage {
  data: string; // Base64 encoded JSON
  messageId: string;
  publishTime: string;
}

export interface GooglePubSubPushPayload {
  message: GooglePubSubMessage;
  subscription: string;
}

export interface GmailNotificationData {
  emailAddress: string;
  historyId: string;
}
