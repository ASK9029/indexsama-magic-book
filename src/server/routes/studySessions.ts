import type { FastifyInstance } from 'fastify';
import { sessionCreateSchema, sessionUpdateSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { getSubject } from '../repositories/subjects';
import {
  createSession,
  deleteSession,
  listSessions,
  updateSession,
} from '../repositories/studySessions';
import { getStudyWeekStats } from '../services/studyStats';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: unknown): string {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
  }
  return value;
}

function optionalDate(value: unknown): string | undefined {
  if (value === undefined || value === '') return undefined;
  return requireDate(value);
}

export async function studySessionsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Querystring: { subjectId?: string; from?: string; to?: string };
  }>('/api/study/sessions', async (request) =>
    listSessions(app.dbManager.get(), {
      subjectId: request.query.subjectId,
      from: optionalDate(request.query.from),
      to: optionalDate(request.query.to),
    }),
  );

  app.post('/api/study/sessions', async (request, reply) => {
    const parsed = sessionCreateSchema.safeParse(request.body);
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

    const session = createSession(db, parsed.data);
    return reply.status(201).send(session);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/study/sessions/:id',
    async (request) => {
      const parsed = sessionUpdateSchema.safeParse(request.body);
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

      const session = updateSession(db, request.params.id, parsed.data);
      if (!session) throw new ApiError('SESSION_NOT_FOUND', '学习记录不存在', 404);
      return session;
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/study/sessions/:id',
    async (request) => {
      const deleted = deleteSession(app.dbManager.get(), request.params.id);
      if (!deleted) throw new ApiError('SESSION_NOT_FOUND', '学习记录不存在', 404);
      return { ok: true };
    },
  );

  app.get<{ Querystring: { week?: string } }>(
    '/api/study/stats',
    async (request) =>
      getStudyWeekStats(
        app.dbManager.get(),
        requireDate(request.query.week),
      ),
  );
}
