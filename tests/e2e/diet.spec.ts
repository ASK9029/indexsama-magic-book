import { test, expect } from '@playwright/test';

test('adds an actual meal, water and a custom food', async ({ page }) => {
  await page.goto('/diet');

  const lunch = page.locator('section').filter({ hasText: '午餐' }).first();
  await lunch.getByRole('button', { name: '加食物' }).click();

  const drawer = page.getByRole('dialog');
  await expect(drawer).toContainText('添加食物');
  await drawer.getByText('米饭').first().click();
  await drawer.getByLabel('分量').fill('100');
  await drawer.getByRole('button', { name: '添加' }).click();

  await expect(page.getByText('116 kcal').first()).toBeVisible();

  await page.getByRole('button', { name: '+250' }).click();
  await expect(page.getByText('250 ml').first()).toBeVisible();

  await page.getByRole('tab', { name: '食物库' }).click();
  await expect(page.getByText('米饭').first()).toBeVisible();
  await page.getByRole('button', { name: '新增自定义食物' }).click();
  await page.getByLabel('名称', { exact: true }).fill('E2E 食物');
  await page.getByLabel('每 100 热量（kcal）').fill('100');
  await page.getByLabel('每 100 蛋白质（g）').fill('10');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('E2E 食物').first()).toBeVisible();
});

