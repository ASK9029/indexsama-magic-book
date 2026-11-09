import { describe, it, expect } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createDbManager } from '../../src/server/db/connection';
import { migrate } from '../../src/server/db/migrate';
import { getSetting, setSetting } from '../../src/server/repositories/settings';

describe('database', () => {
  it('migrates idempotently and persists settings', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'life-db-'));
    const mgr = createDbManager(join(dir, 'app.db'));

    try {
      migrate(mgr.get());
      migrate(mgr.get());

      expect(getSetting(mgr.get(), 'theme', 'light')).toBe('light');

      setSetting(mgr.get(), 'theme', 'dark');
      expect(getSetting(mgr.get(), 'theme', 'light')).toBe('dark');

      const journal = mgr.get().prepare('PRAGMA journal_mode').get() as {
        journal_mode: string;
      };
      expect(journal.journal_mode).toBe('wal');

      const fk = mgr.get().prepare('PRAGMA foreign_keys').get() as {
        foreign_keys: number;
      };
      expect(fk.foreign_keys).toBe(1);
    } finally {
      mgr.close();
      await rm(dir, { recursive: true, force: true });
    }
  });
});
