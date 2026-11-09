import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../../src/client/components/ui/Toast';
import { StudyTimerBar } from '../../src/client/components/layout/StudyTimerBar';
import { StudyTimerProvider } from '../../src/client/hooks/useStudyTimer';
import type { StudyTimer, Subject } from '../../src/shared/types';

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

describe('study timer bar', () => {
  it('resumes from the prompt and pauses the running timer', async () => {
    const running: StudyTimer = {
      status: 'running',
      subjectId: 's1',
      materialId: null,
      arrangementId: null,
      startedAt: new Date(Date.now() - 65_000).toISOString(),
      accumulatedSeconds: 0,
    };
    const paused: StudyTimer = {
      ...running,
      status: 'paused',
      accumulatedSeconds: 65,
    };

    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/study/timer' && method === 'GET') return json(running);
        if (url === '/api/subjects') return json([subject]);
        if (url === '/api/study/timer/pause' && method === 'POST') {
          return json(paused);
        }
        if (url === '/api/study/sessions') return json([]);
        if (url.startsWith('/api/study/stats?week=')) {
          return json({ days: [], totalMinutes: 0, bySubject: [] });
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
          <StudyTimerProvider>
            <StudyTimerBar />
          </StudyTimerProvider>
        </ToastProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '继续计时' }));

    expect(await screen.findByText('数学')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '暂停' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/study/timer/pause',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
