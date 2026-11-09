import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '@shared/dates';
import {
  MEALS,
  mealClearSchema,
  mealCopyPlanSchema,
  mealDoneSchema,
  mealEntryCreateSchema,
  mealEntryUpdateSchema,
} from '@shared/schemas';
import type { Meal } from '@shared/types';
import { ApiError } from '../lib/errors';
import { getFood } from '../repositories/foods';
import {
  clearEntries,
  copyPlan,
  createEntry,
  deleteEntry,
  getEntry,
  setMealDone,
  updateEntry,
} from '../repositories/meals';
import { getDietDay } from '../services/dietDay';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function requireDate(value: unknown): string {
  if (typeof value !== 'string' || !datePattern.test(value)) {
    throw new ApiError('VALIDATION_ERROR', '日期格式应为 YYYY-MM-DD', 400);
  }
  return value;
}

function requireMeal(value: string): Meal {
  if (!(MEALS as readonly string[]).includes(value)) {
    throw new ApiError('VALIDATION_ERROR', '餐次不正确', 400);
  }
  return value as Meal;
}

function assertActualNotFuture(date: string, kind: 'plan' | 'actual'): void {
  if (kind === 'actual' && date > toLocalDate(new Date())) {
    throw new ApiError('FUTURE_DATE', '不能给未来日期记录实际饮食', 400);
  }
}

export async function mealsRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Querystring: { date?: string } }>(
    '/api/diet/day',
    async (request) => {
      const date = request.query.date
        ? requireDate(request.query.date)
        : toLocalDate(new Date());
      return getDietDay(app.dbManager.get(), date);
    },
  );

  app.post('/api/diet/entries', async (request, reply) => {
    const parsed = mealEntryCreateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '参数不正确',
          details: parsed.error.flatten(),
        },
      });
    }

    assertActualNotFuture(parsed.data.date, parsed.data.kind);

    const db = app.dbManager.get();
    const food = getFood(db, parsed.data.foodId);
    if (!food) throw new ApiError('FOOD_NOT_FOUND', '食物不存在', 404);

    const calories = (food.per100Calories * parsed.data.amount) / 100;
    const protein = (food.per100Protein * parsed.data.amount) / 100;

    const entry = createEntry(db, {
      date: parsed.data.date,
      meal: parsed.data.meal,
      kind: parsed.data.kind,
      foodId: food.id,
      foodName: food.name,
      amount: parsed.data.amount,
      unit: parsed.data.unit,
      servingLabel: parsed.data.servingLabel,
      per100Calories: food.per100Calories,
      per100Protein: food.per100Protein,
      calories,
      protein,
    });

    return reply.status(201).send(entry);
  });

  app.patch<{ Params: { id: string } }>(
    '/api/diet/entries/:id',
    async (request) => {
      const parsed = mealEntryUpdateSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      const entry = updateEntry(
        app.dbManager.get(),
        request.params.id,
        parsed.data,
      );
      if (!entry) throw new ApiError('ENTRY_NOT_FOUND', '饮食条目不存在', 404);
      return entry;
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/diet/entries/:id',
    async (request) => {
      const deleted = deleteEntry(app.dbManager.get(), request.params.id);
      if (!deleted) throw new ApiError('ENTRY_NOT_FOUND', '饮食条目不存在', 404);
      return { ok: true };
    },
  );

  app.post<{ Params: { meal: string } }>(
    '/api/diet/meals/:meal/done',
    async (request) => {
      const meal = requireMeal(request.params.meal);
      const parsed = mealDoneSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      return setMealDone(
        app.dbManager.get(),
        parsed.data.date,
        meal,
        parsed.data.done,
      );
    },
  );

  app.post<{ Params: { meal: string } }>(
    '/api/diet/meals/:meal/copy-plan',
    async (request) => {
      const meal = requireMeal(request.params.meal);
      const parsed = mealCopyPlanSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      assertActualNotFuture(parsed.data.date, 'actual');

      return copyPlan(
        app.dbManager.get(),
        parsed.data.date,
        meal,
        parsed.data.mode,
      );
    },
  );

  app.post<{ Params: { meal: string } }>(
    '/api/diet/meals/:meal/clear',
    async (request) => {
      const meal = requireMeal(request.params.meal);
      const parsed = mealClearSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new ApiError(
          'VALIDATION_ERROR',
          '参数不正确',
          400,
          parsed.error.flatten(),
        );
      }

      clearEntries(
        app.dbManager.get(),
        parsed.data.date,
        meal,
        parsed.data.kind,
      );
      return { ok: true };
    },
  );
}
