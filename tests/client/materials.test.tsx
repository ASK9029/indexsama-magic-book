import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaterialsPage } from '../../src/client/features/study/MaterialsPage';
import type { Material, Subject } from '../../src/shared/types';

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
  goal: '',
  weeklyTargetMinutes: 300,
  archived: false,
  createdAt: '2026-11-09T00:00:00.000Z',
};

const material: Material = {
  id: 'm1',
  type: 'link',
  title: '线代讲义',
  subjectId: 's1',
  url: 'https://example.com/',
  fileId: null,
  status: 'not_started',
  progress: 0,
  tags: ['线代'],
  excerpt: '',
  body: '',
  createdAt: '2026-11-09T00:00:00.000Z',
  updatedAt: '2026-11-09T00:00:00.000Z',
};

describe('materials page', () => {
  it('lists materials and creates a link', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/materials' && method === 'GET') return json([material]);
        if (url === '/api/subjects') return json([subject]);
        if (url === '/api/materials/link' && method === 'POST') {
          return json({ ...material, id: 'm2', title: '新链接' }, 201);
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
          <MaterialsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('线代讲义')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '添加资料' }));
    await user.click(screen.getByRole('button', { name: '链接' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.type(screen.getByLabelText('标题'), '新链接');
    await user.type(screen.getByLabelText('链接'), 'example.org');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/materials/link',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
