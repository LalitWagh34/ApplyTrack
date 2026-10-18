/**
 * Central Bootstrap Initializer
 * Starts Fastify server, initializes BullMQ workers, binds lifecycle hooks, and manages graceful shutdowns
 */
import { FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { buildApp } from './app.js';
import { allQueues } from './config/bullmq.js';
import { initEmailIngestWorker } from './queues/email-ingest.worker.js';
import { initWatchRenewalWorker } from './queues/watch-renewal.worker.js';
import { initFollowUpCronWorker } from './queues/followup-cron.worker.js';

let serverInstance: FastifyInstance | null = null;

export async function bootstrap(): Promise<FastifyInstance> {
  const app = await buildApp();
  serverInstance = app;

  // Initialize BullMQ Workers
  const emailWorker = initEmailIngestWorker();
  const watchWorker = initWatchRenewalWorker();
  const followUpWorker = initFollowUpCronWorker();

  try {
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0'
    });

    app.log.info(`🚀 ApplyTrack API Server listening at: ${address}`);
    app.log.info(`🩺 Health check available at: ${address}/health`);
    app.log.info(`🌱 Environment: ${env.NODE_ENV}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful Shutdown Registration
  const handleSignal = async (signal: string) => {
    app.log.info(`Received ${signal}. Initiating graceful shutdown...`);

    // 1. Close BullMQ workers
    try {
      app.log.info('Closing BullMQ workers...');
      await Promise.all([emailWorker.close(), watchWorker.close(), followUpWorker.close()]);
      app.log.info('BullMQ workers closed.');
    } catch (wErr) {
      app.log.error({ wErr }, 'Error while closing workers:');
    }

    // 2. Pause and close BullMQ queues
    try {
      app.log.info('Closing BullMQ queues...');
      await Promise.all(allQueues.map((q) => q.close()));
      app.log.info('BullMQ queues closed.');
    } catch (qErr) {
      app.log.error({ qErr }, 'Error while closing queues:');
    }

    // 3. Close Fastify server (triggers onClose hooks for Prisma, Redis, etc.)
    try {
      await app.close();
      app.log.info('Server closed cleanly. Goodbye!');
      process.exit(0);
    } catch (closeErr) {
      app.log.error({ closeErr }, 'Error during server shutdown:');
      process.exit(1);
    }
  };

  process.once('SIGINT', () => void handleSignal('SIGINT'));
  process.once('SIGTERM', () => void handleSignal('SIGTERM'));

  return app;
}

export async function shutdown(): Promise<void> {
  if (serverInstance) {
    await serverInstance.close();
  }
}

export default bootstrap;
