/**
 * Profile Controller
 * HTTP handlers for user profile retrieval, resume parsing, and context updates
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { profileService } from './profile.service.js';
import { ParseResumeRequest, UpdateProfileRequest } from './profile.types.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export class ProfileController {
  /**
   * Get current user profile and AI context
   */
  public async getProfile(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user.userId;
    const profile = await profileService.getProfile(userId);

    if (!profile) {
      return reply.status(404).send(errorResponse('User profile not found'));
    }

    return reply.send(successResponse(profile));
  }

  /**
   * Parse PDF resume, extract AI context with Groq, and auto-update preferences
   */
  public async parseResume(
    request: FastifyRequest<{ Body: ParseResumeRequest }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const { fileBase64 } = request.body || {};

    if (!fileBase64) {
      return reply.status(400).send(errorResponse('Missing fileBase64 payload'));
    }

    try {
      const result = await profileService.parseResume(userId, fileBase64);
      return reply.send(successResponse(result, 'Resume parsed and AI context updated successfully'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to parse resume';
      return reply.status(500).send(errorResponse(`Resume parsing failed: ${message}`));
    }
  }

  /**
   * Update profile details and AI context preferences manually
   */
  public async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileRequest }>,
    reply: FastifyReply
  ) {
    const userId = request.user.userId;
    const updateData = request.body || {};

    try {
      const updated = await profileService.updateProfile(userId, updateData);
      return reply.send(successResponse(updated, 'Profile updated successfully'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      return reply.status(500).send(errorResponse(`Profile update failed: ${message}`));
    }
  }
}

export const profileController = new ProfileController();
export default profileController;
