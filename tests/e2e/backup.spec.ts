import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { localDate } from './helpers';

test('exports a full backup and restores it', async ({ page, request }) => {
  const date = localDate();
  await request.post('/api/tasks', {
    data: {
      date,
      title: 'E2E 备份事项',
      category: 'work',
      priority: 'medium',
    },
  });

  await page.goto('/settings?tab=backup');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出备份' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('我的生活-备份');
  const backupPath = await download.path();
  expect(backupPath).not.toBeNull();

  await page.getByLabel('选择备份文件').setInputFiles({
    name: 'backup.zip',
    mimeType: 'application/zip',
    buffer: await readFile(backupPath!),
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('backup.zip');
  await dialog
    .getByRole('checkbox', { name: '我确认覆盖当前数据' })
    .check();
  await dialog.getByRole('button', { name: '确认恢复' }).click();

  await page.goto('/today');
  await expect(page.getByText('E2E 备份事项').first()).toBeVisible();
});
