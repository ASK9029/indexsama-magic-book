import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import {
  workoutFinishSchema,
  workoutSessionUpdateSchema,
  workoutSetCreateSchema,
  workoutSetUpdateSchema,
  workoutStartSchema,
} from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { getPlanDay } from '../repositories/fitnessPlan';
import {
  addSet,
  createSession,
  deleteSession,
  deleteSet,
  finishSession,
  getSession,
  getSessionForDate,
  listCompletedSessions,
  updateSession,
  updateSet,
} from '../repositories/workouts';

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

function weekdayFor(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  const jsDay = new Date(year, month - 1, day).getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export async function workoutsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { date?: string } }>(
    '/api/fitness/today',
    async (request) => {
      const date = request.query.date
        ? requireDate(request.query.date)
        : toLocalDate(new Date());
      const db = app.dbManager.get();
      return {
        plan: getPlanDay(db, weekdayFor(date)),
        session: getSessionForDate(db, date),
      };
    },
  );

  app.post('/api/fitness/sessions', async (request, reply) => {
    const parsed = workoutStartSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const session = createSession(app.dbManager.get(), parsed.data);
    return reply.status(201).send(session);
  });

  app.get<{ Querystring: { from?: string; to?: string } }>(
    '/api/fitness/sessions',
    async (request) =>
      listCompletedSessions(
        app.dbManager.get(),
        optionalDate(request.query.from),
        optionalDate(request.query.to),
      ),
  );

  app.get<{ Params: { id: string } }>(
    '/api/fitness/sessions/:id',
    async (request) => {
      const session = getSession(app.dbManager.get(), request.params.id);
      if (!session) throw new ApiError('SESSION_NOT_FOUND', '训练不存在', 404);
      return session;
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/api/fitness/sessions/:id',
    async (request) => {
      const parsed = workoutSessionUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const session = updateSession(
        app.dbManager.get(),
        request.params.id,
        parsed.data,
      );
      if (!session) throw new ApiError('SESSION_NOT_FOUND', '训练不存在', 404);
      return session;
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/fitness/sessions/:id',
    async (request) => {
      const deleted = deleteSession(app.dbManager.get(), request.params.id);
      if (!deleted) throw new ApiError('SESSION_NOT_FOUND', '训练不存在', 404);
      return { ok: true };
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/fitness/sessions/:id/sets',
    async (request, reply) => {
      const parsed = workoutSetCreateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: '参数不正确',
            details: parsed.error.flatten(),
          },
        });
      }

      const set = addSet(app.dbManager.get(), request.params.id, parsed.data);
      if (!set) throw new ApiError('SESSION_NOT_FOUND', '训练不存在', 404);
      return reply.status(201).send(set);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/api/fitness/sets/:id',
    async (request) => {
      const parsed = workoutSetUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const set = updateSet(app.dbManager.get(), request.params.id, parsed.data);
      if (!set) throw new ApiError('SET_NOT_FOUND', '训练组不存在', 404);
      return set;
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/fitness/sets/:id',
    async (request) => {
      const deleted = deleteSet(app.dbManager.get(), request.params.id);
      if (!deleted) throw new ApiError('SET_NOT_FOUND', '训练组不存在', 404);
      return { ok: true };
    },
  );

  app.post<{ Params: { id: string } }>(
    '/api/fitness/sessions/:id/finish',
    async (request) => {
      const parsed = workoutFinishSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const current = getSession(app.dbManager.get(), request.params.id);
      if (!current) throw new ApiError('SESSION_NOT_FOUND', '训练不存在', 404);
      if (current.sets.length === 0 && !parsed.data.confirmEmpty) {
        throw new ApiError(
          'EMPTY_SESSION',
          '还没有训练组，请确认后再结束',
          400,
        );
      }

      return finishSession(app.dbManager.get(), current.id, parsed.data);
    },
  );
}
