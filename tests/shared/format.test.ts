import { describe, it, expect } from 'vitest';
import { formatMinutes, formatWeight, formatCalories } from '../../src/shared/format';

describe('format helpers', () => {
  it('formats minutes', () => {
    expect(formatMinutes(45)).toBe('45 分钟');
    expect(formatMinutes(90)).toBe('1 小时 30 分钟');
  });

  it('formats weight by unit', () => {
    expect(formatWeight(70.2, 'kg')).toBe('70.2 kg');
    expect(formatWeight(70.2, 'jin')).toBe('140.4 斤');
  });

  it('formats calories as an integer with thousands separator', () => {
    expect(formatCalories(1250.4)).toBe('1,250 kcal');
  });
});
