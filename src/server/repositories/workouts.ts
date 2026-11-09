import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { parseLocalDate } from '@shared/dates';
import type { PlanExercise, WorkoutSession, WorkoutSet } from '@shared/types';
import { getExercise } from './exercises';
import { getPlanDay } from './fitnessPlan';

interface SessionRow {
  id: string;
  date: string;
  name: string;
  status: WorkoutSession['status'];
  start_at: string;
  end_at: string | null;
  duration_minutes: number | null;
  note: string;
}

interface SetRow {
  id: string;
  session_id: string;
  exercise_id: string | null;
  exercise_name: string;
  set_no: number;
  weight_kg: number | null;
  reps: number;
  done: number;
}

export interface WorkoutStartInput {
  date: string;
  name?: string;
  exercises?: Array<{
    exerciseId: string;
    targetSets: number;
    targetReps: string;
    sortOrder?: number;
  }>;
}

export interface SetInput {
  exerciseId?: string | null;
  exerciseName: string;
  weightKg?: number | null;
  reps: number;
  done?: boolean;
}

const SESSION_SELECT =
  'SELECT id, date, name, status, start_at, end_at, duration_minutes, note FROM workout_sessions';
const SET_SELECT =
  'SELECT id, session_id, exercise_id, exercise_name, set_no, weight_kg, reps, done FROM workout_sets';

function toSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    sessionId: row.session_id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    setNo: row.set_no,
    weightKg: row.weight_kg,
    reps: row.reps,
    done: row.done === 1,
  };
}

function listSets(db: DatabaseSync, sessionId: string): WorkoutSet[] {
  const rows = db
    .prepare(`${SET_SELECT} WHERE session_id = ? ORDER BY set_no ASC`)
    .all(sessionId) as unknown as SetRow[];
  return rows.map(toSet);
}

function toSession(row: SessionRow, sets: WorkoutSet[]): WorkoutSession {
  return {
    id: row.id,
    date: row.date,
    name: row.name,
    status: row.status,
    startAt: row.start_at,
    endAt: row.end_at,
    durationMinutes: row.duration_minutes,
    note: row.note,
    sets,
  };
}

export function getSession(
  db: DatabaseSync,
  id: string,
): WorkoutSession | null {
  const row = db.prepare(`${SESSION_SELECT} WHERE id = ?`).get(id) as unknown as
    | SessionRow
    | undefined;
  return row ? toSession(row, listSets(db, id)) : null;
}

export function getSet(db: DatabaseSync, id: string): WorkoutSet | null {
  const row = db.prepare(`${SET_SELECT} WHERE id = ?`).get(id) as unknown as
    | SetRow
    | undefined;
  return row ? toSet(row) : null;
}

export function getSessionForDate(
  db: DatabaseSync,
  date: string,
): WorkoutSession | null {
  const row = db
    .prepare(
      'SELECT id FROM workout_sessions WHERE date = ? ORDER BY start_at DESC LIMIT 1',
    )
    .get(date) as unknown as { id: string } | undefined;
  return row ? getSession(db, row.id) : null;
}

function weekdayFor(date: string): number {
  const day = parseLocalDate(date).getDay();
  return day === 0 ? 7 : day;
}

function parseReps(value: string): number {
  const match = /(\d+)/.exec(value);
  return match ? Number(match[1]) : 8;
}

