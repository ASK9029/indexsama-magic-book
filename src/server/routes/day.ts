import type { FastifyInstance } from 'fastify';
import { ApiError } from '../lib/errors';
import { getDay } from '../services/day';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function dayRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { date: string } }>(
    '/api/day/:date',
    async (request) => {
      if (!datePattern.test(request.params.date)) {
        throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
      }
      return getDay(app.dbManager.get(), request.params.date);
    },
  );
}
