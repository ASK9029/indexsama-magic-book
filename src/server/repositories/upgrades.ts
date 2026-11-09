import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { ExerciseUpgrade } from '@shared/types';

interface UpgradeRow {
  id: string;
  exercise_id: string | null;
  exercise_name: string;
  date: string;
  from_weight_kg: number;
  to_weight_kg: number;
  note: string;
  created_at: string;
}

export interface UpgradeInput {
  exerciseId: string;
  exerciseName: string;
  date: string;
  fromWeightKg: number;
  toWeightKg: number;
  note?: string;
}

export interface UpgradePatch {
  date?: string;
  fromWeightKg?: number;
  toWeightKg?: number;
  note?: string;
}

const SELECT =
  'SELECT id, exercise_id, exercise_name, date, from_weight_kg, to_weight_kg, note, created_at FROM exercise_upgrades';

function toUpgrade(row: UpgradeRow): ExerciseUpgrade {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    exerciseName: row.exercise_name,
    date: row.date,
    fromWeightKg: row.from_weight_kg,
    toWeightKg: row.to_weight_kg,
    note: row.note,
    createdAt: row.created_at,
  };
}

export function listUpgrades(
  db: DatabaseSync,
  exerciseId?: string,
): ExerciseUpgrade[] {
  const rows = exerciseId
    ? (db
        .prepare(
          `${SELECT} WHERE exercise_id = ? ORDER BY date DESC, created_at DESC`,
        )
        .all(exerciseId) as unknown as UpgradeRow[])
    : (db
        .prepare(`${SELECT} ORDER BY date DESC, created_at DESC`)
        .all() as unknown as UpgradeRow[]);

  return rows.map(toUpgrade);
}

export function getUpgrade(
  db: DatabaseSync,
  id: string,
): ExerciseUpgrade | null {
  const row = db.prepare(`${SELECT} WHERE id = ?`).get(id) as unknown as
    | UpgradeRow
    | undefined;
  return row ? toUpgrade(row) : null;
}

export function latestUpgrade(
  db: DatabaseSync,
  exerciseId: string,
): ExerciseUpgrade | null {
  const row = db
    .prepare(
      `${SELECT} WHERE exercise_id = ? ORDER BY date DESC, created_at DESC LIMIT 1`,
    )
    .get(exerciseId) as unknown as UpgradeRow | undefined;
  return row ? toUpgrade(row) : null;
}

export function maxCompletedWeight(
  db: DatabaseSync,
  exerciseId: string,
): number | null {
  const row = db
    .prepare(
      "SELECT MAX(s.weight_kg) AS max_weight FROM workout_sets s JOIN workout_sessions ws ON ws.id = s.session_id WHERE s.exercise_id = ? AND ws.status = 'completed' AND s.weight_kg IS NOT NULL",
    )
    .get(exerciseId) as unknown as { max_weight: number | null };
  return row.max_weight;
}

export function createUpgrade(
  db: DatabaseSync,
  input: UpgradeInput,
): ExerciseUpgrade {
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    'INSERT INTO exercise_upgrades(id, exercise_id, exercise_name, date, from_weight_kg, to_weight_kg, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    input.exerciseId,
    input.exerciseName,
    input.date,
    input.fromWeightKg,
    input.toWeightKg,
    input.note ?? '',
    now,
  );

  return getUpgrade(db, id)!;
}

export function updateUpgrade(
  db: DatabaseSync,
  id: string,
  patch: UpgradePatch,
): ExerciseUpgrade | null {
  const current = getUpgrade(db, id);
  if (!current) return null;

  db.prepare(
    'UPDATE exercise_upgrades SET date = ?, from_weight_kg = ?, to_weight_kg = ?, note = ? WHERE id = ?',
  ).run(
    patch.date ?? current.date,
    patch.fromWeightKg ?? current.fromWeightKg,
    patch.toWeightKg ?? current.toWeightKg,
    patch.note ?? current.note,
    id,
  );

  return getUpgrade(db, id);
}

export function deleteUpgrade(db: DatabaseSync, id: string): boolean {
  const result = db.prepare('DELETE FROM exercise_upgrades WHERE id = ?').run(id);
  return Number(result.changes) > 0;
}
