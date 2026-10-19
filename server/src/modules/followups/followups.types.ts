/**
 * Follow-Ups Module TypeScript Type Definitions
 */

export interface PendingFollowUpItem {
  applicationId: string;
  companyName: string;
  roleTitle: string;
  appliedDate: Date;
  followUpCount: number;
  gmailThreadId?: string | null;
}

export interface GenerateDraftRequest {
  tone?: 'polite_nudge' | 'value_add' | 'polite_breakup';
}

export interface FollowUpDraftResponse {
  subject: string;
  body: string;
  threadId: string;
  isAiGenerated?: boolean;
}

