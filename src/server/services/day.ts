import type { DatabaseSync } from 'node:sqlite';
import { parseLocalDate } from '@shared/dates';
import type { DayAggregate, DayMealSummary } from '@shared/types';
import { getDietDay } from './dietDay';
import { getPlanDay } from '../repositories/fitnessPlan';
import { listArrangements } from '../repositories/studyArrangements';
import { listTasks } from '../repositories/tasks';
import { getSessionForDate } from '../repositories/workouts';

export function getDay(db: DatabaseSync, date: string): DayAggregate {
  const tasks = listTasks(db, date);
  const arrangements = listArrangements(db, date);

  const minuteRows = db
    .prepare(
      'SELECT arrangement_id, SUM(duration_minutes) AS minutes FROM study_sessions WHERE date = ? AND arrangement_id IS NOT NULL GROUP BY arrangement_id',
    )
    .all(date) as unknown as { arrangement_id: string; minutes: number }[];
  const minutesByArrangement = new Map(
    minuteRows.map((row) => [row.arrangement_id, row.minutes]),
  );

  const study = arrangements.map((arrangement) => ({
    ...arrangement,
    actualMinutes: minutesByArrangement.get(arrangement.id) ?? 0,
  }));

  const weekdayValue = parseLocalDate(date).getDay();
  const weekday = weekdayValue === 0 ? 7 : weekdayValue;
  const plan = getPlanDay(db, weekday);
  const session = getSessionForDate(db, date);

  const diet = getDietDay(db, date);
  const meals: DayMealSummary[] = diet.meals.map((meal) => ({
    meal: meal.meal,
    plannedCalories: meal.plannedCalories,
    plannedProtein: meal.plannedProtein,
    actualCalories: meal.actualCalories,
    actualProtein: meal.actualProtein,
    done: meal.done,
    planned: meal.plannedEntries.length > 0,
  }));

  const plannedMeals = meals.filter((meal) => meal.planned);
  const hasFitness =
    Boolean(session) ||
    Boolean(plan && !plan.isRest && plan.exercises.length > 0);

  const total =
    tasks.length +
    study.length +
    plannedMeals.length +
    (hasFitness ? 1 : 0);
  const done =
    tasks.filter((task) => task.done).length +
    study.filter((arrangement) => arrangement.done).length +
    plannedMeals.filter((meal) => meal.done).length +
    (session?.status === 'completed' ? 1 : 0);

  return {
    date,
    tasks,
    study: { arrangements: study },
    fitness: { plan, session },
    diet: {
      meals,
      summary: {
        calories: diet.summary.calories,
        protein: diet.summary.protein,
        waterMl: diet.summary.waterMl,
      },
    },
    progress: { done, total },
  };
}
