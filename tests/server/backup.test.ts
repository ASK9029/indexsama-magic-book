import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWriteStream } from 'node:fs';
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import archiver from 'archiver';
import * as yauzl from 'yauzl';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/server/app';
import { toLocalDate } from '../../src/shared/dates';

let app: FastifyInstance;
let dir: string;
let backupBuffer: Buffer;
let materialFileId: string;
let coverFileId: string;

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

async function readZip(buffer: Buffer): Promise<Map<string, Buffer>> {
  const workDir = await mkdtemp(join(tmpdir(), 'life-ziptest-'));
  const zipPath = join(workDir, 'test.zip');
  await writeFile(zipPath, buffer);
  const entries = new Map<string, Buffer>();

  await new Promise<void>((resolve, reject) => {
    yauzl.open(zipPath, { lazyEntries: true }, (error, zip) => {
      if (error || !zip) {
        reject(error);
        return;
      }
      zip.on('error', reject);
      zip.on('end', resolve);
      zip.on('entry', (entry) => {
        if (entry.fileName.endsWith('/')) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError || !stream) {
            reject(streamError);
            return;
          }
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => {
            entries.set(entry.fileName, Buffer.concat(chunks));
            zip.readEntry();
          });
          stream.on('error', reject);
        });
      });
      zip.readEntry();
    });
  });

  await rm(workDir, { recursive: true, force: true });
  return entries;
}

async function uploadZip(buffer: Buffer) {
  const boundary = '----restoreboundary';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="backup.zip"\r\nContent-Type: application/zip\r\n\r\n`,
    ),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return app.inject({
    method: 'POST',
    url: '/api/restore',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: body,
  });
}

async function uploadMaterialFile(subjectId: string) {
  const boundary = '----materialboundary';
  const pdf = Buffer.from('%PDF-1.4\nbackup test\n%%EOF');
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="subjectId"\r\n\r\n${subjectId}\r\n--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="notes.pdf"\r\nContent-Type: application/pdf\r\n\r\n`,
    ),
    pdf,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return app.inject({
    method: 'POST',
    url: '/api/materials/files',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: body,
  });
}

async function uploadCover(gameId: string) {
  const boundary = '----coverboundary';
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="cover.png"\r\nContent-Type: image/png\r\n\r\n`,
    ),
    PNG,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);
  return app.inject({
    method: 'POST',
    url: `/api/games/${gameId}/cover`,
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    payload: body,
  });
}

async function makeVersionZip(formatVersion: number): Promise<Buffer> {
  const workDir = await mkdtemp(join(tmpdir(), 'life-versionzip-'));
  const zipPath = join(workDir, 'backup.zip');
  const output = createWriteStream(zipPath);
  const archive = archiver('zip');

  const closed = new Promise<void>((resolve, reject) => {
    output.on('close', () => resolve());
    output.on('error', reject);
  });

  archive.pipe(output);
  archive.append(
    JSON.stringify({
      formatVersion,
      appVersion: '9.9.9',
      createdAt: new Date().toISOString(),
      counts: {},
    }),
    { name: 'manifest.json' },
  );
  await archive.finalize();
  await closed;

  const buffer = await readFile(zipPath);
  await rm(workDir, { recursive: true, force: true });
  return buffer;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'life-backup-'));
  app = await buildApp({ dataDir: dir, dbPath: join(dir, 'app.db'), logger: false });

  await app.inject({
    method: 'POST',
    url: '/api/tasks',
    payload: {
      date: toLocalDate(new Date()),
      title: '备份测试任务',
      category: 'work',
      priority: 'medium',
    },
  });

  const subject = await app.inject({
    method: 'POST',
    url: '/api/subjects',
    payload: { name: '数学', color: '#2F6B5E' },
  });

  const material = await uploadMaterialFile(subject.json().id);
  materialFileId = material.json()[0].fileId;

  const game = await app.inject({
    method: 'POST',
    url: '/api/games',
    payload: { title: 'Hades', platform: 'PC' },
  });
  const cover = await uploadCover(game.json().id);
  coverFileId = cover.json().coverFileId;

  const backup = await app.inject({ method: 'GET', url: '/api/backup' });
  expect(backup.statusCode).toBe(200);
  backupBuffer = backup.rawPayload;
});

afterAll(async () => {
  await app?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('backup, clear and restore', () => {
  it('produces a zip with manifest, app.db and files', async () => {
    const headers = (
      await app.inject({ method: 'GET', url: '/api/backup' })
    ).headers;
    expect(headers['content-type']).toContain('application/zip');
    expect(headers['content-disposition']).toContain('attachment');

    const entries = await readZip(backupBuffer);
    expect(entries.has('manifest.json')).toBe(true);
    expect(entries.has('app.db')).toBe(true);
    expect([...entries.keys()].some((key) => key.startsWith('files/'))).toBe(
      true,
    );

    const manifest = JSON.parse(entries.get('manifest.json')!.toString('utf8'));
    expect(manifest.formatVersion).toBe(1);
    expect(manifest.counts.tasks).toBe(1);
    expect(manifest.counts.subjects).toBe(1);
    expect(manifest.counts.materials).toBe(1);
    expect(manifest.counts.games).toBe(1);
  });

  it('clears all data and restores the backup including files', async () => {
    const cleared = await app.inject({
      method: 'POST',
      url: '/api/data/clear',
      payload: { confirm: '清空' },
    });
    expect(cleared.statusCode).toBe(200);

    const empty = await app.inject({ method: 'GET', url: '/api/data/info' });
    expect(empty.json().counts.tasks).toBe(0);
    expect(empty.json().counts.subjects).toBe(0);
    expect(empty.json().counts.games).toBe(0);
    expect(empty.json().lastBackupAt).toBeNull();
    expect(app.fileService.exists(materialFileId)).toBe(false);
    expect(app.fileService.exists(coverFileId)).toBe(false);

    const restored = await uploadZip(backupBuffer);
    expect(restored.statusCode).toBe(200);
    expect(restored.json().manifest.counts.tasks).toBe(1);

    const info = await app.inject({ method: 'GET', url: '/api/data/info' });
    expect(info.json().counts.tasks).toBe(1);
    expect(info.json().counts.subjects).toBe(1);
    expect(info.json().counts.materials).toBe(1);
    expect(info.json().counts.games).toBe(1);

    expect(app.fileService.exists(materialFileId)).toBe(true);
    expect(app.fileService.exists(coverFileId)).toBe(true);

    const backups = await readdir(join(dir, 'backups'));
    expect(
      backups.some(
        (name) => name.startsWith('pre-restore-') && name.endsWith('.zip'),
      ),
    ).toBe(true);
  });

  it('rejects a broken zip without changing data', async () => {
    const broken = await uploadZip(Buffer.from('not a zip'));
    expect(broken.statusCode).toBe(400);

    const info = await app.inject({ method: 'GET', url: '/api/data/info' });
    expect(info.json().counts.tasks).toBe(1);
  });

  it('rejects a newer backup format without changing data', async () => {
    const zipped = await makeVersionZip(2);
    const response = await uploadZip(zipped);
    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('BACKUP_VERSION');

    const info = await app.inject({ method: 'GET', url: '/api/data/info' });
    expect(info.json().counts.tasks).toBe(1);
  });
});
