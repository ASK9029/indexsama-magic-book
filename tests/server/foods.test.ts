import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-foods-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('food library', () => {
  it('seeds at least 25 foods across 8 categories', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/foods' });
    expect(response.statusCode).toBe(200);
    const foods = response.json() as Array<{ category: string; name: string }>;
    expect(foods.length).toBeGreaterThanOrEqual(25);
    expect(new Set(foods.map((food) => food.category)).size).toBe(8);
    expect(foods.some((food) => food.name === '米饭')).toBe(true);
  });

  it('creates, edits and deletes custom foods but protects built-ins', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/foods',
      payload: {
        name: '自定义鸡胸',
        category: '肉蛋奶',
        unit: 'g',
        per100Calories: 120,
        per100Protein: 26,
        servingName: '一份',
        servingAmount: 120,
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().builtIn).toBe(false);

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/foods/${created.json().id}`,
      payload: { per100Calories: 125 },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().per100Calories).toBe(125);

    const builtIn = await app.inject({
      method: 'PATCH',
      url: '/api/foods/food-rice',
      payload: { name: '改名' },
    });
    expect(builtIn.statusCode).toBe(403);
    expect(builtIn.json().error.code).toBe('BUILT_IN_FOOD');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/foods/${created.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const after = await app.inject({ method: 'GET', url: '/api/foods' });
    expect(
      (after.json() as Array<{ id: string }>).some(
        (food) => food.id === created.json().id,
      ),
    ).toBe(false);
  });

  it('returns recent and frequent foods from actual entries', async () => {
    const db = app.dbManager.get();
    const insert = db.prepare(
      'INSERT INTO meal_entries(id, date, meal, kind, food_id, food_name, amount, unit, serving_label, per100_calories, per100_protein, calories, protein, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    );

    const rows = [
      ['e1', 'food-rice', '米饭', 'actual', '2026-11-09T08:00:00.000Z'],
      ['e2', 'food-rice', '米饭', 'actual', '2026-11-09T09:00:00.000Z'],
      ['e3', 'food-egg', '鸡蛋', 'actual', '2026-11-09T10:00:00.000Z'],
      ['e4', 'food-chicken-breast', '鸡胸肉', 'plan', '2026-11-09T11:00:00.000Z'],
    ] as const;

    for (const [id, foodId, foodName, kind, createdAt] of rows) {
      insert.run(
        id,
        '2026-11-09',
        'breakfast',
        kind,
        foodId,
        foodName,
        100,
        'g',
        null,
        100,
        10,
        100,
        10,
        createdAt,
      );
    }

    const recent = await app.inject({
      method: 'GET',
      url: '/api/foods/recent',
    });
    expect(recent.json().map((food: { id: string }) => food.id)).toEqual([
      'food-egg',
      'food-rice',
    ]);

    const frequent = await app.inject({
      method: 'GET',
      url: '/api/foods/frequent',
    });
    expect(frequent.json()[0].id).toBe('food-rice');
    expect(frequent.json().map((food: { id: string }) => food.id)).not.toContain(
      'food-chicken-breast',
    );
  });
});
