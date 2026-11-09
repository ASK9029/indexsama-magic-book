import type { FastifyInstance } from 'fastify';
import { foodCreateSchema, foodUpdateSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import {
  createFood,
  deleteFood,
  frequentFoods,
  getFood,
  listFoods,
  recentFoods,
  updateFood,
} from '../repositories/foods';

export async function foodsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { q?: string; category?: string } }>(
    '/api/foods',
    async (request) =>
      listFoods(app.dbManager.get(), {
        q: request.query.q,
        category: request.query.category,
      }),
  );

  app.get('/api/foods/recent', async () =>
    recentFoods(app.dbManager.get()),
  );

  app.get('/api/foods/frequent', async () =>
    frequentFoods(app.dbManager.get()),
  );

  app.post('/api/foods', async (request, reply) => {
    const parsed = foodCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    const food = createFood(app.dbManager.get(), parsed.data);
    return reply.status(201).send(food);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/foods/:id',
    async (request) => {
      const parsed = foodUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const db = app.dbManager.get();
      const current = getFood(db, request.params.id);
      if (!current) throw new ApiError('FOOD_NOT_FOUND', '食物不存在', 404);
      if (current.builtIn) {
        throw new ApiError('BUILT_IN_FOOD', '内置食物不可修改', 403);
      }

      return updateFood(db, current.id, parsed.data);
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/foods/:id',
    async (request) => {
      const db = app.dbManager.get();
      const current = getFood(db, request.params.id);
      if (!current) throw new ApiError('FOOD_NOT_FOUND', '食物不存在', 404);
      if (current.builtIn) {
        throw new ApiError('BUILT_IN_FOOD', '内置食物不可删除', 403);
      }

      deleteFood(db, current.id);
      return { ok: true };
    },
  );
}
