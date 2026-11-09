import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PreferencesTab } from '../../src/client/features/settings/PreferencesTab';
import type { Settings } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const settings: Settings = {
  theme: 'light',
  weekStart: 1,
  weightUnit: 'kg',
  calorieTarget: null,
  proteinTarget: null,
  waterTarget: null,
  lastBackupAt: null,
};

describe('settings preferences', () => {
  it('saves week start, weight unit, targets and protein reference', async () => {
    const update = vi.fn();
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL): Promise<Response> => {
        const url = String(input);
        if (url === '/api/settings/protein-reference') {
          return json({ proteinTarget: 112 });
        }
        return json({ ok: true });
      },
    );
    vi.stubGlobal('fetch', fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <PreferencesTab settings={settings} update={update} />
      </QueryClientProvider>,
    );

    const user = userEvent.setup();

    await user.selectOptions(screen.getByLabelText('每周起始日'), '0');
    expect(update).toHaveBeenCalledWith({ weekStart: 0 });

    await user.selectOptions(screen.getByLabelText('体重单位'), 'jin');
    expect(update).toHaveBeenCalledWith({ weightUnit: 'jin' });

    const calorie = screen.getByLabelText('每日热量目标（kcal）');
    await user.type(calorie, '1800');
    await user.tab();
    expect(update).toHaveBeenCalledWith({ calorieTarget: 1800 });

    await user.click(screen.getByRole('button', { name: '按体重建参考值' }));
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith({ proteinTarget: 112 }),
    );
  });
});
