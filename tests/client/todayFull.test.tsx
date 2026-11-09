import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TodayPage } from '../../src/client/features/today/TodayPage';
import type {
  DayAggregate,
  DayMealSummary,
  Subject,
  Task,
} from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const date = '2026-11-09';
const task: Task = {
  id: 't1',
  date,
  title: '写周报',
  category: 'work',
  priority: 'high',
  time: null,
  note: '',
  done: false,
  createdAt: '2026-11-09T00:00:00.000Z',
  updatedAt: '2026-11-09T00:00:00.000Z',
};

const subject: Subject = {
  id: 's1',
  name: '数学',
  color: '#2F6B5E',
  goal: '',
  weeklyTargetMinutes: 0,
  archived: false,
  createdAt: '2026-11-01T00:00:00.000Z',
};

function meal(
  name: DayMealSummary['meal'],
  planned: boolean,
): DayMealSummary {
  return {
    meal: name,
    plannedCalories: planned ? 116 : 0,
    plannedProtein: planned ? 2.6 : 0,
    actualCalories: 0,
    actualProtein: 0,
    done: false,
    planned,
  };
}

const day: DayAggregate = {
  date,
  tasks: [task],
  study: {
    arrangements: [
      {
        id: 'a1',
        subjectId: 's1',
        date,
        content: '线代 1 小时',
        plannedMinutes: 60,
        done: true,
        createdAt: '2026-11-09T00:00:00.000Z',
        actualMinutes: 30,
      },
    ],
  },
  fitness: {
    plan: {
      weekday: 1,
      name: '推日',
      isRest: false,
      exercises: [
        {
          exerciseId: 'builtin-bench-press',
          targetSets: 3,
          targetReps: '8-12',
          sortOrder: 0,
        },
      ],
    },
    session: {
      id: 'w1',
      date,
      name: '推日',
      status: 'completed',
      startAt: `${date}T18:00:00`,
      endAt: `${date}T18:45:00`,
      durationMinutes: 45,
      note: '',
      sets: [],
    },
  },
  diet: {
    meals: [
      meal('breakfast', false),
      meal('lunch', true),
      meal('dinner', false),
      meal('snack', false),
    ],
    summary: { calories: 0, protein: 0, waterMl: 0 },
  },
  progress: { done: 2, total: 4 },
};

describe('today full aggregation', () => {
  it('shows study, fitness and diet groups with progress', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url === `/api/day/${date}`) return json(day);
        if (url.startsWith('/api/tasks?date=')) return json([task]);
        if (url.startsWith('/api/study/arrangements')) return json([]);
        if (url === '/api/subjects') return json([subject]);
        if (url === '/api/diet/meals/lunch/done' && init?.method === 'POST') {
          return json({ date, meal: 'lunch', done: true });
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
        <MemoryRouter initialEntries={[`/today?date=${date}`]}>
          <TodayPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('写周报')).toBeInTheDocument();
    expect(screen.getByText('线代 1 小时')).toBeInTheDocument();
    expect(screen.getByText('推日')).toBeInTheDocument();
    expect(screen.getByText('午餐')).toBeInTheDocument();
    expect(screen.getByText('2 / 4 完成')).toBeInTheDocument();

    // Manual task, study arrangement and planned meal; fitness has no checkbox.
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);

    const user = userEvent.setup();
    await user.click(screen.getByRole('checkbox', { name: '完成 午餐' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/diet/meals/lunch/done',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
