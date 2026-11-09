import { test, expect } from '@playwright/test';

test('navigation, task and memo persistence, theme', async ({ page }) => {
  await page.goto('/');

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
    await expect(page.getByRole('link', { name: label })).toBeVisible();
  }

  await page.getByRole('button', { name: /加一件事/ }).click();
  await page.getByLabel('标题').fill('E2E 事项');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '添加', exact: true })
    .click();
  await expect(page.getByText('E2E 事项').first()).toBeVisible();

  const memoInput = page.getByPlaceholder('记点什么，比如：买牛奶');
  await memoInput.fill('E2E 备忘');
  await memoInput.press('Enter');
  await expect(page.getByText('E2E 备忘').first()).toBeVisible();

  await page.reload();
  await expect(page.getByText('E2E 事项').first()).toBeVisible();
  await expect(page.getByText('E2E 备忘').first()).toBeVisible();

  await page.goto('/settings?tab=appearance');
  await page.getByLabel('主题').selectOption('dark');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});
