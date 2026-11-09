import { randomUUID } from 'node:crypto';
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
} from 'node:fs';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { DatabaseSync } from 'node:sqlite';
import type { FileRecord } from '@shared/types';

interface FileRow {
  id: string;
  original_name: string;
  stored_path: string;
  mime: string;
  size: number;
  kind: FileRecord['kind'];
  created_at: string;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

function extensionFor(originalName: string, mime: string): string {
  const extension = path.extname(originalName).toLowerCase();
  if (/^\.[a-z0-9]{1,10}$/.test(extension)) return extension;
  return EXTENSION_BY_MIME[mime] ?? '.bin';
}

function toRecord(row: FileRow): FileRecord {
  return {
    id: row.id,
    originalName: row.original_name,
    mime: row.mime,
    size: row.size,
    kind: row.kind,
    createdAt: row.created_at,
  };
}

export class FileService {
  private readonly root: string;

  constructor(
    private readonly getDb: () => DatabaseSync,
    root: string,
  ) {
    this.root = path.resolve(root);
    mkdirSync(this.root, { recursive: true });
  }

  private resolveSafe(relativePath: string): string {
    const absolute = path.resolve(this.root, relativePath);
    if (
      absolute !== this.root &&
      !absolute.startsWith(`${this.root}${path.sep}`)
    ) {
      throw new Error('INVALID_FILE_PATH');
    }
    return absolute;
  }

  async save(
    buffer: Buffer,
    originalName: string,
    mime: string,
    kind: FileRecord['kind'],
    subdir: string,
  ): Promise<FileRecord> {
    const id = randomUUID();
    const extension = extensionFor(originalName, mime);
    const relativePath = path.join(subdir, `${id}${extension}`);
    const absolutePath = this.resolveSafe(relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);

    const now = new Date().toISOString();
    this.getDb()
      .prepare(
        'INSERT INTO files(id, original_name, stored_path, mime, size, kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        id,
        originalName,
        relativePath,
        mime,
        buffer.length,
        kind,
        now,
      );

    return {
      id,
      originalName,
      mime,
      size: buffer.length,
      kind,
      createdAt: now,
    };
  }

  async saveStream(
    stream: Readable,
    originalName: string,
    mime: string,
    kind: FileRecord['kind'],
    subdir: string,
  ): Promise<FileRecord> {
    const id = randomUUID();
    const extension = extensionFor(originalName, mime);
    const relativePath = path.join(subdir, `${id}${extension}`);
    const absolutePath = this.resolveSafe(relativePath);

    await mkdir(path.dirname(absolutePath), { recursive: true });

    let size = 0;
    const counter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        size += chunk.length;
        callback(null, chunk);
      },
    });

    await pipeline(stream, counter, createWriteStream(absolutePath));

    const now = new Date().toISOString();
    this.getDb()
      .prepare(
        'INSERT INTO files(id, original_name, stored_path, mime, size, kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      )
      .run(id, originalName, relativePath, mime, size, kind, now);

    return { id, originalName, mime, size, kind, createdAt: now };
  }

  get(fileId: string): FileRecord | null {
    const row = this.getDb()
      .prepare(
        'SELECT id, original_name, stored_path, mime, size, kind, created_at FROM files WHERE id = ?',
      )
      .get(fileId) as unknown as FileRow | undefined;
    return row ? toRecord(row) : null;
  }

  pathFor(fileId: string): string {
    const row = this.getDb()
      .prepare('SELECT stored_path FROM files WHERE id = ?')
      .get(fileId) as unknown as { stored_path: string } | undefined;
    if (!row) throw new Error('FILE_NOT_FOUND');
    return this.resolveSafe(row.stored_path);
  }

  stream(fileId: string): Readable {
    return createReadStream(this.pathFor(fileId));
  }

  exists(fileId: string): boolean {
    try {
      return existsSync(this.pathFor(fileId));
    } catch {
      return false;
    }
  }

  async delete(fileId: string): Promise<void> {
    const row = this.getDb()
      .prepare('SELECT stored_path FROM files WHERE id = ?')
      .get(fileId) as unknown as { stored_path: string } | undefined;
    if (!row) return;

    try {
      await unlink(this.resolveSafe(row.stored_path));
    } catch {
      // The file may already be gone; the metadata still needs removal.
    }

    this.getDb().prepare('DELETE FROM files WHERE id = ?').run(fileId);
  }
}

export function createFileService(
  getDb: () => DatabaseSync,
  root: string,
): FileService {
  return new FileService(getDb, root);
}
