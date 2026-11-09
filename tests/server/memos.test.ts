import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-memos-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('memos api', () => {
  it('creates, lists, pins and deletes', async () => {
    const first = await app.inject({
      method: 'POST',
      url: '/api/memos',
      payload: { text: '第一条' },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/api/memos',
      payload: { text: '第二条' },
    });
    expect(second.statusCode).toBe(201);

    const list = await app.inject({ method: 'GET', url: '/api/memos' });
    expect(list.json()).toHaveLength(2);

    const pinned = await app.inject({
      method: 'PATCH',
      url: `/api/memos/${first.json().id}`,
      payload: { pinned: true },
    });
    expect(pinned.statusCode).toBe(200);
    expect(pinned.json().pinned).toBe(true);

    const sorted = await app.inject({ method: 'GET', url: '/api/memos' });
    expect(sorted.json()[0].id).toBe(first.json().id);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/memos/${second.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const remaining = await app.inject({ method: 'GET', url: '/api/memos' });
    expect(remaining.json()).toHaveLength(1);
  });

  it('rejects an empty memo', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/memos',
      payload: { text: '   ' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});
