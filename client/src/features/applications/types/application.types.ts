/**
 * Client Application TypeScript Type Definitions
 */

export interface Application {
  id: string;
  companyName: string;
  companyDomain?: string | null;
  roleTitle: string;
  location?: string | null;
  status: 'APPLIED' | 'OA_TEST' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'GHOSTED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  appliedDate: string;
  nextFollowUpDate?: string | null;
  followUpCount: number;
  hasReply: boolean;
  notes?: string | null;
}
