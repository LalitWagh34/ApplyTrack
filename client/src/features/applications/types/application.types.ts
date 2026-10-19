/**
 * Client Application TypeScript Type Definitions
 */

export type ApplicationStatus = 'APPLIED' | 'OA_TEST' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'GHOSTED';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TimelineEvent {
  id: string;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Application {
  id: string;
  companyName: string;
  companyDomain?: string | null;
  roleTitle: string;
  location?: string | null;
  salaryRange?: string | null;
  jobUrl?: string | null;
  source?: string | null;
  status: ApplicationStatus;
  priority: PriorityLevel;
  appliedDate: string;
  nextFollowUpDate?: string | null;
  followUpCount: number;
  hasReply: boolean;
  notes?: string | null;
  timeline?: TimelineEvent[];
}
