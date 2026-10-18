/**
 * Client Follow-Ups TypeScript Type Definitions
 */

export interface PendingFollowUp {
  applicationId: string;
  companyName: string;
  roleTitle: string;
  appliedDate: string;
  followUpCount: number;
}

export interface FollowUpDraft {
  subject: string;
  body: string;
  threadId: string;
}
