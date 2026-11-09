import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-workouts-'));
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
          targetReps: '8-12',
          sortOrder: 0,
        },
        {
          exerciseId: 'builtin-pushup',
          targetSets: 1,
          targetReps: '10-15',
          sortOrder: 1,
        },
      ],
    },
  });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('workout sessions', () => {
  it('creates a draft, edits sets, finishes and reports volume', async () => {
    const started = await app.inject({
      method: 'POST',
      url: '/api/fitness/sessions',
      payload: { date: '2026-11-09' },
    });
    expect(started.statusCode).toBe(201);
    expect(started.json().status).toBe('draft');
    expect(started.json().name).toBe('推日');
    expect(started.json().sets).toHaveLength(3);
    expect(started.json().sets[0].exerciseName).toBe('杠铃卧推');
    const pushupSet = started
      .json()
      .sets.find((set: { exerciseName: string }) => set.exerciseName === '俯卧撑');
    expect(pushupSet.reps).toBe(10);

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/fitness/sessions',
      payload: { date: '2026-11-09' },
    });
    expect(duplicate.json().id).toBe(started.json().id);

    const benchSet = started.json().sets[0];
    const updated = await app.inject({
      method: 'PATCH',
      url: `/api/fitness/sets/${benchSet.id}`,
      payload: { weightKg: 60, reps: 10, done: true },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().done).toBe(true);

    const pushupUpdated = await app.inject({
      method: 'PATCH',
      url: `/api/fitness/sets/${pushupSet.id}`,
      payload: { reps: 15, done: true },
    });
    expect(pushupUpdated.json().weightKg).toBeNull();

    const finished = await app.inject({
      method: 'POST',
      url: `/api/fitness/sessions/${started.json().id}/finish`,
      payload: { durationMinutes: 60, note: '练完' },
    });
    expect(finished.statusCode).toBe(200);
    expect(finished.json().status).toBe('completed');
    expect(finished.json().durationMinutes).toBe(60);
    expect(finished.json().endAt).toBeTruthy();

    const volume = finished
      .json()
      .sets.filter((set: { weightKg: number | null }) => set.weightKg !== null)
      .reduce(
        (sum: number, set: { weightKg: number; reps: number }) =>
          sum + set.weightKg * set.reps,
        0,
      );
    expect(volume).toBe(600);

    const today = await app.inject({
      method: 'GET',
      url: '/api/fitness/today?date=2026-11-09',
    });
    expect(today.json().plan.name).toBe('推日');
    expect(today.json().session.status).toBe('completed');

    const history = await app.inject({
      method: 'GET',
      url: '/api/fitness/sessions?from=2026-11-01&to=2026-11-30',
    });
    expect(history.json()).toHaveLength(1);
  });

  it('supports rest-day temporary sessions and empty confirmation', async () => {
    const started = await app.inject({
      method: 'POST',
      url: '/api/fitness/sessions',
      payload: { date: '2026-11-10', name: '临时训练' },
    });
    expect(started.statusCode).toBe(201);
    expect(started.json().sets).toHaveLength(0);

    const withoutConfirm = await app.inject({
      method: 'POST',
      url: `/api/fitness/sessions/${started.json().id}/finish`,
      payload: { durationMinutes: 20 },
    });
    expect(withoutConfirm.statusCode).toBe(400);
    expect(withoutConfirm.json().error.code).toBe('EMPTY_SESSION');

    const confirmed = await app.inject({
      method: 'POST',
      url: `/api/fitness/sessions/${started.json().id}/finish`,
      payload: { durationMinutes: 20, confirmEmpty: true },
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json().status).toBe('completed');

    const plan = await app.inject({ method: 'GET', url: '/api/fitness/plan' });
    expect(plan.json()[1].isRest).toBe(true);
  });

  it('adds and deletes sets and keeps numbering', async () => {
    const started = await app.inject({
      method: 'POST',
      url: '/api/fitness/sessions',
      payload: { date: '2026-11-11', name: '临时训练' },
    });
    const sessionId = started.json().id;

    const added = await app.inject({
      method: 'POST',
      url: `/api/fitness/sessions/${sessionId}/sets`,
      payload: { exerciseName: '测试动作', reps: 8, weightKg: 20 },
    });
    expect(added.statusCode).toBe(201);
    expect(added.json().setNo).toBe(1);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/fitness/sets/${added.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const session = await app.inject({
      method: 'GET',
      url: `/api/fitness/sessions/${sessionId}`,
    });
    expect(session.json().sets).toHaveLength(0);
  });
});
