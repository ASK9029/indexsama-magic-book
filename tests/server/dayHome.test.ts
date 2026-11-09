import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';
import { toLocalDate } from '../../src/shared/dates';

let app: FastifyInstance;
let dir: string;
const date = toLocalDate(new Date());

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-dayhome-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });

  await app.inject({
    method: 'POST',
    url: '/api/tasks',
    payload: {
      date,
      title: '测试手动事项',
      category: 'work',
      priority: 'high',
    },
  });

  const subject = await app.inject({
    method: 'POST',
    url: '/api/subjects',
    payload: { name: '数学', color: '#2F6B5E' },
  });

  await app.dbManager
    .get()
    .prepare(
      'INSERT INTO study_arrangements(id, subject_id, date, content, planned_minutes, done, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run('arr-1', subject.json().id, date, '线代 1 小时', 60, 1, new Date().toISOString());

  await app.inject({
    method: 'POST',
    url: '/api/diet/entries',
    payload: {
      date,
      meal: 'lunch',
      kind: 'plan',
      foodId: 'food-rice',
      amount: 100,
      unit: 'g',
    },
  });

  await app.dbManager
    .get()
    .prepare(
      'INSERT INTO workout_sessions(id, date, name, status, start_at, end_at, duration_minutes, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      'sess-1',
      date,
      '推日',
      'completed',
      `${date}T18:00:00`,
      `${date}T18:45:00`,
      45,
      '',
    );

  await app.inject({
    method: 'POST',
    url: '/api/memos',
    payload: { text: '测试备忘' },
  });

  await app.inject({
    method: 'POST',
    url: '/api/games',
    payload: { title: '在玩游戏', platform: 'PC', status: 'playing' },
  });
  await app.inject({
    method: 'POST',
    url: '/api/games',
    payload: { title: '通关游戏', platform: 'PC', status: 'completed' },
  });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('day and home aggregation', () => {
  it('aggregates the day and computes progress 2/4', async () => {
    const response = await app.inject({
      method: 'GET',
      url: `/api/day/${date}`,
    });
    expect(response.statusCode).toBe(200);
    const day = response.json();

    expect(day.tasks).toHaveLength(1);
    expect(day.tasks[0].done).toBe(false);
    expect(day.study.arrangements).toHaveLength(1);
    expect(day.study.arrangements[0].done).toBe(true);
    expect(day.study.arrangements[0].actualMinutes).toBe(0);
    expect(day.fitness.session.status).toBe('completed');
    expect(day.diet.meals).toHaveLength(4);
    const lunch = day.diet.meals.find(
      (meal: { meal: string }) => meal.meal === 'lunch',
    );
    expect(lunch.planned).toBe(true);
    expect(lunch.plannedCalories).toBeCloseTo(116);
    expect(lunch.done).toBe(false);
    expect(day.progress).toEqual({ done: 2, total: 4 });
  });

  it('aggregates home items and summaries', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/home' });
    expect(response.statusCode).toBe(200);
    const home = response.json();

    expect(home.progress).toEqual({ done: 2, total: 4 });
    expect(home.items.length).toBeLessThanOrEqual(5);
    expect(home.items).toHaveLength(4);
    expect(home.items[0].title).toBe('测试手动事项');
    expect(home.memos.some((memo: { text: string }) => memo.text === '测试备忘')).toBe(
      true,
    );
    expect(home.studySummary.arrangements).toBe(1);
    expect(home.studySummary.minutes).toBe(0);
    expect(home.fitnessSummary.completed).toBe(true);
    expect(home.fitnessSummary.minutes).toBe(45);
    expect(home.dietSummary.calories).toBe(0);
    expect(home.gameSummary.playing).toBe(1);
    expect(home.gameSummary.completed).toBe(1);
  });
});
