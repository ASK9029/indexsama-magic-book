import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../../src/client/features/home/HomePage';
import type { HomeAggregate } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const home: HomeAggregate = {
  date: '2026-11-09',
  progress: { done: 2, total: 4 },
  items: [
    {
      id: 'task-1',
      group: 'task',
      title: '测试手动事项',
      subtitle: 'work · high',
      done: false,
      href: '/today',
    },
    {
      id: 'study-1',
      group: 'study',
      title: '线代 1 小时',
      subtitle: '数学 · 60 分钟',
      done: true,
      href: '/study/subjects',
    },
    {
      id: 'fitness-1',
      group: 'fitness',
      title: '推日',
      subtitle: '45 分钟',
      done: true,
      href: '/fitness?tab=today',
    },
    {
      id: 'diet-lunch',
      group: 'diet',
      title: '午餐',
      subtitle: '计划 116 kcal',
      done: false,
      href: '/diet',
    },
  ],
  memos: [],
  studySummary: { minutes: 30, arrangements: 1 },
  fitnessSummary: { planName: '推日', completed: true, minutes: 45 },
  dietSummary: { calories: 1800, protein: 90, waterMl: 1500 },
  gameSummary: {
    playing: 1,
    wishlist: 0,
    completed: 1,
    paused: 0,
    totalMinutes: 60,
    completedThisYear: 1,
    recentCompleted: [],
    currentPlaying: null,
  },
};

describe('home full aggregation', () => {
  it('shows aggregated items, progress and summaries', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = String(input);
        if (url === '/api/home') return json(home);
        if (url.startsWith('/api/tasks?date=')) return json([]);
        if (url === '/api/memos') return json([]);
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

    expect(await screen.findByText('测试手动事项')).toBeInTheDocument();
    expect(screen.getByText('线代 1 小时')).toBeInTheDocument();
    expect(screen.getByText('推日')).toBeInTheDocument();
    expect(screen.getByText('已完成 2 / 4')).toBeInTheDocument();
    expect(screen.getAllByText('学习').length).toBeGreaterThan(0);
    expect(screen.getAllByText('游戏').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: '查看全部' }).length).toBeGreaterThan(0);
  });
});
