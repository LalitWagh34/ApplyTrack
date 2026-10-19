/**
 * Auth Service
 * Manages Google OAuth 2.0 & GitHub OAuth authentication, token encryption, and user synchronization
 */
import { google } from 'googleapis';
import { prisma } from '@applytrack/database';
import { env } from '../../config/env.js';
import { cryptoService } from '../../services/crypto.service.js';
import { OAuthUserProfile } from './auth.types.js';

export class AuthService {
  private getGoogleOAuthClient() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generates Google OAuth consent screen URL with offline refresh token access
   */
  public getGoogleAuthUrl(): string {
    const oauth2Client = this.getGoogleOAuthClient();

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/gmail.metadata'
      ]
    });
  }

  /**
   * Exchanges Google authorization code for tokens, extracts profile, and updates DB
   */
  public async handleGoogleCallback(code: string): Promise<OAuthUserProfile & { userId: string }> {
    const oauth2Client = this.getGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      throw new Error('Google OAuth failed: No email returned from profile');
    }

    const encryptedToken = tokens.refresh_token
      ? cryptoService.encrypt(tokens.refresh_token)
      : undefined;

    // Upsert User in database
    const user = await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        fullName: profile.name || undefined,
        avatarUrl: profile.picture || undefined,
        googleId: profile.id || undefined,
        ...(encryptedToken && { encryptedGoogleToken: encryptedToken }),
        isArchived: false
      },
      create: {
        email: profile.email,
        fullName: profile.name || null,
        avatarUrl: profile.picture || null,
        googleId: profile.id || null,
        encryptedGoogleToken: encryptedToken || null
      }
    });

    return {
      userId: user.id,
      providerId: profile.id || '',
      provider: 'google',
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl
    };
  }

  /**
   * Generates GitHub OAuth authorization URL
   */
  public getGitHubAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: env.GITHUB_CLIENT_ID,
      redirect_uri: env.GITHUB_REDIRECT_URI,
      scope: 'read:user user:email'
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchanges GitHub authorization code for access token, extracts user profile, and updates DB
   */
  public async handleGitHubCallback(code: string): Promise<OAuthUserProfile & { userId: string }> {
    // 1. Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: env.GITHUB_REDIRECT_URI
      })
    });

    const tokenData = (await tokenResponse.json()) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new Error(`GitHub OAuth token error: ${tokenData.error || 'Failed to obtain access token'}`);
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch GitHub user profile
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'ApplyTrack-App'
      }
    });
    const ghUser = (await userResponse.json()) as { id: number; name?: string; login: string; avatar_url?: string; email?: string };

    // 3. Fetch primary email if not public in profile
    let primaryEmail = ghUser.email;
    if (!primaryEmail) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'ApplyTrack-App'
        }
      });
      const emails = (await emailsResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      const verifiedPrimary = emails.find((e) => e.primary && e.verified) || emails[0];
      primaryEmail = verifiedPrimary?.email;
    }

    if (!primaryEmail) {
      throw new Error('GitHub OAuth failed: No verified email associated with this account');
    }

    const encryptedToken = cryptoService.encrypt(accessToken);

    // 4. Upsert User in database
    const user = await prisma.user.upsert({
      where: { email: primaryEmail },
      update: {
        fullName: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url || undefined,
        githubId: String(ghUser.id),
        encryptedGithubToken: encryptedToken,
        isArchived: false
      },
      create: {
        email: primaryEmail,
        fullName: ghUser.name || ghUser.login,
        avatarUrl: ghUser.avatar_url || null,
        githubId: String(ghUser.id),
        encryptedGithubToken: encryptedToken
      }
    });

    return {
      userId: user.id,
      providerId: String(ghUser.id),
      provider: 'github',
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl
    };
  }

  /**
   * Fetches user profile with linked provider statuses
   */
  public async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isArchived: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        googleId: true,
        githubId: true,
        preferences: true,
        createdAt: true
      }
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      hasGoogleLinked: Boolean(user.googleId),
      hasGithubLinked: Boolean(user.githubId),
      preferences: user.preferences || {},
      createdAt: user.createdAt
    };
  }
}

export const authService = new AuthService();
export default authService;
