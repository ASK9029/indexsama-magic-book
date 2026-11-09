function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function toLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(value: string, days: number): string {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
}

export function startOfWeek(value: string, weekStartsOn: 0 | 1): string {
  const date = parseLocalDate(value);
  const offset = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - offset);
  return toLocalDate(date);
}
