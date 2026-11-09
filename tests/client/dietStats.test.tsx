import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DietStatsPage } from '../../src/client/features/diet/DietStatsPage';
import type { DietStatsData } from '../../src/client/hooks/useDietStats';
import type { SeriesPoint } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function points(values: (number | null)[]): SeriesPoint[] {
  return values.map((value, index) => ({
    label: String(index + 1),
    date: `2026-11-0${index + 2}`,
    value,
  }));
}

const stats: DietStatsData = {
  range: { from: '2026-11-02', to: '2026-11-08' },
  summary: {
    recordedDays: 2,
    avgCalories: 1700,
    avgProtein: 85,
    avgWaterMl: 1250,
    weightChange: 0.5,
  },
  calories: points([1800, 1600, null, null, null, null, null]),
  protein: points([90, 80, null, null, null, null, null]),
  water: points([1000, 1500, null, null, null, null, null]),
  weight: points([70, 70.5, null, null, null, null, null]),
  targets: {
    calorieTarget: 2000,
    proteinTarget: 120,
    waterTarget: 2000,
  },
};

describe('diet stats page', () => {
  it('renders summary and four chart cards', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = String(input);
        if (url.startsWith('/api/stats/diet')) return json(stats);
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
          <DietStatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('记录天数')).toBeInTheDocument();
    expect(screen.getByText('2 天')).toBeInTheDocument();
    expect(screen.getByText('日均热量')).toBeInTheDocument();
    expect(screen.getByText('1700 kcal')).toBeInTheDocument();
    expect(screen.getByText('热量（kcal）')).toBeInTheDocument();
    expect(screen.getByText('蛋白质（g）')).toBeInTheDocument();
    expect(screen.getByText('饮水（ml）')).toBeInTheDocument();
    expect(screen.getByText('体重（kg）')).toBeInTheDocument();
  });
});
