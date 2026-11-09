import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-fitness-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('fitness plan and exercise library', () => {
  it('returns seven rest days and saves a weekly plan day', async () => {
    const initial = await app.inject({ method: 'GET', url: '/api/fitness/plan' });
    expect(initial.statusCode).toBe(200);
    expect(initial.json()).toHaveLength(7);
    expect(initial.json().every((day: { isRest: boolean }) => day.isRest)).toBe(
      true,
    );

    const saved = await app.inject({
      method: 'PUT',
      url: '/api/fitness/plan/1',
      payload: {
        name: '推日',
        isRest: false,
        exercises: [
          {
            exerciseId: 'builtin-bench-press',
            targetSets: 3,
            targetReps: '8-12',
            sortOrder: 0,
          },
          {
            exerciseId: 'builtin-overhead-press',
            targetSets: 3,
            targetReps: '8-10',
            sortOrder: 1,
          },
        ],
      },
    });
    expect(saved.statusCode).toBe(200);
    expect(saved.json().name).toBe('推日');
    expect(saved.json().exercises).toHaveLength(2);

    const plan = await app.inject({ method: 'GET', url: '/api/fitness/plan' });
    const monday = plan.json()[0];
    expect(monday.name).toBe('推日');
    expect(monday.isRest).toBe(false);
    expect(monday.exercises.map((item: { exerciseId: string }) => item.exerciseId)).toEqual([
      'builtin-bench-press',
      'builtin-overhead-press',
    ]);
  });

  it('seeds built-in exercises and protects them from edits', async () => {
    const exercises = await app.inject({
      method: 'GET',
      url: '/api/fitness/exercises',
    });
    expect(exercises.json().length).toBeGreaterThanOrEqual(15);

    const search = await app.inject({
      method: 'GET',
      url: '/api/fitness/exercises?q=卧推',
    });
    expect(search.json().length).toBeGreaterThanOrEqual(1);

    const legs = await app.inject({
      method: 'GET',
      url: '/api/fitness/exercises?muscleGroup=腿',
    });
    expect(legs.json().length).toBeGreaterThanOrEqual(3);

    const builtIn = await app.inject({
      method: 'PATCH',
      url: '/api/fitness/exercises/builtin-bench-press',
      payload: { name: '改名' },
    });
    expect(builtIn.statusCode).toBe(403);
    expect(builtIn.json().error.code).toBe('BUILT_IN_EXERCISE');

    const custom = await app.inject({
      method: 'POST',
      url: '/api/fitness/exercises',
      payload: {
        name: '测试动作',
        muscleGroup: '胸',
        equipment: '哑铃',
        type: 'weight',
      },
    });
    expect(custom.statusCode).toBe(201);
    expect(custom.json().builtIn).toBe(false);

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/fitness/exercises/${custom.json().id}`,
      payload: { name: '测试动作 2' },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().name).toBe('测试动作 2');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/fitness/exercises/${custom.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);
  });
});
