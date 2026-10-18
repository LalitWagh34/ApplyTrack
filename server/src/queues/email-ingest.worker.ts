/**
 * Email Ingest BullMQ Worker
 * Processes Pub/Sub mailbox notifications, extracts headers via gmail.metadata,
 * classifies whether the email is a job application, and fires 1-tap push notification.
 */

export function initEmailIngestWorker() {
  // BullMQ Worker for email ingestion
}
