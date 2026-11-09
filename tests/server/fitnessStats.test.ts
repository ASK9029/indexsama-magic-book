import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

async function updateSet(
  id: string,
  weightKg: number | null,
  reps: number,
) {
  return app.inject({
    method: 'PATCH',
    url: `/api/fitness/sets/${id}`,
    payload: { weightKg, reps, done: true },
  });
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-fitness-stats-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });

  await app.inject({
    method: 'PUT',
    url: '/api/fitness/plan/1',
    payload: {
      name: '推日',
      isRest: false,
      exercises: [
        {
          exerciseId: 'builtin-bench-press',
          targetSets: 2,
          targetReps: '8',
          sortOrder: 0,
        },
        {
          exerciseId: 'builtin-pushup',
          targetSets: 1,
          targetReps: '10',
          sortOrder: 1,
        },
      ],
    },
  });

  const first = await app.inject({
    method: 'POST',
    url: '/api/fitness/sessions',
    payload: { date: '2026-11-09' },
  });
  for (const set of first.json().sets as Array<{
    id: string;
    exerciseName: string;
  }>) {
    if (set.exerciseName === '杠铃卧推') {
      await updateSet(set.id, 60, 8);
    } else {
      await updateSet(set.id, null, 10);
    }
  }
  await app.inject({
    method: 'POST',
    url: `/api/fitness/sessions/${first.json().id}/finish`,
    payload: { durationMinutes: 45 },
  });

  const second = await app.inject({
    method: 'POST',
    url: '/api/fitness/sessions',
    payload: {
      date: '2026-11-10',
      name: '徒手日',
      exercises: [
        {
          exerciseId: 'builtin-pushup',
          targetSets: 3,
          targetReps: '10',
          sortOrder: 0,
        },
      ],
    },
  });
  for (const set of second.json().sets as Array<{ id: string }>) {
    await updateSet(set.id, null, 10);
  }
  await app.inject({
    method: 'POST',
    url: `/api/fitness/sessions/${second.json().id}/finish`,
    payload: { durationMinutes: 20 },
  });

  for (const [date, weightKg] of [
    ['2026-11-09', 70],
    ['2026-11-10', 70.5],
    ['2026-11-11', 71],
  ] as const) {
    await app.inject({
      method: 'POST',
      url: '/api/weights',
      payload: { date, weightKg },
    });
  }
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('fitness stats and weights', () => {
  it('builds week and year series with the PRD rules', async () => {
    const week = await app.inject({
      method: 'GET',
      url: '/api/stats/fitness?view=week&anchor=2026-11-09&exerciseId=builtin-bench-press',
    });
    expect(week.statusCode).toBe(200);
    const weekData = week.json();
    expect(weekData.range).toEqual({ from: '2026-11-09', to: '2026-11-15' });
    expect(weekData.summary.totalVolume).toBe(960);
    expect(weekData.summary.sessionCount).toBe(2);
    expect(weekData.volume.map((point: { value: number | null }) => point.value)).toEqual([
      960,
      0,
      null,
      null,
      null,
      null,
      null,
    ]);
    expect(weekData.count.map((point: { value: number | null }) => point.value)).toEqual([
      1, 1, 0, 0, 0, 0, 0,
    ]);
    expect(weekData.weight.map((point: { value: number | null }) => point.value)).toEqual([
      70, 70.5, 71, null, null, null, null,
    ]);
    expect(weekData.strength.map((point: { value: number | null }) => point.value)).toEqual([
      60, null, null, null, null, null, null,
    ]);
    expect(weekData.exerciseOptions).toContainEqual({
      id: 'builtin-bench-press',
      name: '杠铃卧推',
    });

    const year = await app.inject({
      method: 'GET',
      url: '/api/stats/fitness?view=year&anchor=2026-11-09&exerciseId=builtin-bench-press',
    });
    const yearData = year.json();
    expect(yearData.range).toEqual({ from: '2026-01-01', to: '2026-12-31' });
    expect(yearData.volume[10].value).toBe(960);
    expect(yearData.count[10].value).toBe(2);
    expect(yearData.weight[10].value).toBeCloseTo(70.5);
    expect(yearData.strength[10].value).toBe(60);
    expect(yearData.volume[0].value).toBeNull();
  });

  it('lists, edits and deletes weight logs', async () => {
    const list = await app.inject({
      method: 'GET',
      url: '/api/weights?from=2026-11-09&to=2026-11-11',
    });
    expect(list.json()).toHaveLength(3);

    const latest = list.json()[2];
    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/weights/${latest.id}`,
      payload: { weightKg: 72 },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().weightKg).toBe(72);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/weights/${latest.id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const after = await app.inject({
      method: 'GET',
      url: '/api/weights?from=2026-11-09&to=2026-11-11',
    });
    expect(after.json()).toHaveLength(2);
  });
});
