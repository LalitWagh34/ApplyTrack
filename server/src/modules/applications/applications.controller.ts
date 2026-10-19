/**
 * Applications Controller
 * Handles HTTP requests for Kanban cards and application lifecycle management
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { applicationsService } from './applications.service.js';
import { gmailService } from '../../services/gmail.service.js';
import {
  CreateApplicationDTO,
  UpdateApplicationDTO,
  ApplicationFilterQuery
} from './applications.types.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class ApplicationsController {
  /**
   * List all applications for logged-in user
   */
  public async list(
    request: FastifyRequest<{ Querystring: ApplicationFilterQuery }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const result = await applicationsService.listApplications(userId, request.query);
    return reply.send(successResponse(result));
  }

  /**
   * Get Kanban column count metrics
   */
  public async getMetrics(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    const metrics = await applicationsService.getKanbanMetrics(userId);
    return reply.send(successResponse(metrics));
  }

  /**
   * Get application by ID
   */
  public async getById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const application = await applicationsService.getApplicationById(userId, request.params.id);

    if (!application) {
      return reply.status(404).send(errorResponse('Application not found'));
    }

    return reply.send(successResponse(application));
  }

  /**
   * Create new application card
   */
  public async create(
    request: FastifyRequest<{ Body: CreateApplicationDTO }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const created = await applicationsService.createApplication(userId, request.body);
    return reply.status(201).send(successResponse(created, 'Application created successfully'));
  }

  /**
   * Move card to new Kanban column (Status transition)
   */
  public async updateStatus(
    request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const updated = await applicationsService.updateStatus(
      userId,
      request.params.id,
      request.body.status
    );

    if (!updated) {
      return reply.status(404).send(errorResponse('Application not found'));
    }

    return reply.send(successResponse(updated, 'Stage updated successfully'));
  }

  /**
   * Update application details
   */
  public async update(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateApplicationDTO }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const updated = await applicationsService.updateApplication(
      userId,
      request.params.id,
      request.body
    );

    if (!updated) {
      return reply.status(404).send(errorResponse('Application not found'));
    }

    return reply.send(successResponse(updated, 'Application updated successfully'));
  }

  /**
   * Soft-delete application
   */
  public async archive(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const result = await applicationsService.archiveApplication(userId, request.params.id);

    if (!result) {
      return reply.status(404).send(errorResponse('Application not found'));
    }

    return reply.send(successResponse(result, 'Application archived successfully'));
  }

  /**
   * Batch soft-delete applications
   */
  public async batchArchive(
    request: FastifyRequest<{ Body: { ids: string[] } }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const { ids } = request.body;
    const result = await applicationsService.batchArchiveApplications(userId, ids);
    return reply.send(successResponse(result, `${result.count} application(s) archived successfully`));
  }

  /**
   * On-demand sync of user's Gmail mailbox for recent applications
   */
  public async syncGmail(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    try {
      const result = await gmailService.syncMailbox(userId);
      return reply.send(successResponse(result, result.message));
    } catch (err: any) {
      request.log.error({ err }, 'Gmail on-demand sync error:');
      return reply.status(500).send(errorResponse(err.message || 'Failed to sync Gmail'));
    }
  }
}

export const applicationsController = new ApplicationsController();
export default applicationsController;
