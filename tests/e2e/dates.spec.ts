import { test, expect } from '@playwright/test';

test('date navigation keeps URL and future dates only allow planning', async ({
  page,
}) => {
  await page.goto('/diet');
  await expect(page.getByRole('button', { name: '前一天' })).toBeVisible();

  const dateInput = page.locator('input[type="date"]').first();
  await dateInput.fill('2026-11-01');
  await expect(page).toHaveURL(/date=2026-11-01/);

  await page.goto('/diet?date=2999-01-01');
  await expect(
    page.getByText('未来日期只能排计划。').first(),
  ).toBeVisible();

  await page.getByRole('button', { name: '今天' }).click();
  await expect(page).not.toHaveURL(/date=/);
});
