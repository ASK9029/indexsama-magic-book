import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-data-info-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });

  const subject = await app.inject({
    method: 'POST',
    url: '/api/subjects',
    payload: { name: '数学', color: '#2F6B5E' },
  });

  await app.inject({
    method: 'POST',
    url: '/api/materials/link',
    payload: {
      title: '线代讲义',
      url: 'example.com',
      subjectId: subject.json().id,
    },
  });

  await app.inject({
    method: 'POST',
    url: '/api/games',
    payload: { title: 'Hades', platform: 'PC' },
  });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('data info and preferences', () => {
  it('reports counts, storage and version', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/data/info',
    });
    expect(response.statusCode).toBe(200);
    const info = response.json();

    expect(info.dataDir).toBe(dir);
    expect(info.counts.subjects).toBe(1);
    expect(info.counts.materials).toBe(1);
    expect(info.counts.games).toBe(1);
    expect(info.counts.tasks).toBe(0);
    expect(info.counts.memos).toBe(0);
    expect(info.counts.meals).toBe(0);
    expect(info.storage.dbBytes).toBeGreaterThan(0);
    expect(info.storage.totalBytes).toBeGreaterThanOrEqual(
      info.storage.dbBytes,
    );
    expect(info.lastBackupAt).toBeNull();
    expect(info.version).toBe('1.0.0');
  });

  it('persists week start, weight unit and targets', async () => {
    const patched = await app.inject({
      method: 'PATCH',
      url: '/api/settings',
      payload: {
        weekStart: 0,
        weightUnit: 'jin',
        calorieTarget: 1800,
        proteinTarget: 112,
        waterTarget: 2000,
      },
    });
    expect(patched.statusCode).toBe(200);

    const settings = await app.inject({
      method: 'GET',
      url: '/api/settings',
    });
    const data = settings.json();
    expect(data.weekStart).toBe(0);
    expect(data.weightUnit).toBe('jin');
    expect(data.calorieTarget).toBe(1800);
    expect(data.proteinTarget).toBe(112);
    expect(data.waterTarget).toBe(2000);
  });
});
