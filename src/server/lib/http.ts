import type { FastifyReply } from 'fastify';
import { ApiError } from './errors';

export function sendApiError(reply: FastifyReply, error: unknown): FastifyReply {
  if (error instanceof ApiError) {
    return reply.status(error.statusCode).send({
      error: { code: error.code, message: error.message, details: error.details },
    });
  }
  return reply.status(500).send({
    error: { code: 'INTERNAL_ERROR', message: '服务器错误' },
  });
}
