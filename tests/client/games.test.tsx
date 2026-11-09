import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GamesPage } from '../../src/client/features/games/GamesPage';
import type { Game, GameStats } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const game: Game = {
  id: 'g1',
  title: 'Hades',
  platform: 'PC',
  status: 'wishlist',
  rating: 4,
  playtimeMinutes: 120,
  startDate: null,
  finishDate: null,
  coverFileId: null,
  notes: '',
  createdAt: '2026-11-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

const stats: GameStats = {
  playing: 1,
  wishlist: 1,
  completed: 2,
  paused: 0,
  totalMinutes: 600,
  completedThisYear: 1,
  recentCompleted: [],
  currentPlaying: null,
};

describe('games page', () => {
  it('lists games, shows stats and creates a game', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/games' && method === 'POST') {
          return json({ ...game, id: 'g2', title: '新游戏' }, 201);
        }
        if (url === '/api/games/stats') return json(stats);
        if (url.startsWith('/api/games')) return json([game]);
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
          <GamesPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Hades')).toBeInTheDocument();
    expect(screen.getByText('总游玩')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '添加游戏' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.type(screen.getByLabelText('标题'), '新游戏');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/games',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
