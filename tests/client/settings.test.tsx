import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SettingsPage } from '../../src/client/features/settings/SettingsPage';

const { update } = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock('../../src/client/hooks/useSettings', () => ({
  useSettings: () => ({
    settings: {
      theme: 'light',
      weekStart: 1,
      weightUnit: 'kg',
      calorieTarget: null,
      proteinTarget: null,
      waterTarget: null,
      lastBackupAt: null,
    },
    isLoading: false,
    update,
  }),
}));

describe('settings appearance', () => {
  it('applies dark theme when selected', async () => {
    render(
      <MemoryRouter initialEntries={['/settings?tab=appearance']}>
        <SettingsPage />
      </MemoryRouter>,
    );

    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText('主题'), 'dark');

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(update).toHaveBeenCalledWith({ theme: 'dark' });
  });
});
