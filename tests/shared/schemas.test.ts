import { describe, it, expect } from 'vitest';
import { taskCreateSchema } from '../../src/shared/schemas';

describe('taskCreateSchema', () => {
  it('accepts a valid task', () => {
    expect(
      taskCreateSchema.safeParse({
        date: '2026-11-09',
        title: '写周报',
        category: 'work',
        priority: 'high',
      }).success,
    ).toBe(true);
  });

  it('rejects empty title and bad date', () => {
    expect(
      taskCreateSchema.safeParse({
        date: '2026-11-09',
        title: '',
        category: 'work',
        priority: 'high',
      }).success,
    ).toBe(false);

    expect(
      taskCreateSchema.safeParse({
        date: '11/09/2026',
        title: 'x',
        category: 'work',
        priority: 'high',
      }).success,
    ).toBe(false);
  });
});
