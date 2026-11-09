import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeeklyPlanPage } from '../../src/client/features/fitness/WeeklyPlanPage';
import type { Exercise, PlanDay } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const exercise: Exercise = {
  id: 'builtin-bench-press',
  name: '杠铃卧推',
  muscleGroup: '胸',
  equipment: '杠铃',
  type: 'weight',
  notes: '',
  builtIn: true,
};

const days: PlanDay[] = Array.from({ length: 7 }, (_, index) => ({
  weekday: index + 1,
  name: '',
  isRest: true,
  exercises: [],
}));
days[0] = {
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
};

describe('weekly fitness plan', () => {
  it('lists seven days and saves an edited day', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/fitness/plan' && method === 'GET') return json(days);
        if (url === '/api/fitness/exercises') return json([exercise]);
        if (url === '/api/fitness/plan/1' && method === 'PUT') {
          return json({ ...days[0], name: '推日改' });
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
        <WeeklyPlanPage />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('推日')).toBeInTheDocument();
    expect(screen.getByText('周六')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '编辑 周一' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('训练名称');
    await user.clear(nameInput);
    await user.type(nameInput, '推日改');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/fitness/plan/1',
        expect.objectContaining({ method: 'PUT' }),
      ),
    );
  });
});
