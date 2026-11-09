import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { PlanDay, PlanExercise } from '@shared/types';

interface PlanDayRow {
  weekday: number;
  name: string;
  is_rest: number;
}

interface PlanExerciseRow {
  weekday: number;
  exercise_id: string;
  target_sets: number;
  target_reps: string;
  sort_order: number;
}

export interface PlanDayInput {
  name: string;
  isRest: boolean;
  exercises: Array<{
    exerciseId: string;
    targetSets: number;
    targetReps: string;
    sortOrder?: number;
  }>;
}

const DAY_SELECT = 'SELECT weekday, name, is_rest FROM training_plan_days';
const EXERCISE_SELECT =
  'SELECT weekday, exercise_id, target_sets, target_reps, sort_order FROM training_plan_exercises';

function listPlanExercises(db: DatabaseSync, weekday: number): PlanExercise[] {
  const rows = db
    .prepare(`${EXERCISE_SELECT} WHERE weekday = ? ORDER BY sort_order ASC`)
    .all(weekday) as unknown as PlanExerciseRow[];

  return rows.map((row) => ({
    exerciseId: row.exercise_id,
    targetSets: row.target_sets,
    targetReps: row.target_reps,
    sortOrder: row.sort_order,
  }));
}

function toPlanDay(row: PlanDayRow, exercises: PlanExercise[]): PlanDay {
  return {
    weekday: row.weekday,
    name: row.name,
    isRest: row.is_rest === 1,
    exercises,
  };
}

export function getPlan(db: DatabaseSync): PlanDay[] {
  const rows = db.prepare(`${DAY_SELECT} ORDER BY weekday ASC`).all() as unknown as PlanDayRow[];
  const byWeekday = new Map(rows.map((row) => [row.weekday, row]));

  return Array.from({ length: 7 }, (_, index) => {
    const weekday = index + 1;
    const row = byWeekday.get(weekday) ?? {
      weekday,
      name: '',
      is_rest: 1,
    };
    return toPlanDay(row, listPlanExercises(db, weekday));
  });
}

export function getPlanDay(db: DatabaseSync, weekday: number): PlanDay {
  const row = db
    .prepare(`${DAY_SELECT} WHERE weekday = ?`)
    .get(weekday) as unknown as PlanDayRow | undefined;
  const day = row ?? { weekday, name: '', is_rest: 1 };
  return toPlanDay(day, listPlanExercises(db, weekday));
}

export function savePlanDay(
  db: DatabaseSync,
  weekday: number,
  input: PlanDayInput,
): PlanDay {
  db.exec('BEGIN');
  try {
    db.prepare(
      'INSERT INTO training_plan_days(weekday, name, is_rest) VALUES (?, ?, ?) ON CONFLICT(weekday) DO UPDATE SET name = excluded.name, is_rest = excluded.is_rest',
    ).run(weekday, input.name, input.isRest ? 1 : 0);

    db.prepare('DELETE FROM training_plan_exercises WHERE weekday = ?').run(weekday);

    const insert = db.prepare(
      'INSERT INTO training_plan_exercises(id, weekday, exercise_id, target_sets, target_reps, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
    );

    input.exercises.forEach((exercise, index) => {
      insert.run(
        randomUUID(),
        weekday,
        exercise.exerciseId,
        exercise.targetSets,
        exercise.targetReps,
        exercise.sortOrder ?? index,
      );
    });

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return getPlanDay(db, weekday);
}
