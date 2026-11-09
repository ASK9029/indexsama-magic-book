import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;
const date = '2026-11-09';

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-meals-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('daily meals', () => {
  it('separates plan and actual, copies and clears plan', async () => {
    const planned = await app.inject({
      method: 'POST',
      url: '/api/diet/entries',
      payload: {
        date,
        meal: 'lunch',
        kind: 'plan',
        foodId: 'food-chicken-breast',
        amount: 150,
        unit: 'g',
      },
    });
    expect(planned.statusCode).toBe(201);
    expect(planned.json().calories).toBeCloseTo(199.5);
    expect(planned.json().protein).toBeCloseTo(45);

    const day1 = await app.inject({
      method: 'GET',
      url: `/api/diet/day?date=${date}`,
    });
    expect(day1.json().meals).toHaveLength(4);
    expect(day1.json().summary.calories).toBe(0);
    const lunch1 = day1
      .json()
      .meals.find((meal: { meal: string }) => meal.meal === 'lunch');
    expect(lunch1.plannedCalories).toBeCloseTo(199.5);

    const actual = await app.inject({
      method: 'POST',
      url: '/api/diet/entries',
      payload: {
        date,
        meal: 'lunch',
        kind: 'actual',
        foodId: 'food-rice',
        amount: 200,
        unit: 'g',
      },
    });
    expect(actual.statusCode).toBe(201);
    expect(actual.json().calories).toBeCloseTo(232);

    const day2 = await app.inject({
      method: 'GET',
      url: `/api/diet/day?date=${date}`,
    });
    expect(day2.json().summary.calories).toBeCloseTo(232);
    expect(day2.json().summary.protein).toBeCloseTo(5.2);

    await app.inject({
      method: 'POST',
      url: '/api/diet/entries',
      payload: {
        date,
        meal: 'breakfast',
        kind: 'plan',
        foodId: 'food-egg',
        amount: 50,
        unit: 'g',
      },
    });

    const copied = await app.inject({
      method: 'POST',
      url: '/api/diet/meals/breakfast/copy-plan',
      payload: { date, mode: 'replace' },
    });
    expect(copied.statusCode).toBe(200);
    expect(copied.json()).toHaveLength(1);
    expect(copied.json()[0].kind).toBe('actual');

    const appended = await app.inject({
      method: 'POST',
      url: '/api/diet/meals/breakfast/copy-plan',
      payload: { date, mode: 'append' },
    });
    expect(appended.json()).toHaveLength(2);

    const replaced = await app.inject({
      method: 'POST',
      url: '/api/diet/meals/breakfast/copy-plan',
      payload: { date, mode: 'replace' },
    });
    expect(replaced.json()).toHaveLength(1);

    const done = await app.inject({
      method: 'POST',
      url: '/api/diet/meals/breakfast/done',
      payload: { date, done: true },
    });
    expect(done.json().done).toBe(true);

    const cleared = await app.inject({
      method: 'POST',
      url: '/api/diet/meals/breakfast/clear',
      payload: { date, kind: 'actual' },
    });
    expect(cleared.statusCode).toBe(200);

    const day3 = await app.inject({
      method: 'GET',
      url: `/api/diet/day?date=${date}`,
    });
    const breakfast = day3
      .json()
      .meals.find((meal: { meal: string }) => meal.meal === 'breakfast');
    expect(breakfast.actualEntries).toHaveLength(0);
    expect(breakfast.plannedEntries).toHaveLength(1);
    expect(breakfast.done).toBe(true);
  });

  it('rejects future actual entries but allows future plans', async () => {
    const futureActual = await app.inject({
      method: 'POST',
      url: '/api/diet/entries',
      payload: {
        date: '2999-01-01',
        meal: 'lunch',
        kind: 'actual',
        foodId: 'food-rice',
        amount: 100,
        unit: 'g',
      },
    });
    expect(futureActual.statusCode).toBe(400);
    expect(futureActual.json().error.code).toBe('FUTURE_DATE');

    const futurePlan = await app.inject({
      method: 'POST',
      url: '/api/diet/entries',
      payload: {
        date: '2999-01-01',
        meal: 'lunch',
        kind: 'plan',
        foodId: 'food-rice',
        amount: 100,
        unit: 'g',
      },
    });
    expect(futurePlan.statusCode).toBe(201);
  });

  it('recomputes portions from snapshots after food edits', async () => {
    const food = await app.inject({
      method: 'POST',
      url: '/api/foods',
      payload: {
        name: '快照测试食物',
        category: '零食',
        unit: 'g',
        per100Calories: 50,
        per100Protein: 10,
      },
    });
    const entry = await app.inject({
      method: 'POST',
      url: '/api/diet/entries',
      payload: {
        date,
        meal: 'snack',
        kind: 'plan',
        foodId: food.json().id,
        amount: 100,
        unit: 'g',
      },
    });
    expect(entry.json().calories).toBeCloseTo(50);

    await app.inject({
      method: 'PATCH',
      url: `/api/foods/${food.json().id}`,
      payload: { per100Calories: 60 },
    });

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/diet/entries/${entry.json().id}`,
      payload: { amount: 200 },
    });
    expect(patched.json().calories).toBeCloseTo(100);
    expect(patched.json().protein).toBeCloseTo(20);
  });
});
