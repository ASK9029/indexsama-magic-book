import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-diet-stats-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });

  const foodA = await app.inject({
    method: 'POST',
    url: '/api/foods',
    payload: {
      name: '测试主食A',
      category: '主食',
      unit: 'g',
      per100Calories: 180,
      per100Protein: 9,
    },
  });
  const foodB = await app.inject({
    method: 'POST',
    url: '/api/foods',
    payload: {
      name: '测试主食B',
      category: '主食',
      unit: 'g',
      per100Calories: 160,
      per100Protein: 8,
    },
  });

  for (const [date, foodId] of [
    ['2026-11-02', foodA.json().id],
    ['2026-11-03', foodB.json().id],
  ] as const) {
    await app.inject({
      method: 'POST',
      url: '/api/diet/entries',
      payload: {
        date,
        meal: 'lunch',
        kind: 'actual',
        foodId,
        amount: 1000,
        unit: 'g',
      },
    });
  }

  await app.inject({
    method: 'POST',
    url: '/api/water',
    payload: { date: '2026-11-02', amountMl: 1000 },
  });
  await app.inject({
    method: 'POST',
    url: '/api/water',
    payload: { date: '2026-11-03', amountMl: 1500 },
  });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('diet stats', () => {
  it('requires a weight for the protein reference', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/settings/protein-reference',
    });
    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe('NO_WEIGHT');
  });

  it('builds week and year series and the protein reference', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/weights',
      payload: { date: '2026-11-02', weightKg: 70 },
    });

    const reference = await app.inject({
      method: 'POST',
      url: '/api/settings/protein-reference',
    });
    expect(reference.statusCode).toBe(200);
    expect(reference.json().proteinTarget).toBe(112);

    await app.inject({
      method: 'POST',
      url: '/api/weights',
      payload: { date: '2026-11-03', weightKg: 70.5 },
    });

    const week = await app.inject({
      method: 'GET',
      url: '/api/stats/diet?view=week&anchor=2026-11-02',
    });
    expect(week.statusCode).toBe(200);
    const weekData = week.json();
    expect(weekData.range).toEqual({ from: '2026-11-02', to: '2026-11-08' });
    expect(
      weekData.calories.map((point: { value: number | null }) => point.value),
    ).toEqual([1800, 1600, null, null, null, null, null]);
    expect(
      weekData.protein.map((point: { value: number | null }) => point.value),
    ).toEqual([90, 80, null, null, null, null, null]);
    expect(
      weekData.water.map((point: { value: number | null }) => point.value),
    ).toEqual([1000, 1500, null, null, null, null, null]);
    expect(
      weekData.weight.map((point: { value: number | null }) => point.value),
    ).toEqual([70, 70.5, null, null, null, null, null]);
    expect(weekData.summary.recordedDays).toBe(2);
    expect(weekData.summary.avgCalories).toBe(1700);
    expect(weekData.summary.avgProtein).toBe(85);
    expect(weekData.summary.avgWaterMl).toBe(1250);
    expect(weekData.summary.weightChange).toBeCloseTo(0.5);
    expect(weekData.targets).toEqual({
      calorieTarget: null,
      proteinTarget: null,
      waterTarget: null,
    });

    const year = await app.inject({
      method: 'GET',
      url: '/api/stats/diet?view=year&anchor=2026-11-02',
    });
    const yearData = year.json();
    expect(yearData.calories[10].value).toBe(1700);
    expect(yearData.protein[10].value).toBe(85);
    expect(yearData.water[10].value).toBe(1250);
    expect(yearData.weight[10].value).toBeCloseTo(70.25);
    expect(yearData.calories[0].value).toBeNull();
  });
});
