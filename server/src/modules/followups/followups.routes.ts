/**
 * Follow-Ups Module Routes
 * Protected endpoints for radar alerts, 1-click draft generation, and follow-up logging
 */
import { FastifyInstance } from 'fastify';
import { followUpsController } from './followups.controller.js';
import {
  generateDraftSchema,
  dismissReminderSchema,
  logSentSchema
} from './followups.schemas.js';

export async function followUpRoutes(fastify: FastifyInstance): Promise<void> {
  // All follow-up endpoints require valid authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Get all pending applications needing follow-up
  fastify.get('/pending', followUpsController.getPending.bind(followUpsController));

  // Generate tailored email draft
  fastify.post('/:id/draft', { schema: generateDraftSchema }, followUpsController.generateDraft.bind(followUpsController));

  // Snooze or dismiss follow-up reminder
  fastify.post('/:id/dismiss', { schema: dismissReminderSchema }, followUpsController.dismiss.bind(followUpsController));

  // Log follow-up sent
  fastify.post('/:id/sent', { schema: logSentSchema }, followUpsController.markSent.bind(followUpsController));
}

export default followUpRoutes;
