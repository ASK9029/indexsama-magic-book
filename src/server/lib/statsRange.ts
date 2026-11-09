import { addDays, parseLocalDate, startOfWeek } from '@shared/dates';

export type StatsView = 'week' | 'month' | 'year';

export interface StatsPoint {
  date: string;
  label: string;
}

export interface StatsRange {
  from: string;
  to: string;
  points: StatsPoint[];
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function rangeFor(
  view: StatsView,
  anchor: string,
  weekStart: 0 | 1,
): StatsRange {
  if (view === 'week') {
    const from = startOfWeek(anchor, weekStart);
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(from, index);
      return { date, label: date.slice(5) };
    });
    return { from, to: addDays(from, 6), points };
  }

  if (view === 'month') {
    const parsed = parseLocalDate(anchor);
    const year = parsed.getFullYear();
    const month = parsed.getMonth();
    const from = `${year}-${pad2(month + 1)}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const points = Array.from({ length: lastDay }, (_, index) => {
      const day = index + 1;
      return {
        date: `${year}-${pad2(month + 1)}-${pad2(day)}`,
        label: String(day),
      };
    });
    return {
      from,
      to: `${year}-${pad2(month + 1)}-${pad2(lastDay)}`,
      points,
    };
  }

  const year = parseLocalDate(anchor).getFullYear();
  return {
    from: `${year}-01-01`,
    to: `${year}-12-31`,
    points: Array.from({ length: 12 }, (_, index) => ({
      date: `${year}-${pad2(index + 1)}-01`,
      label: `${index + 1}月`,
    })),
  };
}
