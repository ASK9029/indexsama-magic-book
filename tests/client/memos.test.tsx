import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { QuickMemoCard } from '../../src/client/features/home/QuickMemoCard';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('quick memo card', () => {
  it('adds a memo on Enter', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
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
        <QuickMemoCard />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();
    const input = screen.getByPlaceholderText('记点什么，比如：买牛奶');
    await user.type(input, '买牛奶{Enter}');

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/memos',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
