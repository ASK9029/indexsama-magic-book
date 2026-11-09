import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import {
  upgradeCreateSchema,
  upgradeUpdateSchema,
} from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { getExercise } from '../repositories/exercises';
import {
  createUpgrade,
  deleteUpgrade,
  getUpgrade,
  listUpgrades,
  updateUpgrade,
} from '../repositories/upgrades';
import {
  getCurrentWeight,
  getCurrentWeights,
} from '../services/currentWeights';

function requireWeightExercise(
  db: ReturnType<FastifyInstance['dbManager']['get']>,
  exerciseId: string,
) {
  const exercise = getExercise(db, exerciseId);
  if (!exercise) throw new ApiError('EXERCISE_NOT_FOUND', '动作不存在', 404);
  if (exercise.type !== 'weight') {
    throw new ApiError(
      'EXERCISE_NOT_WEIGHT',
      '徒手动作不能记录重量升级',
      400,
    );
  }
  return exercise;
}

function assertNotFuture(date: string): void {
  if (date > toLocalDate(new Date())) {
    throw new ApiError('FUTURE_DATE', '不能记录未来日期的升级', 400);
  }
}

export async function upgradesRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/fitness/current-weights', async () =>
    getCurrentWeights(app.dbManager.get()),
  );

  app.get<{ Querystring: { exerciseId?: string } }>(
    '/api/fitness/upgrades',
    async (request) =>
      listUpgrades(app.dbManager.get(), request.query.exerciseId),
  );

  app.post('/api/fitness/upgrades', async (request, reply) => {
    const parsed = upgradeCreateSchema.safeParse(request.body);
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
    const exercise = requireWeightExercise(db, parsed.data.exerciseId);
    assertNotFuture(parsed.data.date);

    const from = parsed.data.fromWeightKg ?? getCurrentWeight(db, exercise.id);
    if (from === null) {
      throw new ApiError('FROM_WEIGHT_REQUIRED', '请填写原重量', 400);
    }
    if (from === parsed.data.toWeightKg) {
      throw new ApiError('SAME_WEIGHT', '新旧重量不能相同', 400);
    }

    const upgrade = createUpgrade(db, {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      date: parsed.data.date,
      fromWeightKg: from,
      toWeightKg: parsed.data.toWeightKg,
      note: parsed.data.note,
    });

    return reply.status(201).send(upgrade);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/fitness/upgrades/:id',
    async (request) => {
      const parsed = upgradeUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const db = app.dbManager.get();
      const current = getUpgrade(db, request.params.id);
      if (!current) throw new ApiError('UPGRADE_NOT_FOUND', '升级记录不存在', 404);
      if (current.exerciseId) requireWeightExercise(db, current.exerciseId);

      const date = parsed.data.date ?? current.date;
      assertNotFuture(date);

      const from = parsed.data.fromWeightKg ?? current.fromWeightKg;
      const to = parsed.data.toWeightKg ?? current.toWeightKg;
      if (from === to) {
        throw new ApiError('SAME_WEIGHT', '新旧重量不能相同', 400);
      }

      return updateUpgrade(db, current.id, {
        date,
        fromWeightKg: from,
        toWeightKg: to,
        note: parsed.data.note ?? current.note,
      });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/fitness/upgrades/:id',
    async (request) => {
      const deleted = deleteUpgrade(app.dbManager.get(), request.params.id);
      if (!deleted) throw new ApiError('UPGRADE_NOT_FOUND', '升级记录不存在', 404);
      return { ok: true };
    },
  );
}
