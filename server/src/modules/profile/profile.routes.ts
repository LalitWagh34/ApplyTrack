/**
 * Profile Routes
 * Endpoints for AI Context profile management and resume parsing
 */
import { FastifyInstance } from 'fastify';
import { profileController } from './profile.controller.js';

export async function profileRoutes(fastify: FastifyInstance): Promise<void> {
  // Requires valid user authentication
  fastify.addHook('preHandler', fastify.authenticate);

  // Get profile & preferences
  fastify.get('/', profileController.getProfile.bind(profileController));

  // Upload & parse PDF resume with Groq
  fastify.post('/resume', profileController.parseResume.bind(profileController));

  // Update profile & preferences
  fastify.put('/', profileController.updateProfile.bind(profileController));
}

export default profileRoutes;
