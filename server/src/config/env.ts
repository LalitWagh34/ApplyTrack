/**
 * Environment Configuration & Zod Validation
 * Fails fast at startup if critical variables are missing or invalid
 */
import { config } from 'dotenv';
import { z } from 'zod';

// Load .env into process.env before validation
config();

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z
    .string()
    .transform((val) => val.trim().replace(/[\r\n\t\s]+/g, '').replace(/\/+$/, ''))
    .default('http://localhost:3000'),

  // PostgreSQL Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis & BullMQ
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),

  // JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Token Encryption Vault (AES-256-GCM)
  TOKEN_ENCRYPTION_KEY: z.string().length(64, 'TOKEN_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'),

  // Google OAuth & Gmail
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  GOOGLE_REDIRECT_URI: z
    .string()
    .transform((val) => val.trim().replace(/[\r\n\t\s]+/g, ''))
    .default('http://localhost:4000/api/v1/auth/google/callback'),
  GOOGLE_PUBSUB_TOPIC: z.string().optional().default(''),
  GOOGLE_PUBSUB_VERIFICATION_TOKEN: z.string().optional().default(''),

  // GitHub OAuth
  GITHUB_CLIENT_ID: z.string().optional().default(''),
  GITHUB_CLIENT_SECRET: z.string().optional().default(''),
  GITHUB_REDIRECT_URI: z
    .string()
    .transform((val) => val.trim().replace(/[\r\n\t\s]+/g, ''))
    .default('http://localhost:4000/api/v1/auth/github/callback'),

  // Web Push (VAPID)
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_SUBJECT: z.string().default('mailto:support@applytrack.dev')
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    console.error(`\n❌ [Config Error] Invalid environment variables:\n${errorDetails}\n`);
    throw new Error('Environment configuration validation failed');
  }

  return result.data;
}

export const env = validateEnv();
export default env;
