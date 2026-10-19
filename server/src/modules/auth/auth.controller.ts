/**
 * Auth Controller
 * Handles HTTP requests for OAuth redirects, callbacks, and user session inspection
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { env } from '../../config/env.js';

function buildClientRedirectUrl(pathAndQuery: string): string {
  const base = (env.CLIENT_URL || 'http://localhost:3000')
    .toString()
    .trim()
    .replace(/[\r\n\t\s]+/g, '')
    .replace(/\/+$/, '');
  const cleanPath = pathAndQuery.trim().replace(/[\r\n\t]+/g, '');
  return `${base}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`;
}

export class AuthController {
  /**
   * Redirects to Google OAuth consent screen
   */
  public async googleRedirect(_request: FastifyRequest, reply: FastifyReply) {
    const url = authService.getGoogleAuthUrl();
    return reply.redirect(url);
  }

  /**
   * Handles Google OAuth callback
   */
  public async googleCallback(request: FastifyRequest<{ Querystring: { code?: string; error?: string } }>, reply: FastifyReply) {
    const { code, error } = request.query;

    if (error || !code) {
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(error || 'Missing authorization code from Google')}`));
    }

    try {
      const userProfile = await authService.handleGoogleCallback(code);

      // Sign JWT session
      const token = request.server.jwt.sign({
        userId: userProfile.userId,
        email: userProfile.email,
        fullName: userProfile.fullName,
        avatarUrl: userProfile.avatarUrl
      });

      return reply.redirect(buildClientRedirectUrl(`/?token=${encodeURIComponent(token)}`));
    } catch (err: any) {
      request.log.error({ err }, 'Google callback error:');
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(err.message || 'Failed to authenticate with Google')}`));
    }
  }

  /**
   * Redirects to GitHub OAuth authorization
   */
  public async githubRedirect(_request: FastifyRequest, reply: FastifyReply) {
    const url = authService.getGitHubAuthUrl();
    return reply.redirect(url);
  }

  /**
   * Handles GitHub OAuth callback
   */
  public async githubCallback(request: FastifyRequest<{ Querystring: { code?: string; error?: string } }>, reply: FastifyReply) {
    const { code, error } = request.query;

    if (error || !code) {
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(error || 'Missing authorization code from GitHub')}`));
    }

    try {
      const userProfile = await authService.handleGitHubCallback(code);

      // Sign JWT session
      const token = request.server.jwt.sign({
        userId: userProfile.userId,
        email: userProfile.email,
        fullName: userProfile.fullName,
        avatarUrl: userProfile.avatarUrl
      });

      return reply.redirect(buildClientRedirectUrl(`/?token=${encodeURIComponent(token)}`));
    } catch (err: any) {
      request.log.error({ err }, 'GitHub callback error:');
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(err.message || 'Failed to authenticate with GitHub')}`));
    }
  }

  /**
   * Returns authenticated user profile
   */
  public async getMe(request: FastifyRequest, reply: FastifyReply) {
    const profile = await authService.getUserProfile(request.user.userId);

    if (!profile) {
      return reply.status(404).send(errorResponse('User profile not found'));
    }

    return reply.send(successResponse(profile));
  }

  /**
   * Logout session
   */
  public async logout(_request: FastifyRequest, reply: FastifyReply) {
    return reply.send(successResponse({ loggedOut: true }, 'Successfully logged out'));
  }
}

export const authController = new AuthController();
export default authController;
