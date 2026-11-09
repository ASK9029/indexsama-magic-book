import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

async function currentBenchWeight() {
  const response = await app.inject({
    method: 'GET',
    url: '/api/fitness/current-weights',
  });
  const row = response
    .json()
    .find(
      (item: { exerciseId: string }) =>
        item.exerciseId === 'builtin-bench-press',
    );
  return row;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-upgrades-'));
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
          targetSets: 1,
          targetReps: '8-12',
          sortOrder: 0,
        },
      ],
    },
  });

  const started = await app.inject({
    method: 'POST',
    url: '/api/fitness/sessions',
    payload: { date: '2026-11-09' },
  });
  const setId = started.json().sets[0].id;
  await app.inject({
    method: 'PATCH',
    url: `/api/fitness/sets/${setId}`,
    payload: { weightKg: 60, reps: 8, done: true },
  });
  await app.inject({
    method: 'POST',
    url: `/api/fitness/sessions/${started.json().id}/finish`,
    payload: { durationMinutes: 30 },
  });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('exercise upgrades and current weights', () => {
  it('recomputes current weight and falls back to training max', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/fitness/upgrades',
      payload: {
        exerciseId: 'builtin-bench-press',
        date: '2026-11-09',
        fromWeightKg: 60,
        toWeightKg: 62.5,
      },
    });
    expect(first.statusCode).toBe(201);
    expect((await currentBenchWeight()).currentWeightKg).toBe(62.5);

    const second = await app.inject({
      method: 'POST',
      url: '/api/fitness/upgrades',
      payload: {
        exerciseId: 'builtin-bench-press',
        date: '2026-11-09',
        fromWeightKg: 62.5,
        toWeightKg: 65,
      },
    });
    expect(second.statusCode).toBe(201);
    expect((await currentBenchWeight()).currentWeightKg).toBe(65);

    const third = await app.inject({
      method: 'POST',
      url: '/api/fitness/upgrades',
      payload: {
        exerciseId: 'builtin-bench-press',
        date: '2026-11-09',
        toWeightKg: 67.5,
      },
    });
    expect(third.json().fromWeightKg).toBe(65);
    expect((await currentBenchWeight()).currentWeightKg).toBe(67.5);

    await app.inject({
      method: 'DELETE',
      url: `/api/fitness/upgrades/${third.json().id}`,
    });
    expect((await currentBenchWeight()).currentWeightKg).toBe(65);

    await app.inject({
      method: 'DELETE',
      url: `/api/fitness/upgrades/${second.json().id}`,
    });
    expect((await currentBenchWeight()).currentWeightKg).toBe(62.5);

    await app.inject({
      method: 'DELETE',
      url: `/api/fitness/upgrades/${first.json().id}`,
    });
    const fallback = await currentBenchWeight();
    expect(fallback.currentWeightKg).toBe(60);
    expect(fallback.latestUpgrade).toBeNull();
  });

  it('rejects bodyweight upgrades and future dates', async () => {
    const bodyweight = await app.inject({
      method: 'POST',
      url: '/api/fitness/upgrades',
      payload: {
        exerciseId: 'builtin-pushup',
        date: '2026-11-09',
        fromWeightKg: 0,
        toWeightKg: 5,
      },
    });
    expect(bodyweight.statusCode).toBe(400);

    const future = await app.inject({
      method: 'POST',
      url: '/api/fitness/upgrades',
      payload: {
        exerciseId: 'builtin-bench-press',
        date: '2999-01-01',
        fromWeightKg: 60,
        toWeightKg: 62.5,
      },
    });
    expect(future.statusCode).toBe(400);
    expect(future.json().error.code).toBe('FUTURE_DATE');
  });

  it('lists, patches and deletes upgrades', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/fitness/upgrades',
      payload: {
        exerciseId: 'builtin-bench-press',
        date: '2026-11-09',
        fromWeightKg: 60,
        toWeightKg: 65,
        note: '第一次升级',
      },
    });

    const list = await app.inject({
      method: 'GET',
      url: '/api/fitness/upgrades?exerciseId=builtin-bench-press',
    });
    expect(list.json()).toHaveLength(1);

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/fitness/upgrades/${created.json().id}`,
      payload: { toWeightKg: 66, note: '改过' },
    });
    expect(patched.json().toWeightKg).toBe(66);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/fitness/upgrades/${created.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);
  });
});
