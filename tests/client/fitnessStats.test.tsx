import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatsPage } from '../../src/client/features/fitness/StatsPage';
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
    date: `2026-11-0${index + 1}`,
    value,
  }));
}

const stats = {
  range: { from: '2026-11-09', to: '2026-11-15' },
  summary: { totalVolume: 960, sessionCount: 2, totalDurationMinutes: 65 },
  weight: points([70, 70.5, 71, null, null, null, null]),
  volume: points([960, 0, null, null, null, null, null]),
  count: points([1, 1, 0, 0, 0, 0, 0]),
  strength: points([60, null, null, null, null, null, null]),
  exerciseOptions: [{ id: 'builtin-bench-press', name: '杠铃卧推' }],
};

describe('fitness stats page', () => {
  it('renders summary and four chart cards', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = String(input);
        if (url.startsWith('/api/stats/fitness')) return json(stats);
        if (url === '/api/fitness/sessions') return json([]);
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
          <StatsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('总训练量')).toBeInTheDocument();
    expect(screen.getByText('960 kg')).toBeInTheDocument();
    expect(screen.getAllByText('训练次数').length).toBeGreaterThan(0);
    expect(screen.getByText('2 次')).toBeInTheDocument();
    expect(screen.getByText('体重（kg）')).toBeInTheDocument();
    expect(screen.getByText('训练量（kg）')).toBeInTheDocument();
    expect(screen.getByText('动作力量（kg）')).toBeInTheDocument();
  });
});
