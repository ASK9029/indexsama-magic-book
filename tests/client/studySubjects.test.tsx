import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubjectsPage } from '../../src/client/features/study/SubjectsPage';
import type { Subject } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const subject: Subject = {
  id: 's1',
  name: '数学',
  color: '#2F6B5E',
  goal: '学完线代',
  weeklyTargetMinutes: 300,
  archived: false,
  createdAt: '2026-11-09T00:00:00.000Z',
};

describe('study subjects page', () => {
  it('lists subjects and creates a new one', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/subjects' && method === 'GET') return json([subject]);
        if (url === '/api/subjects?archived=1') return json([]);
        if (url.startsWith('/api/study/arrangements?date=')) return json([]);
        if (url === '/api/study/sessions') return json([]);
        if (url.startsWith('/api/study/stats?week=')) {
          return json({ days: [], totalMinutes: 0, bySubject: [] });
        }
        if (url === '/api/subjects' && method === 'POST') {
          return json(
            {
              ...subject,
              id: 's2',
              name: '英语',
              goal: '',
              weeklyTargetMinutes: 0,
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
          <SubjectsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('数学')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '新增科目' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.type(screen.getByLabelText('科目名称'), '英语');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/subjects',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
