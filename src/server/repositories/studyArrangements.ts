import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { StudyArrangement } from '@shared/types';

interface ArrangementRow {
  id: string;
  subject_id: string;
  date: string;
  content: string;
  planned_minutes: number;
  done: number;
  created_at: string;
}

export interface ArrangementInput {
  subjectId: string;
  date: string;
  content: string;
  plannedMinutes: number;
}

const SELECT =
  'SELECT id, subject_id, date, content, planned_minutes, done, created_at FROM study_arrangements';

function toArrangement(row: ArrangementRow): StudyArrangement {
  return {
    id: row.id,
    subjectId: row.subject_id,
    date: row.date,
    content: row.content,
    plannedMinutes: row.planned_minutes,
    done: row.done === 1,
    createdAt: row.created_at,
  };
}

export function listArrangements(db: DatabaseSync, date: string): StudyArrangement[] {
  const rows = db
    .prepare(`${SELECT} WHERE date = ? ORDER BY created_at ASC`)
    .all(date) as unknown as ArrangementRow[];
  return rows.map(toArrangement);
}

export function getArrangement(
  db: DatabaseSync,
  id: string,
): StudyArrangement | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | ArrangementRow
    | undefined;
  return row ? toArrangement(row) : null;
}

export function createArrangement(
  db: DatabaseSync,
  input: ArrangementInput,
): StudyArrangement {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO study_arrangements(id, subject_id, date, content, planned_minutes, done, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
  ).run(
    id,
    input.subjectId,
    input.date,
    input.content,
    input.plannedMinutes,
    now,
  );

  return getArrangement(db, id)!;
}

export function updateArrangement(
  db: DatabaseSync,
  id: string,
  patch: Partial<ArrangementInput> & { done?: boolean },
): StudyArrangement | null {
  const current = getArrangement(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE study_arrangements SET subject_id = ?, date = ?, content = ?, planned_minutes = ?, done = ? WHERE id = ?',
  ).run(
    patch.subjectId ?? current.subjectId,
    patch.date ?? current.date,
    patch.content ?? current.content,
    patch.plannedMinutes ?? current.plannedMinutes,
    (patch.done ?? current.done) ? 1 : 0,
    id,
  );

  return getArrangement(db, id);
}

export function deleteArrangement(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM study_arrangements WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}
