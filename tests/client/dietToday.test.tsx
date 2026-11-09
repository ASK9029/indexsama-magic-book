import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DietTodayPage } from '../../src/client/features/diet/DietTodayPage';
import type { DietDay, MealBucket } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const meals: MealBucket[] = (
  ['breakfast', 'lunch', 'dinner', 'snack'] as const
).map((meal) => ({
  meal,
  plannedEntries: [],
  actualEntries:
    meal === 'lunch'
      ? [
          {
            id: 'e1',
            date: '2026-11-09',
            meal: 'lunch',
            kind: 'actual',
            foodId: 'food-rice',
            foodName: '米饭',
            amount: 200,
            unit: 'g',
            servingLabel: null,
            per100Calories: 116,
            per100Protein: 2.6,
            calories: 232,
            protein: 5.2,
            createdAt: '2026-11-09T08:00:00.000Z',
          },
        ]
      : [],
  plannedCalories: 0,
  plannedProtein: 0,
  actualCalories: meal === 'lunch' ? 232 : 0,
  actualProtein: meal === 'lunch' ? 5.2 : 0,
  done: false,
}));

const day: DietDay = {
  date: '2026-11-09',
  meals,
  summary: { calories: 232, protein: 5.2 },
  targets: { calorieTarget: null, proteinTarget: null, waterTarget: null },
};

describe('diet today page', () => {
  it('renders four meals and actual totals', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = String(input);
        if (url.startsWith('/api/diet/day')) return json(day);
        return json({ ok: true });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <DietTodayPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('午餐')).toBeInTheDocument();
    expect(screen.getByText('晚餐')).toBeInTheDocument();
    expect(screen.getByText('米饭')).toBeInTheDocument();
    expect(screen.getAllByText('232 kcal').length).toBeGreaterThan(0);
    expect(screen.getByText('蛋白 5.2 g')).toBeInTheDocument();
    expect(screen.getByText('今日摄入')).toBeInTheDocument();
  });
});
