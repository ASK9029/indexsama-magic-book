import type { FastifyInstance } from 'fastify';
import {
  arrangementCreateSchema,
  arrangementUpdateSchema,
} from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { getSubject } from '../repositories/subjects';
import {
  createArrangement,
  deleteArrangement,
  listArrangements,
  updateArrangement,
} from '../repositories/studyArrangements';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: unknown): string {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
  }
  return value;
}

export async function studyArrangementsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { date?: string } }>(
    '/api/study/arrangements',
    async (request) =>
      listArrangements(app.dbManager.get(), requireDate(request.query.date)),
  );

  app.post('/api/study/arrangements', async (request, reply) => {
    const parsed = arrangementCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const db = app.dbManager.get();
    if (!getSubject(db, parsed.data.subjectId)) {
      throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
    }

    const arrangement = createArrangement(db, parsed.data);
    return reply.status(201).send(arrangement);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/study/arrangements/:id',
    async (request) => {
      const parsed = arrangementUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const db = app.dbManager.get();
      if (parsed.data.subjectId && !getSubject(db, parsed.data.subjectId)) {
        throw new ApiError('SUBJECT_NOT_FOUND', '科目不存在', 404);
      }

      const arrangement = updateArrangement(db, request.params.id, parsed.data);
      if (!arrangement) throw new ApiError('ARRANGEMENT_NOT_FOUND', '学习安排不存在', 404);
      return arrangement;
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/study/arrangements/:id',
    async (request) => {
      const deleted = deleteArrangement(app.dbManager.get(), request.params.id);
      if (!deleted) throw new ApiError('ARRANGEMENT_NOT_FOUND', '学习安排不存在', 404);
      return { ok: true };
    },
  );
}
