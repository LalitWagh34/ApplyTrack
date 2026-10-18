/**
 * Follow-Ups Controller
 * Handles HTTP requests for pending radar alerts, 1-click draft generation, and follow-up logging
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { followUpsService } from './followups.service.js';
import { GenerateDraftRequest } from './followups.types.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class FollowUpsController {
  /**
   * Get all applications currently pending follow-up for logged-in user
   */
  public async getPending(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    const pending = await followUpsService.getPendingFollowUps(userId);
    return reply.send(successResponse(pending));
  }

  /**
   * Generate 1-click tailored email draft
   */
  public async generateDraft(
    request: FastifyRequest<{ Params: { id: string }; Body: GenerateDraftRequest }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const tone = request.body?.tone || 'polite_nudge';

    const draft = await followUpsService.generateContextualDraft(userId, request.params.id, tone);

    if (!draft) {
      return reply.status(404).send(errorResponse('Application not found'));
    }

    return reply.send(successResponse(draft));
  }

  /**
   * Dismiss or snooze a follow-up reminder
   */
  public async dismiss(
    request: FastifyRequest<{ Params: { id: string }; Body: { snoozeDays?: number } }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const snoozeDays = request.body?.snoozeDays || 7;

    const result = await followUpsService.dismissReminder(userId, request.params.id, snoozeDays);

    if (!result) {
      return reply.status(404).send(errorResponse('Application not found'));
    }

    return reply.send(successResponse(result, `Follow-up reminder snoozed by ${snoozeDays} days`));
  }

  /**
   * Log that user has sent a follow-up email
   */
  public async markSent(
    request: FastifyRequest<{ Params: { id: string }; Body: { draftBody?: string } }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const result = await followUpsService.logFollowUpSent(userId, request.params.id, request.body?.draftBody);

    if (!result) {
      return reply.status(404).send(errorResponse('Application not found'));
    }

    return reply.send(successResponse(result, 'Follow-up successfully logged'));
  }
}

export const followUpsController = new FollowUpsController();
export default followUpsController;
