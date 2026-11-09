import type { DatabaseSync } from 'node:sqlite';
import { addDays, startOfWeek } from '@shared/dates';
import { getSetting } from '../repositories/settings';

export interface StudyWeekStats {
  days: { date: string; minutes: number }[];
  totalMinutes: number;
  bySubject: { subjectId: string; minutes: number }[];
}

interface SessionRow {
  subject_id: string;
  date: string;
  duration_minutes: number;
}

export function getStudyWeekStats(
  db: DatabaseSync,
  weekDate: string,
): StudyWeekStats {
  const weekStartsOn = getSetting<0 | 1>(db, 'weekStart', 1);
  const start = startOfWeek(weekDate, weekStartsOn);
  const end = addDays(start, 6);

  const rows = db
    .prepare(
      'SELECT subject_id, date, duration_minutes FROM study_sessions WHERE date >= ? AND date <= ?',
    )
    .all(start, end) as unknown as SessionRow[];

  const dayMinutes = new Map<string, number>();
  const subjectMinutes = new Map<string, number>();
  let totalMinutes = 0;

  for (const row of rows) {
    dayMinutes.set(row.date, (dayMinutes.get(row.date) ?? 0) + row.duration_minutes);
    subjectMinutes.set(
      row.subject_id,
      (subjectMinutes.get(row.subject_id) ?? 0) + row.duration_minutes,
    );
    totalMinutes += row.duration_minutes;
  }

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index);
    return { date, minutes: dayMinutes.get(date) ?? 0 };
  });

  const bySubject = [...subjectMinutes.entries()]
    .map(([subjectId, minutes]) => ({ subjectId, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  return { days, totalMinutes, bySubject };
}
