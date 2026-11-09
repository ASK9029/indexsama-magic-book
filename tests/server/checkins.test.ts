import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { toLocalDate } from '../../src/shared/dates';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;
let subjectA: string;
let subjectB: string;
const date = toLocalDate(new Date());

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

function multipartBody(dateValue: string, files: { name: string; mime: string; buffer: Buffer }[]) {
  const boundary = '----life-test-boundary';
  const chunks: Buffer[] = [
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="date"\r\n\r\n${dateValue}\r\n`,
    ),
  ];

  for (const file of files) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${file.name}"\r\nContent-Type: ${file.mime}\r\n\r\n`,
      ),
      file.buffer,
      Buffer.from('\r\n'),
    );
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(chunks) };
}

async function upload(
  subjectId: string,
  dateValue: string,
  files: { name: string; mime: string; buffer: Buffer }[],
) {
  const { boundary, body } = multipartBody(dateValue, files);
  return app.inject({
    method: 'POST',
    url: `/api/subjects/${subjectId}/checkins`,
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: body,
  });
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-checkins-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });

  const a = await app.inject({
    method: 'POST',
    url: '/api/subjects',
    payload: { name: '数学', color: '#2F6B5E' },
  });
  subjectA = a.json().id;

  const b = await app.inject({
    method: 'POST',
    url: '/api/subjects',
    payload: { name: '英语', color: '#D97757' },
  });
  subjectB = b.json().id;
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('check-in albums', () => {
  it('uploads two photos, isolates subjects, serves and deletes files', async () => {
    const uploaded = await upload(subjectA, date, [
      { name: 'a.png', mime: 'image/png', buffer: png },
      { name: 'b.png', mime: 'image/png', buffer: png },
    ]);
    expect(uploaded.statusCode).toBe(201);
    expect(uploaded.json()).toHaveLength(2);
    expect(uploaded.json().map((photo: { sortOrder: number }) => photo.sortOrder)).toEqual([
      0, 1,
    ]);

    const summary = await app.inject({
      method: 'GET',
      url: `/api/subjects/${subjectA}/checkins`,
    });
    expect(summary.json().days).toBe(1);
    expect(summary.json().totalPhotos).toBe(2);

    const folder = join(dir, 'files', 'checkins', subjectA, date);
    const files = await readdir(folder);
    expect(files).toHaveLength(2);

    const other = await upload(subjectB, date, [
      { name: 'c.png', mime: 'image/png', buffer: png },
    ]);
    expect(other.statusCode).toBe(201);

    const otherSummary = await app.inject({
      method: 'GET',
      url: `/api/subjects/${subjectB}/checkins`,
    });
    expect(otherSummary.json().totalPhotos).toBe(1);

    const fileResponse = await app.inject({
      method: 'GET',
      url: `/api/files/${uploaded.json()[0].fileId}`,
    });
    expect(fileResponse.statusCode).toBe(200);
    expect(fileResponse.headers['content-type']).toContain('image/png');
    expect(fileResponse.rawPayload.equals(png)).toBe(true);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/checkins/${uploaded.json()[0].id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const afterDelete = await app.inject({
      method: 'GET',
      url: `/api/subjects/${subjectA}/checkins`,
    });
    expect(afterDelete.json().totalPhotos).toBe(1);
    expect(await readdir(folder)).toHaveLength(1);
  });

  it('rejects future dates and non-image files', async () => {
    const future = await upload(subjectA, '2999-01-01', [
      { name: 'a.png', mime: 'image/png', buffer: png },
    ]);
    expect(future.statusCode).toBe(400);
    expect(future.json().error.code).toBe('FUTURE_DATE');

    const text = await upload(subjectA, date, [
      { name: 'a.txt', mime: 'text/plain', buffer: Buffer.from('hello') },
    ]);
    expect(text.statusCode).toBe(400);
    expect(text.json().error.code).toBe('INVALID_FILE_TYPE');
  });
});
