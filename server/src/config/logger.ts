/**
 * Fastify Pino Logger Configuration
 */
import { FastifyServerOptions } from 'fastify';
import { env } from './env.js';

const redactionConfig = {
  paths: [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    'authorization',
    'cookie',
    'token',
    'accessToken',
    'refreshToken',
    'encryptedGoogleToken',
    'encryptedGithubToken'
  ],
  censor: '[REDACTED]'
};

export const loggerConfig: FastifyServerOptions['logger'] = env.NODE_ENV === 'development'
  ? {
      level: 'debug',
      redact: redactionConfig,
      transport: {
        target: 'pino/file',
        options: { destination: 1 } // stdout
      }
    }
  : {
      level: 'info',
      redact: redactionConfig
    };

export default loggerConfig;
