/**
 * Profile Service
 * In-memory resume text extraction via pdf-parse & Groq AI structuring
 * Updates user.preferences JSONB column with zero disk persistence
 */
import { prisma } from '@applytrack/database';
import pdf from 'pdf-parse';
import { UserPreferences, UpdateProfileRequest, ProfileResponse } from './profile.types.js';

export class ProfileService {
  /**
   * Fetches user profile with saved AI context preferences
   */
  public async getProfile(userId: string): Promise<ProfileResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId, isArchived: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        googleId: true,
        githubId: true,
        preferences: true
      }
    });

    if (!user) {
      return null;
    }

    const prefs = (user.preferences as UserPreferences) || {};

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      hasGoogleLinked: Boolean(user.googleId),
      hasGithubLinked: Boolean(user.githubId),
      preferences: {
        targetRole: prefs.targetRole || '',
        topSkills: Array.isArray(prefs.topSkills) ? prefs.topSkills : [],
        portfolioLink: prefs.portfolioLink || '',
        topProjects: Array.isArray(prefs.topProjects) ? prefs.topProjects : [],
        followUpCadenceDays: typeof prefs.followUpCadenceDays === 'number' ? prefs.followUpCadenceDays : 7
      }
    };
  }

  /**
   * Parses uploaded PDF resume in memory and structures AI context with Groq
   */
  public async parseResume(
    userId: string,
    fileBase64: string
  ): Promise<{ fullName?: string; preferences: UserPreferences }> {
    // 1. Decode base64 buffer in-memory (No file written to disk)
    const buffer = Buffer.from(fileBase64, 'base64');
    const pdfData = await pdf(buffer);
    const resumeText = (pdfData.text || '').slice(0, 8000); // Take first ~8k chars for AI context

    // 2. Call Groq AI to extract structured JSON
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    let extracted: {
      fullName?: string;
      targetRole?: string;
      topSkills?: string[];
      portfolioLink?: string;
      topProjects?: string[];
    } = {};

    if (apiKey && apiKey.trim() !== '') {
      const systemPrompt = `You are an elite technical recruiter and AI resume parser.
Analyze the resume text and extract the candidate's core profile into clean JSON.

Output format must be strictly a JSON object with:
- "fullName": string (candidate full name)
- "targetRole": string (e.g. "Frontend Engineer", "Full Stack Developer", "Software Engineer")
- "topSkills": string[] (maximum 3 to 4 primary technologies they excel at, e.g. ["React", "TypeScript", "Node.js"])
- "portfolioLink": string (GitHub, personal portfolio, or LinkedIn URL if found in text, else "")
- "topProjects": string[] (maximum 2 concise one-line summaries of their best featured projects and tech used)

Do not wrap with markdown code blocks or add conversational text. Return only valid JSON.`;

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Here is the resume content:\n\n${resumeText}` }
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })
        });

        if (response.ok) {
          const json = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
          const content = json.choices?.[0]?.message?.content;
          if (content) {
            extracted = JSON.parse(content);
          }
        } else {
          console.warn(`[Groq Resume Parser] API error: ${response.status}`);
        }
      } catch (err) {
        console.warn('[Groq Resume Parser] Failed to parse with Groq, falling back to heuristics:', err);
      }
    }

    // 3. Fallback extraction if Groq key missing
    if (!extracted.topSkills || extracted.topSkills.length === 0) {
      const techKeywords = ['React', 'Node.js', 'TypeScript', 'JavaScript', 'Python', 'Go', 'Next.js', 'PostgreSQL', 'Tailwind', 'Fastify', 'Docker'];
      const foundSkills = techKeywords.filter((kw) => new RegExp(`\\b${kw}\\b`, 'i').test(resumeText)).slice(0, 3);
      extracted.topSkills = foundSkills.length > 0 ? foundSkills : ['Software Engineer'];
      extracted.targetRole = extracted.targetRole || 'Software Engineer';
    }

    // 4. Update user profile & preferences in Prisma DB
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const existingPrefs = (currentUser?.preferences as Record<string, unknown>) || {};

    const updatedPrefs: UserPreferences = {
      ...existingPrefs,
      targetRole: extracted.targetRole || (existingPrefs.targetRole as string) || 'Software Engineer',
      topSkills: (extracted.topSkills && extracted.topSkills.length > 0) ? extracted.topSkills.slice(0, 4) : ((existingPrefs.topSkills as string[]) || []),
      portfolioLink: extracted.portfolioLink || (existingPrefs.portfolioLink as string) || '',
      topProjects: (extracted.topProjects && extracted.topProjects.length > 0) ? extracted.topProjects.slice(0, 2) : ((existingPrefs.topProjects as string[]) || [])
    };

    await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: updatedPrefs as any,
        ...(extracted.fullName && !currentUser?.fullName ? { fullName: extracted.fullName } : {})
      }
    });

    return {
      fullName: extracted.fullName || currentUser?.fullName || undefined,
      preferences: updatedPrefs
    };
  }

  /**
   * Updates user profile and preferences manually
   */
  public async updateProfile(userId: string, data: UpdateProfileRequest): Promise<ProfileResponse> {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    const existingPrefs = (currentUser?.preferences as Record<string, unknown>) || {};

    const updatedPrefs: UserPreferences = {
      ...existingPrefs,
      ...(data.targetRole !== undefined && { targetRole: data.targetRole }),
      ...(data.topSkills !== undefined && { topSkills: data.topSkills.slice(0, 4) }),
      ...(data.portfolioLink !== undefined && { portfolioLink: data.portfolioLink }),
      ...(data.topProjects !== undefined && { topProjects: data.topProjects.slice(0, 3) }),
      ...(data.followUpCadenceDays !== undefined && { followUpCadenceDays: data.followUpCadenceDays }),
      ...(data.notificationsEnabled !== undefined && { notificationsEnabled: data.notificationsEnabled })
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        preferences: updatedPrefs as any
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarUrl: true,
        googleId: true,
        githubId: true,
        preferences: true
      }
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      avatarUrl: updatedUser.avatarUrl,
      hasGoogleLinked: Boolean(updatedUser.googleId),
      hasGithubLinked: Boolean(updatedUser.githubId),
      preferences: updatedPrefs
    };
  }
}

export const profileService = new ProfileService();
export default profileService;
