/**
 * Centralized Fastify Error Handler
 * Normalizes Zod, Prisma, Fastify, and custom errors into standard API responses
 */
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  // 1. Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: 'Validation Error',
      details: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // 2. Handle Fastify schema validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: 'Validation Error',
      details: error.validation
    });
  }

  // 3. Handle Prisma unique constraint violations (P2002)
  if ((error as { code?: string }).code === 'P2002') {
    return reply.status(409).send({
      success: false,
      error: 'Conflict: A record with this unique value already exists'
    });
  }

  // 4. Handle Unauthorized / JWT errors
  if (error.statusCode === 401 || error.name === 'UnauthorizedError') {
    return reply.status(401).send({
      success: false,
      error: error.message || 'Unauthorized access'
    });
  }

  // 5. Handle Forbidden errors
  if (error.statusCode === 403) {
    return reply.status(403).send({
      success: false,
      error: error.message || 'Forbidden'
    });
  }

  // 6. Handle Not Found errors
  if (error.statusCode === 404) {
    return reply.status(404).send({
      success: false,
      error: error.message || 'Resource not found'
    });
  }

  // 7. Fallback Internal Server Error
  const statusCode = error.statusCode || 500;
  const isDev = process.env.NODE_ENV === 'development';

  return reply.status(statusCode).send({
    success: false,
    error: isDev ? error.message : 'Internal Server Error',
    ...(isDev && { stack: error.stack })
  });
}

export default errorHandler;
