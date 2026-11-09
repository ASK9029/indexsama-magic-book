import { test, expect } from '@playwright/test';
import { localDate, weekdayFor } from './helpers';

test('home shows max 5 items while today shows all groups and carry-over', async ({
  page,
  request,
}) => {
  const date = localDate();
  const previous = localDate(-1);

  const subjectResponse = await request.post('/api/subjects', {
    data: { name: 'E2E 数学', color: '#2F6B5E' },
  });
  const subjectId = (await subjectResponse.json()).id;
  await request.post('/api/study/arrangements', {
    data: {
      subjectId,
      date,
      content: 'E2E 线代',
      plannedMinutes: 30,
    },
  });
  await request.post('/api/diet/entries', {
    data: {
      date,
      meal: 'lunch',
      kind: 'plan',
      foodId: 'food-rice',
      amount: 100,
      unit: 'g',
    },
  });
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
  await request.post('/api/tasks', {
    data: {
      date: previous,
      title: 'E2E 昨日未完成',
      category: 'work',
      priority: 'medium',
    },
  });

  await page.goto('/today');
  for (let index = 1; index <= 6; index += 1) {
    await page.getByRole('button', { name: '添加事项' }).click();
    await page.getByLabel('标题').fill(`E2E 事项 ${index}`);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: '添加', exact: true })
      .click();
    await expect(page.getByText(`E2E 事项 ${index}`).first()).toBeVisible();
  }

  await page.goto('/');
  const todayCard = page
    .locator('section')
    .filter({ hasText: '今日计划' })
    .first();
  const homeTaskCount = await todayCard.getByText(/E2E 事项 \d/).count();
  expect(homeTaskCount).toBeGreaterThan(0);
  expect(homeTaskCount).toBeLessThanOrEqual(5);

  await page.goto(`/today?date=${date}`);
  await expect(page.getByText(/E2E 事项 \d/)).toHaveCount(6);
  await expect(page.getByText('E2E 线代')).toBeVisible();
  await expect(page.getByText('E2E 推日').first()).toBeVisible();
  await expect(page.getByText('午餐')).toBeVisible();

  await expect(page.getByText('昨天还有 1 件未完成')).toBeVisible();
  await page.getByRole('button', { name: '全部顺延' }).click();
  await expect(page.getByText('E2E 昨日未完成').first()).toBeVisible();

  const fitnessGroup = page
    .locator('section')
    .filter({ hasText: '健身' })
    .first();
  await expect(fitnessGroup.getByRole('link', { name: '去训练' })).toBeVisible();
  await expect(fitnessGroup.getByRole('checkbox')).toHaveCount(0);
});
