import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;
let subjectId: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-study-timer-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });

  const subject = await app.inject({
    method: 'POST',
    url: '/api/subjects',
    payload: { name: '数学', color: '#2F6B5E' },
  });
  subjectId = subject.json().id;
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('study timer and sessions', () => {
  it('starts, pauses, resumes, stops and records a session', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-09T08:00:00.000Z'));

    const started = await app.inject({
      method: 'POST',
      url: '/api/study/timer/start',
      payload: { subjectId },
    });
    expect(started.statusCode).toBe(200);
    expect(started.json().status).toBe('running');

    const duplicate = await app.inject({
      method: 'POST',
      url: '/api/study/timer/start',
      payload: { subjectId },
    });
    expect(duplicate.statusCode).toBe(409);
    expect(duplicate.json().error.code).toBe('TIMER_RUNNING');

    vi.setSystemTime(new Date('2026-11-09T08:00:30.000Z'));
    const paused = await app.inject({
      method: 'POST',
      url: '/api/study/timer/pause',
    });
    expect(paused.json().status).toBe('paused');
    expect(paused.json().accumulatedSeconds).toBe(30);

    vi.setSystemTime(new Date('2026-11-09T08:01:30.000Z'));
    const resumed = await app.inject({
      method: 'POST',
      url: '/api/study/timer/resume',
    });
    expect(resumed.json().status).toBe('running');

    vi.setSystemTime(new Date('2026-11-09T08:02:10.000Z'));
    const stopped = await app.inject({
      method: 'POST',
      url: '/api/study/timer/stop',
      payload: { note: '第三章' },
    });
    expect(stopped.statusCode).toBe(200);
    expect(stopped.json().session.durationMinutes).toBe(1);
    expect(stopped.json().session.note).toBe('第三章');
    expect(stopped.json().session.date).toBe('2026-11-09');

    const timer = await app.inject({ method: 'GET', url: '/api/study/timer' });
    expect(timer.json().status).toBe('idle');

    const sessions = await app.inject({
      method: 'GET',
      url: `/api/study/sessions?subjectId=${subjectId}`,
    });
    expect(sessions.json()).toHaveLength(1);

    const stats = await app.inject({
      method: 'GET',
      url: '/api/study/stats?week=2026-11-09',
    });
    expect(stats.json().totalMinutes).toBe(1);
    expect(stats.json().days).toHaveLength(7);
    expect(stats.json().bySubject[0].subjectId).toBe(subjectId);

    const manual = await app.inject({
      method: 'POST',
      url: '/api/study/sessions',
      payload: {
        subjectId,
        date: '2026-11-09',
        startAt: '2026-11-09T09:00:00.000Z',
        endAt: '2026-11-09T09:30:00.000Z',
        durationMinutes: 30,
        note: '补记',
      },
    });
    expect(manual.statusCode).toBe(201);

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/study/sessions/${manual.json().id}`,
      payload: { note: '改过的补记' },
    });
    expect(patched.json().note).toBe('改过的补记');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/study/sessions/${manual.json().id}`,
    });
    expect(deleted.statusCode).toBe(200);
  });

  it('does not create a session under one minute', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-10T08:00:00.000Z'));

    await app.inject({
      method: 'POST',
      url: '/api/study/timer/start',
      payload: { subjectId },
    });

    vi.setSystemTime(new Date('2026-11-10T08:00:30.000Z'));
    const stopped = await app.inject({
      method: 'POST',
      url: '/api/study/timer/stop',
      payload: {},
    });

    expect(stopped.statusCode).toBe(200);
    expect(stopped.json().session).toBeNull();

    const timer = await app.inject({ method: 'GET', url: '/api/study/timer' });
    expect(timer.json().status).toBe('idle');
  });
});