export function createSession(
  db: DatabaseSync,
  input: WorkoutStartInput,
): WorkoutSession {
  const existing = db
    .prepare(
      "SELECT id FROM workout_sessions WHERE date = ? AND status = 'draft' ORDER BY start_at DESC LIMIT 1",
    )
    .get(input.date) as unknown as { id: string } | undefined;
  if (existing) return getSession(db, existing.id)!;

  const planDay = getPlanDay(db, weekdayFor(input.date));
  const exercises: Array<{
    exerciseId: string;
    targetSets: number;
    targetReps: string;
  }> = input.exercises ?? planDay.exercises;

  const id = randomUUID();
  const now = new Date().toISOString();
  const name = input.name ?? planDay.name ?? '';

  db.exec('BEGIN');
  try {
    db.prepare(
      'INSERT INTO workout_sessions(id, date, name, status, start_at, end_at, duration_minutes, note) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)',
    ).run(id, input.date, name, 'draft', now, '');

    const insertSet = db.prepare(
      'INSERT INTO workout_sets(id, session_id, exercise_id, exercise_name, set_no, weight_kg, reps, done) VALUES (?, ?, ?, ?, ?, NULL, ?, 0)',
    );

    for (const exercise of exercises) {
      const library = getExercise(db, exercise.exerciseId);
      const exerciseName = library?.name ?? exercise.exerciseId;
      const reps = parseReps(exercise.targetReps);
      for (let setNo = 1; setNo <= exercise.targetSets; setNo += 1) {
        insertSet.run(
          randomUUID(),
          id,
          exercise.exerciseId,
          exerciseName,
          setNo,
          reps,
        );
      }
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return getSession(db, id)!;
}

export function updateSession(
  db: DatabaseSync,
  id: string,
  patch: {
    name?: string;
    note?: string;
    durationMinutes?: number;
    status?: WorkoutSession['status'];
  },
): WorkoutSession | null {
  const current = getSession(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE workout_sessions SET name = ?, note = ?, duration_minutes = ?, status = ? WHERE id = ?',
  ).run(
    patch.name ?? current.name,
    patch.note ?? current.note,
    patch.durationMinutes ?? current.durationMinutes,
    patch.status ?? current.status,
    id,
  );

  return getSession(db, id);
}

export function finishSession(
  db: DatabaseSync,
  id: string,
  input: { durationMinutes: number; note?: string },
): WorkoutSession | null {
  const current = getSession(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE workout_sessions SET status = ?, end_at = ?, duration_minutes = ?, note = ? WHERE id = ?',
  ).run(
    'completed',
    new Date().toISOString(),
    input.durationMinutes,
    input.note ?? current.note,
    id,
  );

  return getSession(db, id);
}

export function addSet(
  db: DatabaseSync,
  sessionId: string,
  input: SetInput,
): WorkoutSet | null {
  const session = getSession(db, sessionId);
  if (!session) return null;

  const sameExercise = listSets(db, sessionId).filter((set) =>
    input.exerciseId
      ? set.exerciseId === input.exerciseId
      : set.exerciseName === input.exerciseName,
  );
  const maxNo = sameExercise.reduce(
    (max, set) => Math.max(max, set.setNo),
    0,
  );

  const id = randomUUID();
  db.prepare(
    'INSERT INTO workout_sets(id, session_id, exercise_id, exercise_name, set_no, weight_kg, reps, done) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    sessionId,
    input.exerciseId ?? null,
    input.exerciseName,
    maxNo + 1,
    input.weightKg ?? null,
    input.reps,
    input.done ? 1 : 0,
  );

  return getSet(db, id);
}

export function updateSet(
  db: DatabaseSync,
  id: string,
  patch: { weightKg?: number | null; reps?: number; done?: boolean },
): WorkoutSet | null {
  const current = getSet(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE workout_sets SET weight_kg = ?, reps = ?, done = ? WHERE id = ?',
  ).run(
    patch.weightKg === undefined ? current.weightKg : patch.weightKg,
    patch.reps ?? current.reps,
    (patch.done ?? current.done) ? 1 : 0,
    id,
  );

  return getSet(db, id);
}

export function deleteSet(db: DatabaseSync, id: string): boolean {
  const current = getSet(db, id);
  if (!current) return false;

  db.exec('BEGIN');
  try {
    db.prepare('DELETE FROM workout_sets WHERE id = ?').run(id);
    const rows = db
      .prepare(
        'SELECT id FROM workout_sets WHERE session_id = ? AND exercise_name = ? ORDER BY set_no ASC',
      )
      .all(current.sessionId, current.exerciseName) as unknown as {
      id: string;
    }[];
    const update = db.prepare('UPDATE workout_sets SET set_no = ? WHERE id = ?');
    rows.forEach((row, index) => update.run(index + 1, row.id));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return true;
}

export function listCompletedSessions(
  db: DatabaseSync,
  from?: string,
  to?: string,
): WorkoutSession[] {
  const clauses = ["status = 'completed'"];
  const params: string[] = [];
  if (from) {
    clauses.push('date >= ?');
    params.push(from);
  }
  if (to) {
    clauses.push('date <= ?');
    params.push(to);
  }

  const rows = db
    .prepare(
      `${SESSION_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY date DESC, start_at DESC`,
    )
    .all(...params) as unknown as SessionRow[];

  return rows.map((row) => toSession(row, listSets(db, row.id)));
}

export function deleteSession(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM workout_sessions WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}
