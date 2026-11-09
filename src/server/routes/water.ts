import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import { waterCreateSchema, waterUndoSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import {
  createWater,
  deleteWater,
  listWater,
  undoWater,
} from '../repositories/water';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: unknown): string {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
  }
  return value;
}

function assertNotFuture(date: string): void {
  if (date > toLocalDate(new Date())) {
    throw new ApiError('FUTURE_DATE', '不能给未来日期记录饮水', 400);
  }
}

export async function waterRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { date?: string } }>(
    '/api/water',
    async (request) => {
      const date = request.query.date
        ? requireDate(request.query.date)
        : toLocalDate(new Date());
      return listWater(app.dbManager.get(), date);
    },
  );

  app.post('/api/water', async (request, reply) => {
    const parsed = waterCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    assertNotFuture(parsed.data.date);
    const log = createWater(
      app.dbManager.get(),
      parsed.data.date,
      parsed.data.amountMl,
    );
    return reply.status(201).send(log);
  });

  app.post('/api/water/undo', async (request) => {
    const parsed = waterUndoSchema.safeParse(request.body);
    if (!parsed.success) {
      throw new ApiError(
        'VALIDATION_ERROR',
        '参数不正确',
        400,
        parsed.error.flatten(),
      );
    }

    assertNotFuture(parsed.data.date);
    undoWater(app.dbManager.get(), parsed.data.date);
    return { ok: true };
  });

  app.delete<{ Params: { id: string } }>(
    '/api/water/:id',
    async (request) => {
      const deleted = deleteWater(app.dbManager.get(), request.params.id);
      if (!deleted) throw new ApiError('WATER_NOT_FOUND', '饮水记录不存在', 404);
      return { ok: true };
    },
  );
}
