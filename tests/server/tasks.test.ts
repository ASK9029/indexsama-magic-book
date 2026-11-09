import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-tasks-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('tasks api', () => {
  it('creates, filters, completes, carries over and deletes', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: {
        date: '2026-11-09',
        title: '写周报',
        category: 'work',
        priority: 'high',
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().done).toBe(false);

    const other = await app.inject({
      method: 'POST',
      url: '/api/tasks',
      payload: {
        date: '2026-11-10',
        title: '买菜',
        category: 'life',
        priority: 'low',
      },
    });
    expect(other.statusCode).toBe(201);

    const dayA = await app.inject({
      method: 'GET',
      url: '/api/tasks?date=2026-11-09',
    });
    expect(dayA.json()).toHaveLength(1);
    expect(dayA.json()[0].title).toBe('写周报');

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/tasks/${created.json().id}`,
      payload: { done: true },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().done).toBe(true);

    const carried = await app.inject({
      method: 'POST',
      url: `/api/tasks/${created.json().id}/carry-over`,
      payload: { targetDate: '2026-11-10' },
    });
    expect(carried.statusCode).toBe(200);
    expect(carried.json().date).toBe('2026-11-10');

    const emptyDayA = await app.inject({
      method: 'GET',
      url: '/api/tasks?date=2026-11-09',
    });
    expect(emptyDayA.json()).toHaveLength(0);

    const dayB = await app.inject({
      method: 'GET',
      url: '/api/tasks?date=2026-11-10',
    });
    expect(dayB.json()).toHaveLength(2);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/tasks/${other.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const remaining = await app.inject({
      method: 'GET',
      url: '/api/tasks?date=2026-11-10',
    });
    expect(remaining.json()).toHaveLength(1);
  });

  it('rejects an invalid date query', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/tasks?date=11-09-2026',
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});
