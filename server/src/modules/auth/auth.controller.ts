/**
 * Auth Controller
 * Handles HTTP requests for OAuth redirects, callbacks, and user session inspection
 */
import { FastifyReply, FastifyRequest } from 'fastify';
import { authService } from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import { env } from '../../config/env.js';
import { gmailService } from '../../services/gmail.service.js';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

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
  public async googleRedirect(request: FastifyRequest, reply: FastifyReply) {
    try {
      const state = await authService.createOAuthState(request.server.redis, 'google');
      return reply.redirect(authService.getGoogleAuthUrl(state));
    } catch (error) {
      request.log.error({ err: error }, 'Unable to initialize Google OAuth:');
      return reply.redirect(buildClientRedirectUrl('/?error=Unable%20to%20start%20secure%20Google%20login'));
    }
  }

  /**
   * Handles Google OAuth callback
   */
  public async googleCallback(request: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>, reply: FastifyReply) {
    const { code, state, error } = request.query;

    if (error || !code) {
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(error || 'Missing authorization code from Google')}`));
    }

    try {
      if (!state || !(await authService.consumeOAuthState(request.server.redis, state, 'google'))) {
        return reply.redirect(buildClientRedirectUrl('/?error=Invalid%20or%20expired%20Google%20login%20state'));
      }

      const userProfile = await authService.handleGoogleCallback(code);
      void gmailService.setupWatch(userProfile.userId)
        .then(() => request.log.info({ userId: userProfile.userId }, 'Gmail watch registered after Google OAuth.'))
        .catch((watchError: unknown) => {
          request.log.warn({ err: watchError, userId: userProfile.userId }, 'Gmail watch registration failed after Google OAuth.');
        });
      const exchangeCode = await authService.createAuthExchangeCode(request.server.redis, {
        userId: userProfile.userId,
        email: userProfile.email,
        fullName: userProfile.fullName,
        avatarUrl: userProfile.avatarUrl
      });

      return reply.redirect(buildClientRedirectUrl(`/?auth_code=${encodeURIComponent(exchangeCode)}`));
    } catch (error) {
      request.log.error({ err: error }, 'Google callback error:');
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(getErrorMessage(error, 'Failed to authenticate with Google'))}`));
    }
  }

  /**
   * Redirects to GitHub OAuth authorization
   */
  public async githubRedirect(request: FastifyRequest, reply: FastifyReply) {
    try {
      const state = await authService.createOAuthState(request.server.redis, 'github');
      return reply.redirect(authService.getGitHubAuthUrl(state));
    } catch (error) {
      request.log.error({ err: error }, 'Unable to initialize GitHub OAuth:');
      return reply.redirect(buildClientRedirectUrl('/?error=Unable%20to%20start%20secure%20GitHub%20login'));
    }
  }

  /**
   * Handles GitHub OAuth callback
   */
  public async githubCallback(request: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>, reply: FastifyReply) {
    const { code, state, error } = request.query;

    if (error || !code) {
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(error || 'Missing authorization code from GitHub')}`));
    }

    try {
      if (!state || !(await authService.consumeOAuthState(request.server.redis, state, 'github'))) {
        return reply.redirect(buildClientRedirectUrl('/?error=Invalid%20or%20expired%20GitHub%20login%20state'));
      }

      const userProfile = await authService.handleGitHubCallback(code);
      const exchangeCode = await authService.createAuthExchangeCode(request.server.redis, {
        userId: userProfile.userId,
        email: userProfile.email,
        fullName: userProfile.fullName,
        avatarUrl: userProfile.avatarUrl
      });

      return reply.redirect(buildClientRedirectUrl(`/?auth_code=${encodeURIComponent(exchangeCode)}`));
    } catch (error) {
      request.log.error({ err: error }, 'GitHub callback error:');
      return reply.redirect(buildClientRedirectUrl(`/?error=${encodeURIComponent(getErrorMessage(error, 'Failed to authenticate with GitHub'))}`));
    }
  }

  public async exchangeCode(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply
  ) {
    const sessionPayload = await authService.consumeAuthExchangeCode(request.server.redis, request.body.code);
    if (!sessionPayload) {
      return reply.status(401).send(errorResponse('Authentication code is invalid or expired'));
    }

    const token = request.server.jwt.sign(sessionPayload);
    return reply.send(successResponse({ token }, 'Authentication completed successfully'));
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
