import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BackupTab } from '../../src/client/features/settings/BackupTab';
import { DangerTab } from '../../src/client/features/settings/DangerTab';

const reload = vi.fn();
const originalLocation = window.location;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const info = {
  dataDir: 'E:\\data',
  counts: {
    tasks: 1,
    memos: 0,
    subjects: 0,
    materials: 0,
    checkins: 0,
    sessions: 0,
    workouts: 0,
    meals: 0,
    games: 0,
  },
  storage: { dbBytes: 100, filesBytes: 0, totalBytes: 100 },
  lastBackupAt: '2026-11-09T08:00:00.000Z',
  version: '1.0.0',
};

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  reload.mockClear();
  fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = String(input);
      const method = init?.method ?? 'GET';

      if (url === '/api/data/info') return json(info);
      if (url === '/api/backup') {
        return new Response(new Blob(['zip']), {
          status: 200,
          headers: {
            'content-type': 'application/zip',
            'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent('IndexSama的魔法录-备份-2026-11-09-0800.zip')}`,
          },
        });
      }
      if (url === '/api/restore' && method === 'POST') {
        return json({ ok: true, manifest: {} });
      }
      if (url === '/api/data/clear' && method === 'POST') {
        return json({ ok: true });
      }
      return json({ ok: true });
    },
  );
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, reload },
  });
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:mock'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: originalLocation,
  });
});

describe('backup and clear UI', () => {
  it('exports a backup and restores from a selected file', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BackupTab />
      </QueryClientProvider>,
    );

    expect(await screen.findByText('备份与恢复')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '导出备份' }));
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/backup'),
    );

    const input = screen.getByLabelText('选择备份文件');
    await user.upload(
      input,
      new File(['zip'], 'backup.zip', { type: 'application/zip' }),
    );

    expect(await screen.findByText(/backup\.zip/)).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: '我确认覆盖当前数据' }));
    await user.click(screen.getByRole('button', { name: '确认恢复' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/restore',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(reload).toHaveBeenCalled();
  });

  it('clears data only after typing the confirmation', async () => {
    render(<DangerTab />);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '清空所有数据' }));
    const input = await screen.findByLabelText('输入“清空”确认');
    const confirmButton = screen.getByRole('button', { name: '确认清空' });
    expect(confirmButton).toBeDisabled();

    await user.type(input, '清空');
    await user.click(confirmButton);

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/data/clear',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
    expect(reload).toHaveBeenCalled();
  });
});
