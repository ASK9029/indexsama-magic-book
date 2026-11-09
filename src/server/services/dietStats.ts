import type { DatabaseSync } from 'node:sqlite';
import type { SeriesPoint } from '@shared/types';
import { rangeFor, type StatsView } from '../lib/statsRange';
import { getSetting } from '../repositories/settings';

interface FoodRow {
  date: string;
  calories: number;
  protein: number;
}

interface WaterRow {
  date: string;
  total: number;
}

interface WeightRow {
  date: string;
  weight_kg: number;
}

export interface DietStats {
  range: { from: string; to: string };
  summary: {
    recordedDays: number;
    avgCalories: number;
    avgProtein: number;
    avgWaterMl: number;
    weightChange: number | null;
  };
  calories: SeriesPoint[];
  protein: SeriesPoint[];
  water: SeriesPoint[];
  weight: SeriesPoint[];
  targets: {
    calorieTarget: number | null;
    proteinTarget: number | null;
    waterTarget: number | null;
  };
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function getDietStats(
  db: DatabaseSync,
  view: StatsView,
  anchor: string,
): DietStats {
  const weekStart = getSetting<0 | 1>(db, 'weekStart', 1);
  const range = rangeFor(view, anchor, weekStart);

  const foodRows = db
    .prepare(
      "SELECT date, SUM(calories) AS calories, SUM(protein) AS protein FROM meal_entries WHERE kind = 'actual' AND date >= ? AND date <= ? GROUP BY date",
    )
    .all(range.from, range.to) as unknown as FoodRow[];
  const waterRows = db
    .prepare(
      'SELECT date, SUM(amount_ml) AS total FROM water_logs WHERE date >= ? AND date <= ? GROUP BY date',
    )
    .all(range.from, range.to) as unknown as WaterRow[];
  const weightRows = db
    .prepare(
      'SELECT date, weight_kg FROM weight_logs WHERE date >= ? AND date <= ? ORDER BY date ASC, created_at ASC',
    )
    .all(range.from, range.to) as unknown as WeightRow[];

  const foodByDate = new Map(foodRows.map((row) => [row.date, row]));
  const waterByDate = new Map(waterRows.map((row) => [row.date, row.total]));
  const weightByDate = new Map<string, number>();
  for (const row of weightRows) weightByDate.set(row.date, row.weight_kg);

  const foodDates = [...foodByDate.keys()].sort();
  const waterDates = [...waterByDate.keys()].sort();
  const weightDates = [...weightByDate.keys()].sort();

  const totalCalories = foodRows.reduce((sum, row) => sum + row.calories, 0);
  const totalProtein = foodRows.reduce((sum, row) => sum + row.protein, 0);
  const totalWater = waterRows.reduce((sum, row) => sum + row.total, 0);
  const firstWeight =
    weightDates.length > 0 ? weightByDate.get(weightDates[0])! : null;
  const lastWeight =
    weightDates.length > 0
      ? weightByDate.get(weightDates[weightDates.length - 1])!
      : null;

  const summary = {
    recordedDays: foodDates.length,
    avgCalories: foodDates.length > 0 ? totalCalories / foodDates.length : 0,
    avgProtein: foodDates.length > 0 ? totalProtein / foodDates.length : 0,
    avgWaterMl: waterDates.length > 0 ? totalWater / waterDates.length : 0,
    weightChange:
      firstWeight !== null && lastWeight !== null && weightDates.length > 1
        ? lastWeight - firstWeight
        : null,
  };

  const targets = {
    calorieTarget: getSetting<number | null>(db, 'calorieTarget', null),
    proteinTarget: getSetting<number | null>(db, 'proteinTarget', null),
    waterTarget: getSetting<number | null>(db, 'waterTarget', null),
  };

  if (view === 'year') {
    const foodByMonth = new Map<
      string,
      { calories: number; protein: number; days: number }
    >();
    for (const row of foodRows) {
      const key = monthKey(row.date);
      const current = foodByMonth.get(key) ?? {
        calories: 0,
        protein: 0,
        days: 0,
      };
      current.calories += row.calories;
      current.protein += row.protein;
      current.days += 1;
      foodByMonth.set(key, current);
    }

    const waterByMonth = new Map<string, { total: number; days: number }>();
    for (const row of waterRows) {
      const key = monthKey(row.date);
      const current = waterByMonth.get(key) ?? { total: 0, days: 0 };
      current.total += row.total;
      current.days += 1;
      waterByMonth.set(key, current);
    }

    const weightsByMonth = new Map<string, number[]>();
    for (const [date, value] of weightByDate) {
      const key = monthKey(date);
      const list = weightsByMonth.get(key) ?? [];
      list.push(value);
      weightsByMonth.set(key, list);
    }

    return {
      range: { from: range.from, to: range.to },
      summary,
      calories: range.points.map((point) => {
        const month = foodByMonth.get(monthKey(point.date));
        return {
          label: point.label,
          date: point.date,
          value:
            month && month.days > 0 ? month.calories / month.days : null,
        };
      }),
      protein: range.points.map((point) => {
        const month = foodByMonth.get(monthKey(point.date));
        return {
          label: point.label,
          date: point.date,
          value: month && month.days > 0 ? month.protein / month.days : null,
        };
      }),
      water: range.points.map((point) => {
        const month = waterByMonth.get(monthKey(point.date));
        return {
          label: point.label,
          date: point.date,
          value: month && month.days > 0 ? month.total / month.days : null,
        };
      }),
      weight: range.points.map((point) => {
        const list = weightsByMonth.get(monthKey(point.date)) ?? [];
        return {
          label: point.label,
          date: point.date,
          value:
            list.length > 0
              ? list.reduce((sum, value) => sum + value, 0) / list.length
              : null,
        };
      }),
      targets,
    };
  }

  return {
    range: { from: range.from, to: range.to },
    summary,
    calories: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: foodByDate.get(point.date)?.calories ?? null,
    })),
    protein: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: foodByDate.get(point.date)?.protein ?? null,
    })),
    water: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: waterByDate.get(point.date) ?? null,
    })),
    weight: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: weightByDate.get(point.date) ?? null,
    })),
    targets,
  };
}
