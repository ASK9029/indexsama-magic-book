import { test, expect } from '@playwright/test';
import { localDate, weekdayFor } from './helpers';

test('starts a workout, completes a set, finishes and shows stats', async ({
  page,
  request,
}) => {
  const date = localDate();
  await request.put(`/api/fitness/plan/${weekdayFor(date)}`, {
    data: {
      name: 'E2E 推日',
      isRest: false,
      exercises: [
        {
          exerciseId: 'builtin-bench-press',
          targetSets: 1,
          targetReps: '8',
          sortOrder: 0,
        },
      ],
    },
  });

  await page.goto('/fitness?tab=today');
  await page.getByRole('button', { name: '开始训练' }).click();
  await expect(page).toHaveURL(/\/fitness\/session\//);

  await page.getByLabel('第 1 组重量').fill('60');
  await page.getByLabel('第 1 组次数').fill('8');
  await page.getByRole('checkbox', { name: '完成' }).first().click();
  await expect(
    page.getByRole('checkbox', { name: '完成' }).first(),
  ).toBeChecked();

  await page.getByRole('button', { name: '结束训练' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('训练时长（分钟）').fill('30');
  await dialog.getByRole('button', { name: '保存并结束' }).click();

  await page.goto('/fitness?tab=stats');
  await expect(page.getByText('总训练量')).toBeVisible();
  await expect(page.getByText('480 kg')).toBeVisible();
});
