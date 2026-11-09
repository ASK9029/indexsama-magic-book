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
  dir = await mkdtemp(join(tmpdir(), 'life-water-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('water and shared weight', () => {
  it('adds water, aggregates it in the diet day and undoes the last cup', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/water',
      payload: { date, amountMl: 500 },
    });
    expect(first.statusCode).toBe(201);

    await app.inject({
      method: 'POST',
      url: '/api/water',
      payload: { date, amountMl: 250 },
    });

    const list = await app.inject({
      method: 'GET',
      url: `/api/water?date=${date}`,
    });
    expect(list.json()).toHaveLength(2);

    const day = await app.inject({
      method: 'GET',
      url: `/api/diet/day?date=${date}`,
    });
    expect(day.json().summary.waterMl).toBe(750);

    const undo = await app.inject({
      method: 'POST',
      url: '/api/water/undo',
      payload: { date },
    });
    expect(undo.statusCode).toBe(200);

    const afterUndo = await app.inject({
      method: 'GET',
      url: `/api/diet/day?date=${date}`,
    });
    expect(afterUndo.json().summary.waterMl).toBe(500);
  });

  it('rejects future water and weight writes', async () => {
    const water = await app.inject({
      method: 'POST',
      url: '/api/water',
      payload: { date: '2999-01-01', amountMl: 250 },
    });
    expect(water.statusCode).toBe(400);
    expect(water.json().error.code).toBe('FUTURE_DATE');

    const weight = await app.inject({
      method: 'POST',
      url: '/api/weights',
      payload: { date: '2999-01-01', weightKg: 70 },
    });
    expect(weight.statusCode).toBe(400);
    expect(weight.json().error.code).toBe('FUTURE_DATE');
  });

  it('uses the last weight of the day in diet and fitness stats', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/weights',
      payload: { date, weightKg: 70 },
    });
    await app.inject({
      method: 'POST',
      url: '/api/weights',
      payload: { date, weightKg: 70.5 },
    });

    const day = await app.inject({
      method: 'GET',
      url: `/api/diet/day?date=${date}`,
    });
    expect(day.json().summary.weightKg).toBe(70.5);

    const stats = await app.inject({
      method: 'GET',
      url: `/api/stats/fitness?view=week&anchor=${date}`,
    });
    const point = stats
      .json()
      .weight.find((item: { date: string }) => item.date === date);
    expect(point.value).toBe(70.5);
  });
});
