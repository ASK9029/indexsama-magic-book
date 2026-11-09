import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfirmProvider } from '../../src/client/components/ui/Confirm';
import { FoodLibraryPage } from '../../src/client/features/diet/FoodLibraryPage';
import type { Food } from '../../src/shared/types';

afterEach(() => vi.unstubAllGlobals());

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const rice: Food = {
  id: 'food-rice',
  name: '米饭',
  category: '主食',
  unit: 'g',
  per100Calories: 116,
  per100Protein: 2.6,
  servingName: '一碗',
  servingAmount: 150,
  builtIn: true,
};

describe('food library page', () => {
  it('lists foods and creates a custom food', async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        const method = init?.method ?? 'GET';

        if (url === '/api/foods' && method === 'GET') return json([rice]);
        if (url === '/api/foods' && method === 'POST') {
          return json(
            {
              ...rice,
              id: 'food-custom',
              name: '测试食物',
              builtIn: false,
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
        <ConfirmProvider>
          <FoodLibraryPage />
        </ConfirmProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('米饭')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '新增自定义食物' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.type(screen.getByLabelText('名称'), '测试食物');
    await user.type(screen.getByLabelText('每 100 热量（kcal）'), '120');
    await user.type(screen.getByLabelText('每 100 蛋白质（g）'), '10');
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/foods',
        expect.objectContaining({ method: 'POST' }),
      ),
    );
  });
});
