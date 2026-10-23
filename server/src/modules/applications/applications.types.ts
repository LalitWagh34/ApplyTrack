/**
 * Applications Module TypeScript Type Definitions
 */

export type ApplicationStatusType = 
  | 'APPLIED' 
  | 'OA_TEST' 
  | 'INTERVIEW' 
  | 'OFFER' 
  | 'REJECTED' 
  | 'GHOSTED';

export type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CreateApplicationDTO {
  companyName: string;
  companyDomain?: string;
  roleTitle: string;
  location?: string;
  salaryRange?: string;
  jobUrl?: string;
  status?: ApplicationStatusType;
  priority?: PriorityType;
  stageDueDate?: string | Date | null;
  notes?: string;
  source?: string;
}

export interface UpdateApplicationDTO {
  companyName?: string;
  companyDomain?: string;
  roleTitle?: string;
  location?: string;
  salaryRange?: string;
  jobUrl?: string;
  status?: ApplicationStatusType;
  priority?: PriorityType;
  stageDueDate?: string | Date | null;
  notes?: string;
}

export interface ApplicationFilterQuery {
  status?: ApplicationStatusType;
  search?: string;
  isArchived?: boolean;
}
