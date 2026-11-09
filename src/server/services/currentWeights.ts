import type { DatabaseSync } from 'node:sqlite';
import type { ExerciseUpgrade } from '@shared/types';
import { getExercise } from '../repositories/exercises';
import { latestUpgrade, maxCompletedWeight } from '../repositories/upgrades';

export interface CurrentWeight {
  exerciseId: string;
  exerciseName: string;
  currentWeightKg: number | null;
  latestUpgrade: ExerciseUpgrade | null;
}

export function getCurrentWeight(
  db: DatabaseSync,
  exerciseId: string,
): number | null {
  const latest = latestUpgrade(db, exerciseId);
  if (latest) return latest.toWeightKg;
  return maxCompletedWeight(db, exerciseId);
}

export function getCurrentWeights(db: DatabaseSync): CurrentWeight[] {
  const planRows = db
    .prepare('SELECT DISTINCT exercise_id FROM training_plan_exercises')
    .all() as unknown as { exercise_id: string }[];
  const upgradeRows = db
    .prepare(
      'SELECT DISTINCT exercise_id FROM exercise_upgrades WHERE exercise_id IS NOT NULL',
    )
    .all() as unknown as { exercise_id: string }[];

  const ids = [
    ...new Set([
      ...planRows.map((row) => row.exercise_id),
      ...upgradeRows.map((row) => row.exercise_id),
    ]),
  ];

  const current = ids.map((exerciseId) => {
    const exercise = getExercise(db, exerciseId);
    const latest = latestUpgrade(db, exerciseId);
    const fallback = maxCompletedWeight(db, exerciseId);

    return {
      exerciseId,
      exerciseName: exercise?.name ?? latest?.exerciseName ?? '未知动作',
      currentWeightKg: latest?.toWeightKg ?? fallback,
      latestUpgrade: latest,
    };
  });

  return current.sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName, 'zh-CN'),
  );
}
