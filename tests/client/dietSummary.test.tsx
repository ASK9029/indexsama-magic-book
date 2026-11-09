import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DietSummaryRail } from '../../src/client/features/diet/DietSummaryRail';
import type { DietDay } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const day: DietDay = {
  date: '2026-11-09',
  meals: [],
  summary: {
    calories: 1800,
    protein: 90,
    waterMl: 750,
    waterTarget: 2000,
    weightKg: 70.5,
    weightLoggedAt: '2026-11-09T08:00:00.000Z',
  },
  targets: {
    calorieTarget: 2000,
    proteinTarget: 120,
    waterTarget: 2000,
  },
};

describe('diet summary rail', () => {
  it('shows intake, water and weight, and adds water', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';
        if (url === '/api/water' && method === 'POST') {
          return json(
            {
              id: 'w1',
              date: '2026-11-09',
              amountMl: 250,
              createdAt: '2026-11-09T09:00:00.000Z',
            },
            201,
          );
        }
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
          <DietSummaryRail day={day} date="2026-11-09" future={false} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText('今日摄入')).toBeInTheDocument();
    expect(screen.getByText('750 / 2000 ml')).toBeInTheDocument();
    expect(screen.getByText('70.5 kg')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '+250' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/water',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
