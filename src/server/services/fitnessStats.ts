import type { DatabaseSync } from 'node:sqlite';
import type { SeriesPoint } from '@shared/types';
import { rangeFor, type StatsView } from '../lib/statsRange';
import { getSetting } from '../repositories/settings';

interface SessionRow {
  id: string;
  date: string;
  duration_minutes: number | null;
}

interface SetRow {
  session_id: string;
  date: string;
  weight_kg: number | null;
  reps: number;
  done: number;
  exercise_id: string | null;
}

interface WeightRow {
  date: string;
  weight_kg: number;
  created_at: string;
}

export interface FitnessStats {
  range: { from: string; to: string };
  summary: {
    totalVolume: number;
    sessionCount: number;
    totalDurationMinutes: number;
  };
  weight: SeriesPoint[];
  volume: SeriesPoint[];
  count: SeriesPoint[];
  strength: SeriesPoint[];
  exerciseOptions: { id: string; name: string }[];
}

function monthKey(date: string): string {
  return date.slice(0, 7);
}

export function getFitnessStats(
  db: DatabaseSync,
  view: StatsView,
  anchor: string,
  exerciseId?: string,
): FitnessStats {
  const weekStart = getSetting<0 | 1>(db, 'weekStart', 1);
  const range = rangeFor(view, anchor, weekStart);

  const sessions = db
    .prepare(
      "SELECT id, date, duration_minutes FROM workout_sessions WHERE status = 'completed' AND date >= ? AND date <= ?",
    )
    .all(range.from, range.to) as unknown as SessionRow[];

  const sets = db
    .prepare(
      "SELECT s.session_id, ws.date, s.weight_kg, s.reps, s.done, s.exercise_id FROM workout_sets s JOIN workout_sessions ws ON ws.id = s.session_id WHERE ws.status = 'completed' AND ws.date >= ? AND ws.date <= ?",
    )
    .all(range.from, range.to) as unknown as SetRow[];

  const weights = db
    .prepare(
      'SELECT date, weight_kg, created_at FROM weight_logs WHERE date >= ? AND date <= ? ORDER BY date ASC, created_at ASC',
    )
    .all(range.from, range.to) as unknown as WeightRow[];

  const exerciseOptions = db
    .prepare(
      "SELECT e.id, e.name FROM exercises e JOIN workout_sets s ON s.exercise_id = e.id JOIN workout_sessions ws ON ws.id = s.session_id WHERE e.type = 'weight' AND ws.status = 'completed' AND s.weight_kg IS NOT NULL GROUP BY e.id, e.name ORDER BY MAX(ws.date) DESC, e.name ASC",
    )
    .all() as unknown as { id: string; name: string }[];

  const selectedExerciseId =
    exerciseId && exerciseOptions.some((item) => item.id === exerciseId)
      ? exerciseId
      : exerciseOptions[0]?.id;

  const sessionDates = new Set(sessions.map((session) => session.date));
  const countByDay = new Map<string, number>();
  const volumeByDay = new Map<string, number>();
  const weightByDay = new Map<string, number>();
  const strengthByDay = new Map<string, number>();

  for (const session of sessions) {
    countByDay.set(session.date, (countByDay.get(session.date) ?? 0) + 1);
  }

  for (const set of sets) {
    if (set.done && set.weight_kg !== null) {
      volumeByDay.set(
        set.date,
        (volumeByDay.get(set.date) ?? 0) + set.weight_kg * set.reps,
      );
    }
    if (
      set.done &&
      set.weight_kg !== null &&
      set.exercise_id === selectedExerciseId
    ) {
      strengthByDay.set(
        set.date,
        Math.max(strengthByDay.get(set.date) ?? 0, set.weight_kg),
      );
    }
  }

  for (const weight of weights) {
    weightByDay.set(weight.date, weight.weight_kg);
  }

  const totalVolume = sets
    .filter((set) => set.done && set.weight_kg !== null)
    .reduce((sum, set) => sum + (set.weight_kg ?? 0) * set.reps, 0);

  const summary = {
    totalVolume,
    sessionCount: sessions.length,
    totalDurationMinutes: sessions.reduce(
      (sum, session) => sum + (session.duration_minutes ?? 0),
      0,
    ),
  };

  if (view === 'year') {
    const volumeByMonth = new Map<string, number>();
    const countByMonth = new Map<string, number>();
    const strengthByMonth = new Map<string, number>();
    const weightsByMonth = new Map<string, number[]>();

    for (const [date, value] of volumeByDay) {
      volumeByMonth.set(
        monthKey(date),
        (volumeByMonth.get(monthKey(date)) ?? 0) + value,
      );
    }
    for (const [date, value] of countByDay) {
      countByMonth.set(
        monthKey(date),
        (countByMonth.get(monthKey(date)) ?? 0) + value,
      );
    }
    for (const [date, value] of strengthByDay) {
      strengthByMonth.set(
        monthKey(date),
        Math.max(strengthByMonth.get(monthKey(date)) ?? 0, value),
      );
    }
    for (const [date, value] of weightByDay) {
      const list = weightsByMonth.get(monthKey(date)) ?? [];
      list.push(value);
      weightsByMonth.set(monthKey(date), list);
    }

    return {
      range: { from: range.from, to: range.to },
      summary,
      volume: range.points.map((point) => ({
        label: point.label,
        date: point.date,
        value:
          (countByMonth.get(monthKey(point.date)) ?? 0) > 0
            ? (volumeByMonth.get(monthKey(point.date)) ?? 0)
            : null,
      })),
      count: range.points.map((point) => ({
        label: point.label,
        date: point.date,
        value: countByMonth.get(monthKey(point.date)) ?? 0,
      })),
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
      strength: range.points.map((point) => ({
        label: point.label,
        date: point.date,
        value: strengthByMonth.get(monthKey(point.date)) ?? null,
      })),
      exerciseOptions,
    };
  }

  return {
    range: { from: range.from, to: range.to },
    summary,
    volume: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: sessionDates.has(point.date)
        ? (volumeByDay.get(point.date) ?? 0)
        : null,
    })),
    count: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: countByDay.get(point.date) ?? 0,
    })),
    weight: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: weightByDay.get(point.date) ?? null,
    })),
    strength: range.points.map((point) => ({
      label: point.label,
      date: point.date,
      value: strengthByDay.get(point.date) ?? null,
    })),
    exerciseOptions,
  };
}
