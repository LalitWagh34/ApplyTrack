/**
 * Applications Service
 * Business logic for job applications lifecycle, Kanban transitions, and activity timelines
 */
import { prisma, ApplicationStatus, PriorityLevel } from '@applytrack/database';
import {
  CreateApplicationDTO,
  UpdateApplicationDTO,
  ApplicationFilterQuery
} from './applications.types.js';

export class ApplicationsService {
  /**
   * Lists all active applications for user with optional status and text filters
   */
  public async listApplications(userId: string, filters: ApplicationFilterQuery) {
    const whereClause: {
      userId: string;
      isArchived: boolean;
      status?: ApplicationStatus;
      OR?: Array<{
        companyName?: { contains: string; mode: 'insensitive' };
        roleTitle?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      userId,
      isArchived: false
    };

    if (filters.status) {
      whereClause.status = filters.status as ApplicationStatus;
    }

    if (filters.search) {
      whereClause.OR = [
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { roleTitle: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const [applications, totalCount] = await Promise.all([
      prisma.application.findMany({
        where: whereClause,
        orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
        include: {
          timeline: {
            take: 3,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.application.count({ where: whereClause })
    ]);

    return {
      applications,
      totalCount
    };
  }

  /**
   * Retrieves single application with full timeline history and follow-up logs
   */
  public async getApplicationById(userId: string, applicationId: string) {
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userId,
        isArchived: false
      },
      include: {
        timeline: {
          orderBy: { createdAt: 'desc' }
        },
        followUps: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return application;
  }

  /**
   * Creates a new application card and schedules the initial 7-day follow-up
   */
  public async createApplication(userId: string, data: CreateApplicationDTO) {
    // Initial follow-up set for 7 days from now
    const initialFollowUp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const application = await prisma.application.create({
      data: {
        userId,
        companyName: data.companyName,
        companyDomain: data.companyDomain || null,
        roleTitle: data.roleTitle,
        location: data.location || null,
        salaryRange: data.salaryRange || null,
        jobUrl: data.jobUrl || null,
        priority: (data.priority as PriorityLevel) || PriorityLevel.MEDIUM,
        status: ApplicationStatus.APPLIED,
        appliedDate: new Date(),
        nextFollowUpDate: initialFollowUp,
        timeline: {
          create: {
            eventType: 'STATUS_CHANGED',
            description: `Applied to ${data.companyName} for ${data.roleTitle}`,
            metadata: { stage: ApplicationStatus.APPLIED }
          }
        }
      },
      include: {
        timeline: true
      }
    });

    return application;
  }

  /**
   * Updates stage status (Kanban column drag-and-drop)
   */
  public async updateStatus(userId: string, applicationId: string, newStatus: string) {
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId, isArchived: false }
    });

    if (!existing) {
      return null;
    }

    const targetStatus = newStatus as ApplicationStatus;

    // If moved to OFFER or REJECTED, cancel pending follow-up countdown
    const isTerminalStage = targetStatus === ApplicationStatus.OFFER || targetStatus === ApplicationStatus.REJECTED;
    const nextFollowUpDate = isTerminalStage ? null : existing.nextFollowUpDate;

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: targetStatus,
        nextFollowUpDate,
        timeline: {
          create: {
            eventType: 'STATUS_CHANGED',
            description: `Moved stage from ${existing.status} to ${targetStatus}`,
            metadata: {
              previousStatus: existing.status,
              newStatus: targetStatus
            }
          }
        }
      },
      include: {
        timeline: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return updated;
  }

  /**
   * Updates application metadata (notes, salary, role, priority)
   */
  public async updateApplication(userId: string, applicationId: string, data: UpdateApplicationDTO) {
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId, isArchived: false }
    });

    if (!existing) {
      return null;
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        ...(data.companyName && { companyName: data.companyName }),
        ...(data.roleTitle && { roleTitle: data.roleTitle }),
        ...(data.status && { status: data.status as ApplicationStatus }),
        ...(data.priority && { priority: data.priority as PriorityLevel }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });

    return updated;
  }

  /**
   * Soft-deletes application (isArchived = true) - Complying with Guardrail 6
   */
  public async archiveApplication(userId: string, applicationId: string) {
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId, isArchived: false }
    });

    if (!existing) {
      return null;
    }

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        isArchived: true,
        timeline: {
          create: {
            eventType: 'ARCHIVED',
            description: 'Application was archived'
          }
        }
      }
    });

    return { archived: true, id: applicationId };
  }

  /**
   * Aggregates Kanban column counts
   */
  public async getKanbanMetrics(userId: string) {
    const counts = await prisma.application.groupBy({
      by: ['status'],
      where: { userId, isArchived: false },
      _count: { _all: true }
    });

    const metricMap: Record<string, number> = {
      APPLIED: 0,
      OA_TEST: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
      GHOSTED: 0
    };

    for (const item of counts) {
      metricMap[item.status] = item._count._all;
    }

    return metricMap;
  }
}

export const applicationsService = new ApplicationsService();
export default applicationsService;
