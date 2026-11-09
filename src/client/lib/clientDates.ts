import { parseLocalDate, toLocalDate } from '@shared/dates';

export function todayLocal(): string {
  return toLocalDate(new Date());
}

export function formatDateLabel(value: string): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(parseLocalDate(value));
}
