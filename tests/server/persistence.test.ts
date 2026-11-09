import { describe, it, expect } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildApp } from '../../src/server/app';

describe('local persistence', () => {
  it('keeps tasks and memos after an app restart', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'life-persist-'));
    const dbPath = join(dir, 'app.db');

    try {
      const first = await buildApp({ dataDir: dir, dbPath, logger: false });
      const task = await first.inject({
        method: 'POST',
        url: '/api/tasks',
        payload: {
          date: '2026-11-09',
          title: '重启后还在',
          category: 'work',
          priority: 'high',
        },
      });
      expect(task.statusCode).toBe(201);

      const memo = await first.inject({
        method: 'POST',
        url: '/api/memos',
        payload: { text: '重启后备忘' },
      });
      expect(memo.statusCode).toBe(201);
      await first.close();

      const second = await buildApp({ dataDir: dir, dbPath, logger: false });
      const tasks = await second.inject({
        method: 'GET',
        url: '/api/tasks?date=2026-11-09',
      });
      expect(tasks.json()).toHaveLength(1);
      expect(tasks.json()[0].title).toBe('重启后还在');

      const memos = await second.inject({ method: 'GET', url: '/api/memos' });
      expect(memos.json()).toHaveLength(1);
      expect(memos.json()[0].text).toBe('重启后备忘');
      await second.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
