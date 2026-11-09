import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { StudySession } from '@shared/types';

interface SessionRow {
  id: string;
  subject_id: string;
  material_id: string | null;
  arrangement_id: string | null;
  date: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  note: string;
}

export interface SessionInput {
  subjectId: string;
  materialId?: string | null;
  arrangementId?: string | null;
  date: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  note?: string;
}

export interface SessionFilters {
  subjectId?: string;
  from?: string;
  to?: string;
}

const SELECT =
  'SELECT id, subject_id, material_id, arrangement_id, date, start_at, end_at, duration_minutes, note FROM study_sessions';

function toSession(row: SessionRow): StudySession {
  return {
    id: row.id,
    subjectId: row.subject_id,
    materialId: row.material_id,
    arrangementId: row.arrangement_id,
    date: row.date,
    startAt: row.start_at,
    endAt: row.end_at,
    durationMinutes: row.duration_minutes,
    note: row.note,
  };
}

export function listSessions(
  db: DatabaseSync,
  filters: SessionFilters = {},
): StudySession[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.subjectId) {
    clauses.push('subject_id = ?');
    params.push(filters.subjectId);
  }
  if (filters.from) {
    clauses.push('date >= ?');
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push('date <= ?');
    params.push(filters.to);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`${SELECT} ${where} ORDER BY date DESC, start_at DESC`)
    .all(...params) as unknown as SessionRow[];

  return rows.map(toSession);
}

export function getSession(db: DatabaseSync, id: string): StudySession | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | SessionRow
    | undefined;
  return row ? toSession(row) : null;
}

export function createSession(db: DatabaseSync, input: SessionInput): StudySession {
  const id = randomUUID();

  db.prepare(
    'INSERT INTO study_sessions(id, subject_id, material_id, arrangement_id, date, start_at, end_at, duration_minutes, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    input.subjectId,
    input.materialId ?? null,
    input.arrangementId ?? null,
    input.date,
    input.startAt,
    input.endAt,
    input.durationMinutes,
    input.note ?? '',
  );

  return getSession(db, id)!;
}

export function updateSession(
  db: DatabaseSync,
  id: string,
  patch: Partial<SessionInput>,
): StudySession | null {
  const current = getSession(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE study_sessions SET subject_id = ?, material_id = ?, arrangement_id = ?, date = ?, start_at = ?, end_at = ?, duration_minutes = ?, note = ? WHERE id = ?',
  ).run(
    patch.subjectId ?? current.subjectId,
    patch.materialId === undefined ? current.materialId : patch.materialId,
    patch.arrangementId === undefined
      ? current.arrangementId
      : patch.arrangementId,
    patch.date ?? current.date,
    patch.startAt ?? current.startAt,
    patch.endAt ?? current.endAt,
    patch.durationMinutes ?? current.durationMinutes,
    patch.note ?? current.note,
    id,
  );

  return getSession(db, id);
}

export function deleteSession(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM study_sessions WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}
