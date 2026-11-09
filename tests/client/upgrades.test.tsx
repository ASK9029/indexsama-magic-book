import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CurrentWeightTable } from '../../src/client/features/fitness/CurrentWeightTable';
import type { Exercise, ExerciseUpgrade, PlanDay } from '../../src/shared/types';

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

const latest: ExerciseUpgrade = {
  id: 'u1',
  exerciseId: 'builtin-bench-press',
  exerciseName: '杠铃卧推',
  date: '2026-11-09',
  fromWeightKg: 60,
  toWeightKg: 62.5,
  note: '',
  createdAt: '2026-11-09T00:00:00.000Z',
};

const current = [
  {
    exerciseId: 'builtin-bench-press',
    exerciseName: '杠铃卧推',
    currentWeightKg: 62.5,
    latestUpgrade: latest,
  },
];

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

describe('current weight table', () => {
  it('records an upgrade for a planned exercise', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/fitness/current-weights') return json(current);
        if (url === '/api/fitness/plan') return json(days);
        if (url === '/api/fitness/exercises') return json([exercise]);
        if (url === '/api/fitness/upgrades' && method === 'POST') {
          return json({ ...latest, id: 'u2', fromWeightKg: 62.5, toWeightKg: 65 });
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
        <CurrentWeightTable />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('杠铃卧推')).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '升级' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const toInput = screen.getByLabelText('新重量（kg）');
    await user.type(toInput, '65');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/fitness/upgrades',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
