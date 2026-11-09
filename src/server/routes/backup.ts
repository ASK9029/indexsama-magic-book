import { createWriteStream } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { FastifyInstance } from 'fastify';
import { clearDataSchema } from '@shared/schemas';
import { ApiError } from '../lib/errors';
import { setSetting } from '../repositories/settings';
import {
  BackupError,
  backupFileName,
  clearData,
  createBackupArchive,
  restoreBackup,
} from '../services/backup';

export async function backupRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/backup', async (_request, reply) => {
    const dbPath = app.dbManager.path;
    const dataDir = path.dirname(dbPath);
    const archive = await createBackupArchive(app.dbManager.get(), dataDir);
    setSetting(app.dbManager.get(), 'lastBackupAt', new Date().toISOString());

    return reply
      .type('application/zip')
      .header(
        'content-disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(backupFileName())}`,
      )
      .send(archive);
  });

  app.post('/api/restore', async (request) => {
    const part = await request.file({
      limits: { fileSize: 2 * 1024 * 1024 * 1024 },
    });
    if (!part) {
      throw new ApiError('VALIDATION_ERROR', '请选择备份文件', 400);
    }

    const uploadDir = await mkdtemp(path.join(os.tmpdir(), 'life-upload-'));
    const zipPath = path.join(uploadDir, 'backup.zip');

    try {
      await pipeline(part.file, createWriteStream(zipPath));
      const manifest = await restoreBackup(
        app.dbManager,
        path.dirname(app.dbManager.path),
        zipPath,
      );
      return { ok: true, manifest };
    } catch (error) {
      if (error instanceof BackupError) {
        throw new ApiError(error.code, error.message, error.status);
      }
      throw error;
    } finally {
      await rm(uploadDir, { recursive: true, force: true });
    }
  });

  app.post('/api/data/clear', async (request, reply) => {
    const parsed = clearDataSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: '请输入“清空”确认',
          details: parsed.error.flatten(),
        },
      });
    }

    await clearData(app.dbManager, path.dirname(app.dbManager.path));
    return { ok: true };
  });
}
