import { describe, it, expect } from 'vitest';
import { toLocalDate, parseLocalDate, addDays, startOfWeek } from '../../src/shared/dates';

describe('local dates', () => {
  it('formats a local Date without UTC shift', () => {
    expect(toLocalDate(new Date(2026, 10, 9))).toBe('2026-11-09');
  });

  it('parses to local midnight', () => {
    const d = parseLocalDate('2026-11-09');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 10, 9]);
  });

  it('adds days across month boundary', () => {
    expect(addDays('2026-11-09', 1)).toBe('2026-11-10');
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
  });

  it('finds the start of the week for Monday and Sunday starts', () => {
    expect(startOfWeek('2026-11-09', 1)).toBe('2026-11-09');
    expect(startOfWeek('2026-11-11', 1)).toBe('2026-11-09');
    expect(startOfWeek('2026-11-11', 0)).toBe('2026-11-08');
  });
});
