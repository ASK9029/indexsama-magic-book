import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/client/components/ui/Toast';
import { QuickAddProvider, useQuickAdd } from '../../src/client/hooks/useQuickAdd';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const subject = {
  id: 's1',
  name: '数学',
  color: '#2F6B5E',
  goal: '',
  weeklyTargetMinutes: 0,
  archived: false,
  createdAt: '2026-11-01T00:00:00.000Z',
};

function Trigger() {
  const { openQuickAdd } = useQuickAdd();
  return (
    <div>
      <button type="button" onClick={() => openQuickAdd('water')}>
        水
      </button>
      <button type="button" onClick={() => openQuickAdd('weight')}>
        重
      </button>
      <button type="button" onClick={() => openQuickAdd('study')}>
        学
      </button>
    </div>
  );
}

describe('global quick add', () => {
  it('adds water, weight and a study arrangement', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url.startsWith('/api/tasks?date=')) return json([]);
        if (url === '/api/memos') return json([]);
        if (url.startsWith('/api/study/arrangements?date=')) return json([]);
        if (url === '/api/subjects') return json([subject]);
        if (url === '/api/water' && method === 'POST') {
          return json(
            {
              id: 'w1',
              date: '2026-11-09',
              amountMl: 250,
              createdAt: '2026-11-09T10:00:00.000Z',
            },
            201,
          );
        }
        if (url === '/api/weights' && method === 'POST') {
          return json(
            {
              id: 'wt1',
              date: '2026-11-09',
              weightKg: 70,
              createdAt: '2026-11-09T10:00:00.000Z',
            },
            201,
          );
        }
        if (url === '/api/study/arrangements' && method === 'POST') {
          return json(
            {
              id: 'a1',
              subjectId: 's1',
              date: '2026-11-09',
              content: '线代',
              plannedMinutes: 30,
              done: false,
              createdAt: '2026-11-09T10:00:00.000Z',
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
        <ToastProvider>
          <QuickAddProvider>
            <Trigger />
          </QuickAddProvider>
        </ToastProvider>
      </QueryClientProvider>,
    );

    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: '水' }));
    const waterDialog = await screen.findByRole('dialog');
    await user.click(
      within(waterDialog).getByRole('button', { name: '+250 ml' }),
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/water',
        expect.objectContaining({ method: 'POST' }),
      ),
    );

    await user.click(screen.getByRole('button', { name: '重' }));
    const weightDialog = await screen.findByRole('dialog');
    await user.type(
      within(weightDialog).getByLabelText('体重（kg）'),
      '70',
    );
    await user.click(within(weightDialog).getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/weights',
        expect.objectContaining({ method: 'POST' }),
      ),
    );

    await user.click(screen.getByRole('button', { name: '学' }));
    const studyDialog = await screen.findByRole('dialog');
    await user.type(
      within(studyDialog).getByLabelText('学习内容'),
      '线代',
    );
    await user.click(within(studyDialog).getByRole('button', { name: '保存' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/study/arrangements',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
