import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../../src/client/features/home/HomePage';
import type { Task } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const tasks: Task[] = Array.from({ length: 6 }, (_, index) => ({
  id: `t${index + 1}`,
  date: '2026-11-09',
  title: `事项 ${index + 1}`,
  category: 'work',
  priority: 'medium',
  time: null,
  note: '',
  done: false,
  createdAt: '2026-11-09T00:00:00.000Z',
  updatedAt: '2026-11-09T00:00:00.000Z',
}));

describe('home page', () => {
  it('shows five tasks, opens task modal and posts a memo', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url.startsWith('/api/tasks?date=') && (!init?.method || init.method === 'GET')) {
          return json(tasks);
        }
        if (url === '/api/memos' && (!init?.method || init.method === 'GET')) {
          return json([]);
        }
        if (url === '/api/memos' && init?.method === 'POST') {
          return json(
            {
              id: 'm1',
              text: '买牛奶',
              pinned: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
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
          <HomePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    for (let index = 1; index <= 5; index += 1) {
      expect(await screen.findByText(`事项 ${index}`)).toBeInTheDocument();
    }
    expect(screen.queryByText('事项 6')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看全部' })).toBeInTheDocument();
    expect(screen.getByText('学习')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /加一件事/ }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '取消' }));

    const memoInput = screen.getByPlaceholderText('记点什么，比如：买牛奶');
    await user.type(memoInput, '买牛奶{Enter}');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/memos',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
