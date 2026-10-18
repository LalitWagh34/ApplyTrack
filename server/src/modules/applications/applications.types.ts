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
  priority?: PriorityType;
}

export interface UpdateApplicationDTO {
  companyName?: string;
  roleTitle?: string;
  status?: ApplicationStatusType;
  priority?: PriorityType;
  notes?: string;
}

export interface ApplicationFilterQuery {
  status?: ApplicationStatusType;
  search?: string;
  isArchived?: boolean;
}
