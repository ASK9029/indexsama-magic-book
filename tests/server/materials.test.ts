import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtemp, rm, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';

let app: FastifyInstance;
let dir: string;
let subjectA: string;
let subjectB: string;

function multipartBody(
  fields: Record<string, string>,
  files: { name: string; mime: string; buffer: Buffer }[],
) {
  const boundary = '----life-material-boundary';
  const chunks: Buffer[] = [];

  for (const [name, value] of Object.entries(fields)) {
    chunks.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`,
      ),
    );
  }

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

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-materials-'));
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

describe('study materials', () => {
  it('creates link/note/file materials and filters them', async () => {
    const link = await app.inject({
      method: 'POST',
      url: '/api/materials/link',
      payload: {
        url: 'example.com',
        title: '线代讲义',
        subjectId: subjectA,
        tags: ['线代'],
        excerpt: '第一章',
      },
    });
    expect(link.statusCode).toBe(201);
    expect(link.json().url).toBe('https://example.com/');
    expect(link.json().type).toBe('link');

    const note = await app.inject({
      method: 'POST',
      url: '/api/materials/note',
      payload: {
        title: '英语笔记',
        body: '定语从句',
        subjectId: subjectA,
        tags: ['笔记'],
      },
    });
    expect(note.statusCode).toBe(201);
    expect(note.json().status).toBe('not_started');

    const { boundary, body } = multipartBody(
      { subjectId: subjectA, tags: '资料,PDF', status: 'learning' },
      [
        { name: 'a.pdf', mime: 'application/pdf', buffer: Buffer.from('pdf') },
        { name: 'b.txt', mime: 'text/plain', buffer: Buffer.from('txt') },
      ],
    );
    const uploaded = await app.inject({
      method: 'POST',
      url: '/api/materials/files',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    expect(uploaded.statusCode).toBe(201);
    expect(uploaded.json()).toHaveLength(2);
    expect(uploaded.json()[0].tags).toEqual(['资料', 'PDF']);

    const all = await app.inject({ method: 'GET', url: '/api/materials' });
    expect(all.json()).toHaveLength(4);

    const links = await app.inject({
      method: 'GET',
      url: '/api/materials?type=link',
    });
    expect(links.json()).toHaveLength(1);

    const otherSubject = await app.inject({
      method: 'GET',
      url: `/api/materials?subjectId=${subjectB}`,
    });
    expect(otherSubject.json()).toHaveLength(0);

    const searched = await app.inject({
      method: 'GET',
      url: '/api/materials?q=线代',
    });
    expect(searched.json()).toHaveLength(1);

    const learning = await app.inject({
      method: 'GET',
      url: '/api/materials?status=learning',
    });
    expect(learning.json()).toHaveLength(2);
  });

  it('links status/progress, counts study minutes and handles files', async () => {
    const link = await app.inject({
      method: 'POST',
      url: '/api/materials/link',
      payload: {
        url: 'https://example.org/lesson',
        title: '线代视频',
        subjectId: subjectA,
      },
    });
    const linkId = link.json().id as string;

    const completed = await app.inject({
      method: 'PATCH',
      url: `/api/materials/${linkId}`,
      payload: { progress: 100 },
    });
    expect(completed.json().status).toBe('completed');
    expect(completed.json().progress).toBe(100);

    const note = await app.inject({
      method: 'POST',
      url: '/api/materials/note',
      payload: { title: '纯笔记', body: '正文', subjectId: subjectA },
    });
    const notePatched = await app.inject({
      method: 'PATCH',
      url: `/api/materials/${note.json().id}`,
      payload: { status: 'completed', progress: 80 },
    });
    expect(notePatched.json().status).toBe('not_started');
    expect(notePatched.json().progress).toBe(0);

    const session = await app.inject({
      method: 'POST',
      url: '/api/study/sessions',
      payload: {
        subjectId: subjectA,
        materialId: linkId,
        date: '2026-11-09',
        startAt: '2026-11-09T09:00:00.000Z',
        endAt: '2026-11-09T09:30:00.000Z',
        durationMinutes: 30,
      },
    });
    expect(session.statusCode).toBe(201);

    const detail = await app.inject({
      method: 'GET',
      url: `/api/materials/${linkId}`,
    });
    expect(detail.json().totalStudyMinutes).toBe(30);

    const { boundary, body } = multipartBody(
      { subjectId: subjectA },
      [{ name: 'c.pdf', mime: 'application/pdf', buffer: Buffer.from('pdf-c') }],
    );
    const uploaded = await app.inject({
      method: 'POST',
      url: '/api/materials/files',
      headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
      payload: body,
    });
    const fileMaterial = uploaded.json()[0];
    const fileDetail = await app.inject({
      method: 'GET',
      url: `/api/materials/${fileMaterial.id}`,
    });
    expect(fileDetail.json().fileMissing).toBe(false);

    await unlink(app.fileService.pathFor(fileMaterial.fileId));

    const missing = await app.inject({
      method: 'GET',
      url: `/api/materials/${fileMaterial.id}`,
    });
    expect(missing.json().fileMissing).toBe(true);

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/api/materials/${fileMaterial.id}`,
    });
    expect(deleted.statusCode).toBe(200);

    const gone = await app.inject({
      method: 'GET',
      url: `/api/materials/${fileMaterial.id}`,
    });
    expect(gone.statusCode).toBe(404);
  });
});
