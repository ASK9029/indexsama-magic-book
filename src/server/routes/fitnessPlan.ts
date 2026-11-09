import type { FastifyInstance } from 'fastify';
import { planDaySchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { getExercise } from '../repositories/exercises';
import { getPlan, savePlanDay } from '../repositories/fitnessPlan';

export async function fitnessPlanRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/fitness/plan', async () => getPlan(app.dbManager.get()));

  app.put<{ Params: { weekday: string } }>(
    '/api/fitness/plan/:weekday',
    async (request) => {
      const weekday = Number(request.params.weekday);
      if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
        throw new ApiError('VALIDATION_ERROR', '星期必须是 1–7', 400);
      }

      const parsed = planDaySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const db = app.dbManager.get();
      for (const exercise of parsed.data.exercises) {
        if (!getExercise(db, exercise.exerciseId)) {
          throw new ApiError('EXERCISE_NOT_FOUND', '动作不存在', 404);
        }
      }

      return savePlanDay(db, weekday, parsed.data);
    },
  );
}
