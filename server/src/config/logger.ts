/**
 * Fastify Pino Logger Configuration
 */
import { FastifyServerOptions } from 'fastify';
import { env } from './env.js';

export const loggerConfig: FastifyServerOptions['logger'] = env.NODE_ENV === 'development'
  ? {
      level: 'debug',
      transport: {
        target: 'pino/file',
        options: { destination: 1 } // stdout
      }
    }
  : {
      level: 'info'
    };

export default loggerConfig;
