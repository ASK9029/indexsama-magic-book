import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';
import { toLocalDate } from '../../src/shared/dates';

let app: FastifyInstance;
let dir: string;

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

function multipartBody(): { boundary: string; body: Buffer } {
  const boundary = '----gamecoverboundary';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="cover.png"\r\nContent-Type: image/png\r\n\r\n`,
    ),
    PNG,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return { boundary, body };
}

async function uploadCover(id: string) {
  const { boundary, body } = multipartBody();
  return app.inject({
    method: 'POST',
    url: `/api/games/${id}/cover`,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
    },
    payload: body,
  });
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-games-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('games', () => {
  it('applies status date rules and accumulates playtime', async () => {
    const today = toLocalDate(new Date());
    const created = await app.inject({
      method: 'POST',
      url: '/api/games',
      payload: { title: 'Hades', platform: 'PC', status: 'wishlist' },
    });
    expect(created.statusCode).toBe(201);
    const id = created.json().id;
    expect(created.json().startDate).toBeNull();
    expect(created.json().finishDate).toBeNull();

    const playing = await app.inject({
      method: 'PATCH',
      url: `/api/games/${id}`,
      payload: { status: 'playing' },
    });
    expect(playing.json().startDate).toBe(today);
    expect(playing.json().finishDate).toBeNull();

    const paused = await app.inject({
      method: 'PATCH',
      url: `/api/games/${id}`,
      payload: { status: 'paused' },
    });
    expect(paused.json().startDate).toBe(today);

    const completed = await app.inject({
      method: 'PATCH',
      url: `/api/games/${id}`,
      payload: { status: 'completed' },
    });
    expect(completed.json().finishDate).toBe(today);

    const wishlist = await app.inject({
      method: 'PATCH',
      url: `/api/games/${id}`,
      payload: { status: 'wishlist' },
    });
    expect(wishlist.json().startDate).toBeNull();
    expect(wishlist.json().finishDate).toBeNull();

    const explicit = await app.inject({
      method: 'PATCH',
      url: `/api/games/${id}`,
      payload: {
        status: 'playing',
        startDate: '2026-01-02',
        finishDate: '2026-02-03',
      },
    });
    expect(explicit.json().startDate).toBe('2026-01-02');
    expect(explicit.json().finishDate).toBe('2026-02-03');

    await app.inject({
      method: 'PATCH',
      url: `/api/games/${id}`,
      payload: { status: 'wishlist' },
    });

    const add30 = await app.inject({
      method: 'POST',
      url: `/api/games/${id}/playtime`,
      payload: { minutes: 30 },
    });
    expect(add30.json().playtimeMinutes).toBe(30);
    const add60 = await app.inject({
      method: 'POST',
      url: `/api/games/${id}/playtime`,
      payload: { minutes: 30 },
    });
    expect(add60.json().playtimeMinutes).toBe(60);
  });

  it('aggregates game stats', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/games',
      payload: { title: 'Celeste', platform: 'Switch', status: 'completed' },
    });
    await app.inject({
      method: 'POST',
      url: '/api/games',
      payload: { title: 'Hollow Knight', platform: 'PC', status: 'playing' },
    });

    const stats = await app.inject({ method: 'GET', url: '/api/games/stats' });
    expect(stats.statusCode).toBe(200);
    const data = stats.json();
    expect(data.playing).toBe(1);
    expect(data.wishlist).toBe(1);
    expect(data.completed).toBe(1);
    expect(data.paused).toBe(0);
    expect(data.totalMinutes).toBe(60);
    expect(data.completedThisYear).toBe(1);
    expect(data.recentCompleted[0].title).toBe('Celeste');
    expect(data.currentPlaying.title).toBe('Hollow Knight');
  });

  it('uploads and deletes covers with the game', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/games',
      payload: { title: 'Cover Game', platform: 'PC' },
    });
    const id = created.json().id;

    const uploaded = await uploadCover(id);
    expect(uploaded.statusCode).toBe(200);
    const coverFileId = uploaded.json().coverFileId;
    expect(coverFileId).toBeTruthy();
    expect(uploaded.json().coverUrl).toBe(`/api/files/${coverFileId}`);
    expect(app.fileService.exists(coverFileId)).toBe(true);

    const detail = await app.inject({ method: 'GET', url: `/api/games/${id}` });
    expect(detail.json().coverUrl).toBe(`/api/files/${coverFileId}`);

    const deletedCover = await app.inject({
      method: 'DELETE',
      url: `/api/games/${id}/cover`,
    });
    expect(deletedCover.json().coverFileId).toBeNull();
    expect(app.fileService.exists(coverFileId)).toBe(false);

    const reuploaded = await uploadCover(id);
    const secondCover = reuploaded.json().coverFileId;
    expect(app.fileService.exists(secondCover)).toBe(true);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/games/${id}`,
    });
    expect(deleted.statusCode).toBe(200);
    expect(app.fileService.exists(secondCover)).toBe(false);
  });
});
