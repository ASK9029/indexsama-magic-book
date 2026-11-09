import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-settings-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('settings api', () => {
  it('returns defaults and persists theme', async () => {
    const initial = await app.inject({ method: 'GET', url: '/api/settings' });
    expect(initial.statusCode).toBe(200);
    expect(initial.json().theme).toBe('light');
    expect(initial.json().weekStart).toBe(1);

    const patched = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: { theme: 'dark' },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().theme).toBe('dark');

    const again = await app.inject({ method: 'GET', url: '/api/settings' });
    expect(again.json().theme).toBe('dark');
  });

  it('rejects an invalid theme', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: { theme: 'neon' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('VALIDATION_ERROR');
  });
});
