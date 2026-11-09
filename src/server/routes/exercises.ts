import type { FastifyInstance } from 'fastify';
import { exerciseCreateSchema, exerciseUpdateSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import {
  createExercise,
  deleteExercise,
  getExercise,
  listExercises,
  updateExercise,
} from '../repositories/exercises';

export async function exercisesRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Querystring: {
      q?: string;
      muscleGroup?: string;
      equipment?: string;
      type?: string;
    };
  }>('/api/fitness/exercises', async (request) =>
    listExercises(app.dbManager.get(), request.query),
  );

  app.post('/api/fitness/exercises', async (request, reply) => {
    const parsed = exerciseCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const exercise = createExercise(app.dbManager.get(), parsed.data);
    return reply.status(201).send(exercise);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/fitness/exercises/:id',
    async (request) => {
      const parsed = exerciseUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const db = app.dbManager.get();
      const current = getExercise(db, request.params.id);
      if (!current) throw new ApiError('EXERCISE_NOT_FOUND', '动作不存在', 404);
      if (current.builtIn) {
        throw new ApiError('BUILT_IN_EXERCISE', '内置动作不可修改', 403);
      }

      return updateExercise(db, current.id, parsed.data);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/fitness/exercises/:id',
    async (request) => {
      const db = app.dbManager.get();
      const current = getExercise(db, request.params.id);
      if (!current) throw new ApiError('EXERCISE_NOT_FOUND', '动作不存在', 404);
      if (current.builtIn) {
        throw new ApiError('BUILT_IN_EXERCISE', '内置动作不可删除', 403);
      }

      deleteExercise(db, current.id);
      return { ok: true };
    },
  );
}
