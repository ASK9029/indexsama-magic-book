import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/client/components/ui/Toast';
import { CheckinAlbum } from '../../src/client/features/study/CheckinAlbum';

vi.mock('../../src/client/lib/compressImage', () => ({
  compressImage: vi.fn(async (file: File) => file),
}));

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('check-in album', () => {
  it('uploads a selected photo', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/subjects/s1/checkins' && method === 'GET') {
          return json({ photos: [], days: 0, totalPhotos: 0 });
        }
        if (url === '/api/subjects/s1/checkins' && method === 'POST') {
          return json(
            [
              {
                id: 'p1',
                subjectId: 's1',
                date: '2026-11-09',
                fileId: 'f1',
                sortOrder: 0,
                createdAt: '2026-11-09T00:00:00.000Z',
              },
            ],
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

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <CheckinAlbum subjectId="s1" />
        </ToastProvider>
      </QueryClientProvider>,
    );

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();

    const user = userEvent.setup();
    await user.upload(
      input!,
      new File(['image'], 'a.png', { type: 'image/png' }),
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/subjects/s1/checkins',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
