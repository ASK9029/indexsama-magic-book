import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { Exercise } from '@shared/types';

interface ExerciseRow {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string;
  type: string;
  notes: string;
  built_in: number;
}

export interface ExerciseInput {
  name: string;
  muscleGroup: string;
  equipment: string;
  type: 'weight' | 'bodyweight';
  notes?: string;
}

export interface ExerciseFilters {
  q?: string;
  muscleGroup?: string;
  equipment?: string;
  type?: string;
}

const SELECT =
  'SELECT id, name, muscle_group, equipment, type, notes, built_in FROM exercises';

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    type: row.type as Exercise['type'],
    notes: row.notes,
    builtIn: row.built_in === 1,
  };
}

export function listExercises(
  db: DatabaseSync,
  filters: ExerciseFilters = {},
): Exercise[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.q) {
    clauses.push('(name LIKE ? OR notes LIKE ?)');
    const like = `%${filters.q}%`;
    params.push(like, like);
  }
  if (filters.muscleGroup) {
    clauses.push('muscle_group = ?');
    params.push(filters.muscleGroup);
  }
  if (filters.equipment) {
    clauses.push('equipment = ?');
    params.push(filters.equipment);
  }
  if (filters.type) {
    clauses.push('type = ?');
    params.push(filters.type);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db
    .prepare(`${SELECT} ${where} ORDER BY built_in DESC, name ASC`)
    .all(...params) as unknown as ExerciseRow[];

  return rows.map(toExercise);
}

export function getExercise(
  db: DatabaseSync,
  id: string,
): Exercise | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | ExerciseRow
    | undefined;
  return row ? toExercise(row) : null;
}

export function createExercise(
  db: DatabaseSync,
  input: ExerciseInput,
): Exercise {
  const id = randomUUID();

  db.prepare(
    'INSERT INTO exercises(id, name, muscle_group, equipment, type, notes, built_in) VALUES (?, ?, ?, ?, ?, ?, 0)',
  ).run(
    id,
    input.name,
    input.muscleGroup,
    input.equipment,
    input.type,
    input.notes ?? '',
  );

  return getExercise(db, id)!;
}

export function updateExercise(
  db: DatabaseSync,
  id: string,
  patch: Partial<ExerciseInput>,
): Exercise | null {
  const current = getExercise(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE exercises SET name = ?, muscle_group = ?, equipment = ?, type = ?, notes = ? WHERE id = ?',
  ).run(
    patch.name ?? current.name,
    patch.muscleGroup ?? current.muscleGroup,
    patch.equipment ?? current.equipment,
    patch.type ?? current.type,
    patch.notes ?? current.notes,
    id,
  );

  return getExercise(db, id);
}

export function deleteExercise(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM exercises WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}
