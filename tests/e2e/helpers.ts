export function localDate(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toLocaleDateString('en-CA');
}

export function weekdayFor(date: string): number {
  const day = new Date(`${date}T00:00:00`).getDay();
  return day === 0 ? 7 : day;
}
