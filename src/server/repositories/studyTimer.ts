import type { DatabaseSync } from 'node:sqlite';
import { toLocalDate } from '@shared/dates';
import type { StudySession, StudyTimer } from '@shared/types';
import { createSession } from './studySessions';

interface TimerRow {
  id: number;
  status: StudyTimer['status'];
  subject_id: string | null;
  material_id: string | null;
  arrangement_id: string | null;
  started_at: string | null;
  accumulated_seconds: number;
  start_date: string | null;
  original_started_at: string | null;
}

const IDLE_ROW: TimerRow = {
  id: 1,
  status: 'idle',
  subject_id: null,
  material_id: null,
  arrangement_id: null,
  started_at: null,
  accumulated_seconds: 0,
  start_date: null,
  original_started_at: null,
};

function getRow(db: DatabaseSync): TimerRow {
  const row = db
    .prepare('SELECT * FROM study_timer WHERE id = 1')
    .get() as unknown as TimerRow | undefined;
  return row ?? IDLE_ROW;
}

function toTimer(row: TimerRow): StudyTimer {
  return {
    status: row.status,
    subjectId: row.subject_id,
    materialId: row.material_id,
    arrangementId: row.arrangement_id,
    startedAt: row.started_at,
    accumulatedSeconds: row.accumulated_seconds,
  };
}

export function getTimer(db: DatabaseSync): StudyTimer {
  return toTimer(getRow(db));
}

export function startTimer(
  db: DatabaseSync,
  input: {
    subjectId: string;
    materialId?: string | null;
    arrangementId?: string | null;
  },
): StudyTimer | null {
  const current = getRow(db);
  if (current.status !== 'idle') return null;

  const now = new Date();
  const iso = now.toISOString();

  db.prepare(
    'UPDATE study_timer SET status = ?, subject_id = ?, material_id = ?, arrangement_id = ?, started_at = ?, original_started_at = ?, start_date = ?, accumulated_seconds = 0 WHERE id = 1',
  ).run(
    'running',
    input.subjectId,
    input.materialId ?? null,
    input.arrangementId ?? null,
    iso,
    iso,
    toLocalDate(now),
  );

  return getTimer(db);
}

export function pauseTimer(db: DatabaseSync): StudyTimer | null {
  const current = getRow(db);
  if (current.status !== 'running') return null;

  const now = Date.now();
  const startedAt = current.started_at
    ? new Date(current.started_at).getTime()
    : now;
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));

  db.prepare(
    'UPDATE study_timer SET status = ?, accumulated_seconds = ? WHERE id = 1',
  ).run('paused', current.accumulated_seconds + elapsed);

  return getTimer(db);
}

export function resumeTimer(db: DatabaseSync): StudyTimer | null {
  const current = getRow(db);
  if (current.status !== 'paused') return null;

  db.prepare(
    'UPDATE study_timer SET status = ?, started_at = ? WHERE id = 1',
  ).run('running', new Date().toISOString());

  return getTimer(db);
}

export function stopTimer(db: DatabaseSync, note = ''): StudySession | null {
  const current = getRow(db);
  if (current.status === 'idle') return null;

  const now = new Date();
  const nowIso = now.toISOString();
  const elapsed =
    current.status === 'running' && current.started_at
      ? Math.max(
          0,
          Math.floor((now.getTime() - new Date(current.started_at).getTime()) / 1000),
        )
      : 0;
  const totalSeconds = current.accumulated_seconds + elapsed;
  const startAt = current.original_started_at ?? current.started_at ?? nowIso;
  const date = current.start_date ?? toLocalDate(new Date(startAt));
  const subjectId = current.subject_id;
  const materialId = current.material_id;
  const arrangementId = current.arrangement_id;

  db.prepare(
    'UPDATE study_timer SET status = ?, subject_id = NULL, material_id = NULL, arrangement_id = NULL, started_at = NULL, original_started_at = NULL, start_date = NULL, accumulated_seconds = 0 WHERE id = 1',
  ).run('idle');

  if (!subjectId || totalSeconds < 60) return null;

  const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));

  return createSession(db, {
    subjectId,
    materialId,
    arrangementId,
    date,
    startAt,
    endAt: nowIso,
    durationMinutes,
    note,
  });
}
