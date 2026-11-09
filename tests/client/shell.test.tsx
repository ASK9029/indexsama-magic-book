import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom';
import { routes } from '../../src/client/router';

function TestRoutes() {
  return useRoutes(routes);
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

describe('app shell', () => {
  it('shows 8 nav entries and switches route', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <TestRoutes />
        <LocationProbe />
      </MemoryRouter>,
    );

    for (const label of [
      '首页',
      '今日计划',
      '学习科目',
      '学习资料',
      '健身计划',
      '饮食计划',
      '游戏娱乐',
      '数据与设置',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }

    const user = userEvent.setup();
    await user.click(screen.getByRole('link', { name: '今日计划' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/today');
  });
});
