import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodayPage } from '../../src/client/features/today/TodayPage';
import type { Task } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

const task: Task = {
  id: 't1',
  date: '2026-11-09',
  title: '写周报',
  category: 'work',
  priority: 'high',
  time: null,
  note: '',
  done: false,
  createdAt: '2026-11-09T00:00:00.000Z',
  updatedAt: '2026-11-09T00:00:00.000Z',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('today page', () => {
  it('shows manual tasks and toggles done', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url.startsWith('/api/tasks?date=') && (!init?.method || init.method === 'GET')) {
          return json([task]);
        }
        if (url.startsWith('/api/study/arrangements?date=')) {
          return json([]);
        }
        if (url === '/api/subjects') {
          return json([]);
        }
        if (url === '/api/tasks/t1' && init?.method === 'PATCH') {
          return json({ ...task, done: true });
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
        <MemoryRouter initialEntries={['/today?date=2026-11-09']}>
          <TodayPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('写周报')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox', { name: '写周报' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/tasks/t1',
        expect.objectContaining({ method: 'PATCH' }),
      ),
    );
  });
});
