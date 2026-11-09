import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MemoryRouter,
  Route,
  Routes,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider } from '../../src/client/components/ui/Confirm';
import { SessionPage } from '../../src/client/features/fitness/SessionPage';
import type { WorkoutSession } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const session: WorkoutSession = {
  id: 's1',
  date: '2026-11-09',
  name: '推日',
  status: 'draft',
  startAt: new Date(Date.now() - 60_000).toISOString(),
  endAt: null,
  durationMinutes: null,
  note: '',
  sets: [
    {
      id: 't1',
      sessionId: 's1',
      exerciseId: 'builtin-bench-press',
      exerciseName: '杠铃卧推',
      setNo: 1,
      weightKg: 60,
      reps: 10,
      done: false,
    },
  ],
};

const completed: WorkoutSession = {
  ...session,
  status: 'completed',
  endAt: new Date().toISOString(),
  durationMinutes: 30,
  sets: [{ ...session.sets[0], done: true }],
};

describe('workout session page', () => {
  it('toggles a set and finishes the session', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/fitness/sessions/s1' && method === 'GET') {
          return json(session);
        }
        if (url === '/api/fitness/sets/t1' && method === 'PATCH') {
          return json({ ...session.sets[0], done: true });
        }
        if (url === '/api/fitness/sessions/s1/finish' && method === 'POST') {
          return json(completed);
        }
        if (url === '/api/fitness/exercises') return json([]);
        if (url === '/api/fitness/current-weights') return json([]);
        return json({ ok: true });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ConfirmProvider>
          <MemoryRouter initialEntries={['/fitness/session/s1']}>
            <Routes>
              <Route path="/fitness/session/:id" element={<SessionPage />} />
            </Routes>
          </MemoryRouter>
        </ConfirmProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('杠铃卧推')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox', { name: '完成' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/fitness/sets/t1',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );

    await user.click(screen.getByRole('button', { name: '结束训练' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '保存并结束' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/fitness/sessions/s1/finish',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
