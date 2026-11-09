import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Subject } from '@shared/types';

interface SubjectRow {
  id: string;
  name: string;
  color: string;
  goal: string;
  weekly_target_minutes: number;
  archived: number;
  created_at: string;
}

export interface SubjectInput {
  name: string;
  color: string;
  goal?: string;
  weeklyTargetMinutes?: number;
}

const SELECT =
  'SELECT id, name, color, goal, weekly_target_minutes, archived, created_at FROM subjects';

function toSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    goal: row.goal,
    weeklyTargetMinutes: row.weekly_target_minutes,
    archived: row.archived === 1,
    createdAt: row.created_at,
  };
}

export function listSubjects(db: DatabaseSync, archived = false): Subject[] {
  const rows = db
    .prepare(`${SELECT} WHERE archived = ? ORDER BY created_at ASC`)
    .all(archived ? 1 : 0) as unknown as SubjectRow[];
  return rows.map(toSubject);
}

export function getSubject(db: DatabaseSync, id: string): Subject | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | SubjectRow
    | undefined;
  return row ? toSubject(row) : null;
}

export function createSubject(db: DatabaseSync, input: SubjectInput): Subject {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO subjects(id, name, color, goal, weekly_target_minutes, archived, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
  ).run(
    id,
    input.name,
    input.color,
    input.goal ?? '',
    input.weeklyTargetMinutes ?? 0,
    now,
  );

  return getSubject(db, id)!;
}

export function updateSubject(
  db: DatabaseSync,
  id: string,
  patch: Partial<SubjectInput>,
): Subject | null {
  const current = getSubject(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE subjects SET name = ?, color = ?, goal = ?, weekly_target_minutes = ? WHERE id = ?',
  ).run(
    patch.name ?? current.name,
    patch.color ?? current.color,
    patch.goal ?? current.goal,
    patch.weeklyTargetMinutes ?? current.weeklyTargetMinutes,
    id,
  );

  return getSubject(db, id);
}

export function setSubjectArchived(
  db: DatabaseSync,
  id: string,
  archived: boolean,
): Subject | null {
  const current = getSubject(db, id);
  if (!current) return null;

  db.prepare('UPDATE subjects SET archived = ? WHERE id = ?').run(
    archived ? 1 : 0,
    id,
  );

  return getSubject(db, id);
}
