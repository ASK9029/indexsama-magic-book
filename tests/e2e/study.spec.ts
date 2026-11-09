import { test, expect } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

test('subject, study arrangement, timer and check-in photos', async ({
  page,
}) => {
  await page.goto('/study/subjects');

  await page.getByRole('button', { name: '新增科目' }).click();
  await page.getByLabel('科目名称').fill('E2E 学习科目');
  await page.getByRole('button', { name: '保存' }).click();
  await expect(
    page.getByRole('link', { name: 'E2E 学习科目' }),
  ).toBeVisible();

  await page.getByRole('button', { name: '添加安排' }).click();
  await page.getByLabel('学习内容').fill('E2E 线代');
  await page.getByRole('dialog').getByRole('button', { name: '保存' }).click();
  await expect(page.getByText('E2E 线代').first()).toBeVisible();

  await page.getByRole('link', { name: 'E2E 学习科目' }).click();
  await expect(
    page.getByRole('heading', { name: 'E2E 学习科目' }),
  ).toBeVisible();

  await page.getByRole('button', { name: '开始学习' }).click();
  await expect(page.getByRole('button', { name: '暂停' })).toBeVisible();
  await page.getByRole('button', { name: '结束' }).click();

  const input = page.locator('input[type="file"]');
  await input.setInputFiles([
    { name: 'a.png', mimeType: 'image/png', buffer: PNG },
    { name: 'b.png', mimeType: 'image/png', buffer: PNG },
  ]);
  await expect(page.getByText('打卡照片已上传')).toBeVisible();
  await expect(page.getByText('2 张').first()).toBeVisible();
});
