import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export interface DbManager {
  get(): DatabaseSync;
  close(): void;
  reopen(): void;
  path: string;
}

function openDb(dbPath: string): DatabaseSync {
  mkdirSync(path.dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA busy_timeout = 5000;');
  return db;
}

export function createDbManager(dbPath: string): DbManager {
  let db = openDb(dbPath);

  return {
    get: () => db,
    close: () => {
      db.close();
    },
    reopen: () => {
      db = openDb(dbPath);
    },
    path: dbPath,
  };
}
