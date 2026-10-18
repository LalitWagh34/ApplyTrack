/**
 * Prisma Fastify Plugin
 * Injects @applytrack/database PrismaClient into Fastify instance
 */
import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { prisma } from '@applytrack/database';

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {
  // Decorate fastify with singleton prisma client
  fastify.decorate('prisma', prisma);

  // Clean shutdown hook
  fastify.addHook('onClose', async (server) => {
    server.log.info('Disconnecting Prisma Client...');
    await prisma.$disconnect();
    server.log.info('Prisma Client disconnected.');
  });
}

export default fp(prismaPlugin, {
  name: 'prisma-plugin'
});
