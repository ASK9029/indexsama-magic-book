import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-subjects-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('subjects and arrangements api', () => {
  it('creates, archives, restores subjects and manages arrangements', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/subjects',
      payload: {
        name: '数学',
        color: '#2F6B5E',
        goal: '学完线代',
        weeklyTargetMinutes: 300,
      },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().archived).toBe(false);
    const subjectId = created.json().id as string;

    const active = await app.inject({ method: 'GET', url: '/api/subjects' });
    expect(active.json()).toHaveLength(1);

    const archived = await app.inject({
      method: 'POST',
      url: `/api/subjects/${subjectId}/archive`,
    });
    expect(archived.json().archived).toBe(true);

    const activeAfterArchive = await app.inject({
      method: 'GET',
      url: '/api/subjects',
    });
    expect(activeAfterArchive.json()).toHaveLength(0);

    const archivedList = await app.inject({
      method: 'GET',
      url: '/api/subjects?archived=1',
    });
    expect(archivedList.json()).toHaveLength(1);

    const restored = await app.inject({
      method: 'POST',
      url: `/api/subjects/${subjectId}/restore`,
    });
    expect(restored.json().archived).toBe(false);

    const activeAgain = await app.inject({
      method: 'GET',
      url: '/api/subjects',
    });
    expect(activeAgain.json()).toHaveLength(1);

    const arrangement = await app.inject({
      method: 'POST',
      url: '/api/study/arrangements',
      payload: {
        subjectId,
        date: '2026-11-09',
        content: '第三章',
        plannedMinutes: 45,
      },
    });
    expect(arrangement.statusCode).toBe(201);
    expect(arrangement.json().subjectId).toBe(subjectId);

    const arrangements = await app.inject({
      method: 'GET',
      url: '/api/study/arrangements?date=2026-11-09',
    });
    expect(arrangements.json()).toHaveLength(1);

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/study/arrangements/${arrangement.json().id}`,
      payload: { done: true },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().done).toBe(true);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/study/arrangements/${arrangement.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const empty = await app.inject({
      method: 'GET',
      url: '/api/study/arrangements?date=2026-11-09',
    });
    expect(empty.json()).toHaveLength(0);
  });

  it('rejects arrangement with zero minutes', async () => {
    const subject = await app.inject({
      method: 'POST',
      url: '/api/subjects',
      payload: { name: '英语', color: '#D97757' },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/study/arrangements',
      payload: {
        subjectId: subject.json().id,
        date: '2026-11-09',
        content: '背单词',
        plannedMinutes: 0,
      },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});
