/**
 * Applications Service
 * Business logic for job applications lifecycle, Kanban transitions, and activity timelines
 */
import { prisma, ApplicationStatus, PriorityLevel } from '@applytrack/database';
import { cryptoService } from '../../services/crypto.service.js';
import { redisCache } from '../../services/redis-cache.service.js';
import {
  CreateApplicationDTO,
  UpdateApplicationDTO,
  ApplicationFilterQuery
} from './applications.types.js';

export class ApplicationsService {
  /**
   * Helper to decrypt sensitive fields from an application record
   */
  private decryptApplication<T extends Record<string, any>>(app: T): T {
    if (!app) return app;
    return {
      ...app,
      companyName: cryptoService.safeDecrypt(app.companyName) || app.companyName,
      roleTitle: cryptoService.safeDecrypt(app.roleTitle) || app.roleTitle,
      notes: cryptoService.safeDecrypt(app.notes) ?? app.notes,
      salaryRange: cryptoService.safeDecrypt(app.salaryRange) ?? app.salaryRange,
      jobUrl: cryptoService.safeDecrypt(app.jobUrl) ?? app.jobUrl,
      location: cryptoService.safeDecrypt(app.location) ?? app.location
    };
  }

  /**
   * Lists all active applications for user with optional status and text filters (with Redis caching)
   */
  public async listApplications(userId: string, filters: ApplicationFilterQuery) {
    const cacheKey = `cache:apps:${userId}:${filters.status || 'all'}`;

    // 1. Try Redis cache first (only for non-search views to keep RAM lean)
    if (!filters.search) {
      const cached = await redisCache.get<{ applications: any[]; totalCount: number }>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const whereClause: {
      userId: string;
      isArchived: boolean;
      status?: ApplicationStatus;
    } = {
      userId,
      isArchived: false
    };

    if (filters.status) {
      whereClause.status = filters.status as ApplicationStatus;
    }

    const [rawApplications, totalCount] = await Promise.all([
      prisma.application.findMany({
        where: whereClause,
        orderBy: [{ appliedDate: 'desc' }, { updatedAt: 'desc' }],
        include: {
          timeline: {
            take: 3,
            orderBy: { createdAt: 'desc' }
          }
        }
      }),
      prisma.application.count({ where: whereClause })
    ]);

    // Decrypt all application fields in memory
    let applications = rawApplications.map((app) => this.decryptApplication(app));

    // Handle search filter in memory over decrypted companyName and roleTitle
    if (filters.search) {
      const q = filters.search.toLowerCase();
      applications = applications.filter(
        (app) =>
          (app.companyName && app.companyName.toLowerCase().includes(q)) ||
          (app.roleTitle && app.roleTitle.toLowerCase().includes(q)) ||
          (app.notes && app.notes.toLowerCase().includes(q))
      );
    }

    const result = {
      applications,
      totalCount: filters.search ? applications.length : totalCount
    };

    // 2. Populate Redis cache with 3-minute TTL
    if (!filters.search) {
      void redisCache.set(cacheKey, result, 180);
    }

    return result;
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

    return application ? this.decryptApplication(application) : null;
  }

  /**
   * Creates a new application card and schedules the initial 7-day follow-up
   */
  public async createApplication(userId: string, data: CreateApplicationDTO) {
    // Initial follow-up set for 7 days from now
    const initialFollowUp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const notesValue = data.notes || (data.source ? `Source: ${data.source}` : null);

    const createData: any = {
      userId,
      companyName: cryptoService.encrypt(data.companyName),
      companyDomain: data.companyDomain || null,
      roleTitle: cryptoService.encrypt(data.roleTitle),
      location: data.location ? cryptoService.encrypt(data.location) : null,
      salaryRange: data.salaryRange ? cryptoService.encrypt(data.salaryRange) : null,
      jobUrl: data.jobUrl ? cryptoService.encrypt(data.jobUrl) : null,
      notes: notesValue ? cryptoService.encrypt(notesValue) : null,
      priority: (data.priority as PriorityLevel) || PriorityLevel.MEDIUM,
      status: (data.status as ApplicationStatus) || ApplicationStatus.APPLIED,
      appliedDate: new Date(),
      nextFollowUpDate: initialFollowUp,
      timeline: {
        create: {
          eventType: 'STATUS_CHANGED',
          description: `Applied to ${data.companyName} for ${data.roleTitle}`,
          metadata: { stage: data.status || ApplicationStatus.APPLIED }
        }
      }
    };

    if (data.stageDueDate) {
      createData.stageDueDate = new Date(data.stageDueDate);
    }

    const application = await prisma.application.create({
      data: createData,
      include: {
        timeline: true
      }
    });

    void redisCache.invalidateUserApps(userId);

    return this.decryptApplication(application);
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

    void redisCache.invalidateUserApps(userId);

    return this.decryptApplication(updated);
  }

  /**
   * Updates application metadata (notes, salary, role, priority, stageDueDate)
   */
  public async updateApplication(userId: string, applicationId: string, data: UpdateApplicationDTO) {
    const existing = await prisma.application.findFirst({
      where: { id: applicationId, userId, isArchived: false }
    });

    if (!existing) {
      return null;
    }

    const updateData: Record<string, any> = {};

    if (data.companyName) updateData.companyName = cryptoService.encrypt(data.companyName);
    if (data.companyDomain !== undefined) updateData.companyDomain = data.companyDomain;
    if (data.roleTitle) updateData.roleTitle = cryptoService.encrypt(data.roleTitle);
    if (data.location !== undefined) updateData.location = data.location ? cryptoService.encrypt(data.location) : null;
    if (data.salaryRange !== undefined) updateData.salaryRange = data.salaryRange ? cryptoService.encrypt(data.salaryRange) : null;
    if (data.jobUrl !== undefined) updateData.jobUrl = data.jobUrl ? cryptoService.encrypt(data.jobUrl) : null;
    if (data.status) updateData.status = data.status as ApplicationStatus;
    if (data.priority) updateData.priority = data.priority as PriorityLevel;
    if (data.stageDueDate !== undefined) updateData.stageDueDate = data.stageDueDate ? new Date(data.stageDueDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes ? cryptoService.encrypt(data.notes) : null;

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: updateData
    });

    void redisCache.invalidateUserApps(userId);

    return this.decryptApplication(updated);
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

    void redisCache.invalidateUserApps(userId);

    return { archived: true, id: applicationId };
  }

  /**
   * Batch soft-deletes applications (isArchived = true) - Complying with Guardrail 6
   */
  public async batchArchiveApplications(userId: string, applicationIds: string[]) {
    if (!applicationIds || applicationIds.length === 0) {
      return { count: 0 };
    }

    const result = await prisma.application.updateMany({
      where: {
        userId,
        id: { in: applicationIds },
        isArchived: false
      },
      data: {
        isArchived: true
      }
    });

    void redisCache.invalidateUserApps(userId);

    return { count: result.count };
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
