import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import type { DataInfo } from '@shared/types';
import { getSetting } from '../repositories/settings';

const VERSION = '1.0.0';

async function directorySize(dir: string): Promise<number> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return 0;
  }

  let total = 0;
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await directorySize(full);
    } else if (entry.isFile()) {
      try {
        total += (await stat(full)).size;
      } catch {
        // Files can disappear between listing and stat; ignore them.
      }
    }
  }
  return total;
}

function count(db: DatabaseSync, table: string): number {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
    .get() as unknown as { count: number };
  return row.count;
}

export function getCounts(db: DatabaseSync): DataInfo['counts'] {
  return {
    tasks: count(db, 'tasks'),
    memos: count(db, 'memos'),
    subjects: count(db, 'subjects'),
    materials: count(db, 'materials'),
    checkins: count(db, 'checkin_photos'),
    sessions: count(db, 'study_sessions'),
    workouts: count(db, 'workout_sessions'),
    meals: count(db, 'meal_entries'),
    games: count(db, 'games'),
  };
}

export async function getDataInfo(
  db: DatabaseSync,
  dataDir: string,
  dbPath: string,
): Promise<DataInfo> {
  const dbStat = await stat(dbPath);
  const filesBytes = await directorySize(path.join(dataDir, 'files'));

  return {
    dataDir,
    counts: getCounts(db),
    storage: {
      dbBytes: dbStat.size,
      filesBytes,
      totalBytes: dbStat.size + filesBytes,
    },
    lastBackupAt: getSetting<string | null>(db, 'lastBackupAt', null),
    version: VERSION,
  };
}
