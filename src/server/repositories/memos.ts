import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Memo } from '@shared/types';

interface MemoRow {
  id: string;
  text: string;
  pinned: number;
  created_at: string;
  updated_at: string;
}

function toMemo(row: MemoRow): Memo {
  return {
    id: row.id,
    text: row.text,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listMemos(db: DatabaseSync): Memo[] {
  const rows = db
    .prepare(
      'SELECT id, text, pinned, created_at, updated_at FROM memos ORDER BY pinned DESC, updated_at DESC',
    )
    .all() as unknown as MemoRow[];

  return rows.map(toMemo);
}

export function getMemo(db: DatabaseSync, id: string): Memo | null {
  const row = db
    .prepare('SELECT id, text, pinned, created_at, updated_at FROM memos WHERE id = ?')
    .get(id) as unknown as MemoRow | undefined;

  return row ? toMemo(row) : null;
}

export function createMemo(
  db: DatabaseSync,
  input: { text: string; pinned?: boolean },
): Memo {
  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(
    'INSERT INTO memos(id, text, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, input.text, input.pinned ? 1 : 0, now, now);

  return getMemo(db, id)!;
}

export function updateMemo(
  db: DatabaseSync,
  id: string,
  input: { text?: string; pinned?: boolean },
): Memo | null {
  const current = getMemo(db, id);
  if (!current) return null;

  const text = input.text ?? current.text;
  const pinned = input.pinned ?? current.pinned;

  db.prepare('UPDATE memos SET text = ?, pinned = ?, updated_at = ? WHERE id = ?').run(
    text,
    pinned ? 1 : 0,
    new Date().toISOString(),
    id,
  );

  return getMemo(db, id);
}

export function deleteMemo(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM memos WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}
