/**
 * Applications Module Routes
 * Protected endpoints for Kanban cards, timeline tracking, and stage transitions
 */
import { FastifyInstance } from 'fastify';
import { applicationsController } from './applications.controller.js';
import {
  createApplicationSchema,
  updateStatusSchema,
  updateApplicationSchema,
  filterApplicationsSchema,
  getByIdSchema,
  batchArchiveSchema
} from './applications.schemas.js';

export async function applicationRoutes(fastify: FastifyInstance): Promise<void> {
  // All application endpoints require valid JWT authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // List applications (with filter/search query support)
  fastify.get('/', { schema: filterApplicationsSchema }, applicationsController.list.bind(applicationsController));

  // Get Kanban stage metrics (counts per stage)
  fastify.get('/metrics', applicationsController.getMetrics.bind(applicationsController));

  // Get single application with timeline
  fastify.get('/:id', { schema: getByIdSchema }, applicationsController.getById.bind(applicationsController));

  // Create new application
  fastify.post('/', { schema: createApplicationSchema }, applicationsController.create.bind(applicationsController));

  // Update stage status (Kanban drag-and-drop)
  fastify.patch('/:id/status', { schema: updateStatusSchema }, applicationsController.updateStatus.bind(applicationsController));

  // Update application metadata
  fastify.patch('/:id', { schema: updateApplicationSchema }, applicationsController.update.bind(applicationsController));

  // Soft-delete application (isArchived = true)
  fastify.delete('/:id', { schema: getByIdSchema }, applicationsController.archive.bind(applicationsController));

  // Batch soft-delete applications
  fastify.post('/batch-delete', { schema: batchArchiveSchema }, applicationsController.batchArchive.bind(applicationsController));

  // On-demand Gmail Sync (Indeed, Naukri, LinkedIn, cold emails)
  fastify.post('/sync-gmail', applicationsController.syncGmail.bind(applicationsController));
}

export default applicationRoutes;
