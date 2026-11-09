import type { DatabaseSync } from 'node:sqlite';
import type { DietDay, Meal, MealEntry } from '@shared/types';
import { getSetting } from '../repositories/settings';
import { listEntries, listMealStatus } from '../repositories/meals';

const MEALS: Meal[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function totals(entries: MealEntry[]): { calories: number; protein: number } {
  return entries.reduce(
    (sum, entry) => ({
      calories: sum.calories + entry.calories,
      protein: sum.protein + entry.protein,
    }),
    { calories: 0, protein: 0 },
  );
}

export function getDietDay(db: DatabaseSync, date: string): DietDay {
  const entries = listEntries(db, date);
  const status = listMealStatus(db, date);

  const meals = MEALS.map((meal) => {
    const plannedEntries = entries.filter(
      (entry) => entry.meal === meal && entry.kind === 'plan',
    );
    const actualEntries = entries.filter(
      (entry) => entry.meal === meal && entry.kind === 'actual',
    );
    const planned = totals(plannedEntries);
    const actual = totals(actualEntries);

    return {
      meal,
      plannedEntries,
      actualEntries,
      plannedCalories: planned.calories,
      plannedProtein: planned.protein,
      actualCalories: actual.calories,
      actualProtein: actual.protein,
      done: status.get(meal) ?? false,
    };
  });

  const summary = totals(entries.filter((entry) => entry.kind === 'actual'));

  return {
    date,
    meals,
    summary,
    targets: {
      calorieTarget: getSetting<number | null>(db, 'calorieTarget', null),
      proteinTarget: getSetting<number | null>(db, 'proteinTarget', null),
      waterTarget: getSetting<number | null>(db, 'waterTarget', null),
    },
  };
}
