import { test, expect } from '@playwright/test';

test('all module pages load and a game can be added and clocked', async ({
  page,
}) => {
  await page.goto('/');

  const routes: Array<[string, string]> = [
    ['学习科目', '学习科目'],
    ['学习资料', '学习资料'],
    ['健身计划', '健身计划'],
    ['饮食计划', '饮食计划'],
    ['游戏娱乐', '游戏娱乐'],
    ['数据与设置', '数据与设置'],
  ];

  for (const [label, heading] of routes) {
    await page.getByRole('link', { name: label }).click();
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }

  await page.getByRole('link', { name: '游戏娱乐' }).click();
  await page.getByRole('button', { name: '添加游戏' }).click();
  await page.getByLabel('标题').fill('E2E 游戏');
  await page.getByRole('button', { name: '保存' }).click();

  await page.getByText('E2E 游戏').first().click();
  await expect(page.getByRole('heading', { name: 'E2E 游戏' })).toBeVisible();
  await page.getByRole('button', { name: '+30 分钟' }).click();
  await expect(page.getByText(/30 分钟/).first()).toBeVisible();
});
