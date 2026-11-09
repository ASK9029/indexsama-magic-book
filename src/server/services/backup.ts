import { createReadStream, createWriteStream, existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import * as sqlite from 'node:sqlite';
import archiver, { type Archiver } from 'archiver';
import * as yauzl from 'yauzl';
import { pipeline } from 'node:stream/promises';
import { toLocalDate } from '@shared/dates';
import { APP_NAME } from '@shared/constants';
import type { DbManager } from '../db/connection';
import { migrate } from '../db/migrate';
import { seedExercises } from '../db/seed/exercises';
import { seedFoods } from '../db/seed/foods';
import { getCounts } from './dataInfo';

export const APP_VERSION = '1.0.0';

const backupDatabase = (
  sqlite as unknown as {
    backup: (db: DatabaseSync, destination: string) => Promise<void>;
  }
).backup;

export class BackupError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'BackupError';
  }
}

export interface BackupManifest {
  formatVersion: 1;
  appVersion: string;
  createdAt: string;
  counts: ReturnType<typeof getCounts>;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

export function backupFileName(now = new Date()): string {
  return `${APP_NAME}-备份-${toLocalDate(now)}-${pad2(now.getHours())}${pad2(now.getMinutes())}.zip`;
}

function buildManifest(db: DatabaseSync): BackupManifest {
  return {
    formatVersion: 1,
    appVersion: APP_VERSION,
    createdAt: new Date().toISOString(),
    counts: getCounts(db),
  };
}

export async function createBackupArchive(
  db: DatabaseSync,
  dataDir: string,
): Promise<Archiver> {
  const tempDb = path.join(os.tmpdir(), `life-backup-${randomUUID()}.db`);
  await backupDatabase(db, tempDb);

  const manifest = buildManifest(db);
  const archive = archiver('zip', { zlib: { level: 9 } });

  archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
  archive.append(createReadStream(tempDb), { name: 'app.db' });

  const filesDir = path.join(dataDir, 'files');
  if (existsSync(filesDir)) {
    archive.directory(filesDir, 'files');
  }

  archive.on('end', () => {
    void rm(tempDb, { force: true });
  });
  archive.on('error', () => {
    void rm(tempDb, { force: true });
  });

  archive.finalize();
  return archive;
}

export async function writeBackupToFile(
  db: DatabaseSync,
  dataDir: string,
  destination: string,
): Promise<void> {
  await mkdir(path.dirname(destination), { recursive: true });
  const archive = await createBackupArchive(db, dataDir);

  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(destination);
    archive.on('error', reject);
    output.on('error', reject);
    output.on('close', () => resolve());
    archive.pipe(output);
  });
}

function unzipTo(zipPath: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const fail = (error: unknown) => {
      reject(
        error instanceof BackupError
          ? error
          : new BackupError('INVALID_BACKUP', '备份压缩包无法读取', 400),
      );
    };

    yauzl.open(zipPath, { lazyEntries: true }, (openError, zip) => {
      if (openError || !zip) {
        fail(openError);
        return;
      }

      zip.on('error', fail);
      zip.on('end', () => resolve());
      zip.on('entry', (entry) => {
        const target = path.resolve(destination, entry.fileName);
        const root = path.resolve(destination);
        if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
          zip.close();
          reject(new BackupError('INVALID_BACKUP', '备份包含非法路径', 400));
          return;
        }

        if (entry.fileName.endsWith('/')) {
          void mkdir(target, { recursive: true })
            .then(() => zip.readEntry())
            .catch(fail);
          return;
        }

        void mkdir(path.dirname(target), { recursive: true })
          .then(
            () =>
              new Promise<void>((resolveEntry, rejectEntry) => {
                zip.openReadStream(entry, (streamError, stream) => {
                  if (streamError || !stream) {
                    rejectEntry(streamError);
                    return;
                  }
                  pipeline(stream, createWriteStream(target))
                    .then(() => {
                      resolveEntry();
                      zip.readEntry();
                    })
                    .catch(rejectEntry);
                });
              }),
          )
          .catch(fail);
      });

      zip.readEntry();
    });
  });
}

async function validateManifest(workDir: string): Promise<BackupManifest> {
  const manifestPath = path.join(workDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new BackupError('INVALID_BACKUP', '备份缺少 manifest.json', 400);
  }

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as BackupManifest;
  } catch {
    throw new BackupError('INVALID_BACKUP', 'manifest.json 格式不正确', 400);
  }

  if (manifest.formatVersion !== 1) {
    throw new BackupError('BACKUP_VERSION', '备份版本不兼容', 409);
  }

  const dbPath = path.join(workDir, 'app.db');
  if (!existsSync(dbPath)) {
    throw new BackupError('INVALID_BACKUP', '备份缺少 app.db', 400);
  }

  try {
    const probe = new DatabaseSync(dbPath);
    probe.prepare('SELECT COUNT(*) AS count FROM schema_migrations').get();
    probe.close();
  } catch {
    throw new BackupError('INVALID_DATABASE', '备份数据库无法打开', 400);
  }

  return manifest;
}

async function applySnapshot(
  dbManager: DbManager,
  dataDir: string,
  sourceDir: string,
): Promise<void> {
  const dbPath = dbManager.path;
  const filesDir = path.join(dataDir, 'files');

  for (const suffix of ['', '-wal', '-shm']) {
    await rm(`${dbPath}${suffix}`, { force: true });
  }
  await cp(path.join(sourceDir, 'app.db'), dbPath);

  await rm(filesDir, { recursive: true, force: true });
  const snapshotFiles = path.join(sourceDir, 'files');
  if (existsSync(snapshotFiles)) {
    await cp(snapshotFiles, filesDir, { recursive: true });
  } else {
    await mkdir(filesDir, { recursive: true });
  }
}

export async function restoreBackup(
  dbManager: DbManager,
  dataDir: string,
  zipPath: string,
): Promise<BackupManifest> {
  const workDir = await mkdtemp(path.join(os.tmpdir(), 'life-restore-'));

  try {
    await unzipTo(zipPath, workDir);
    const manifest = await validateManifest(workDir);

    const backupsDir = path.join(dataDir, 'backups');
    await mkdir(backupsDir, { recursive: true });
    const preRestore = path.join(
      backupsDir,
      `pre-restore-${timestamp()}.zip`,
    );
    await writeBackupToFile(dbManager.get(), dataDir, preRestore);

    dbManager.close();

    try {
      await applySnapshot(dbManager, dataDir, workDir);
      dbManager.reopen();
      migrate(dbManager.get());
      return manifest;
    } catch (error) {
      try {
        dbManager.close();
      } catch {
        // Already closed.
      }

      const rollbackDir = await mkdtemp(path.join(os.tmpdir(), 'life-rollback-'));
      try {
        await unzipTo(preRestore, rollbackDir);
        await applySnapshot(dbManager, dataDir, rollbackDir);
        dbManager.reopen();
        migrate(dbManager.get());
      } finally {
        await rm(rollbackDir, { recursive: true, force: true });
      }

      throw error;
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

export async function clearData(
  dbManager: DbManager,
  dataDir: string,
): Promise<void> {
  const dbPath = dbManager.path;
  const filesDir = path.join(dataDir, 'files');
  const backupsDir = path.join(dataDir, 'backups');

  dbManager.close();

  try {
    for (const suffix of ['', '-wal', '-shm']) {
      await rm(`${dbPath}${suffix}`, { force: true });
    }
    await rm(filesDir, { recursive: true, force: true });
    await mkdir(filesDir, { recursive: true });
    await rm(backupsDir, { recursive: true, force: true });
    await mkdir(backupsDir, { recursive: true });

    dbManager.reopen();
    migrate(dbManager.get());
    seedExercises(dbManager.get());
    seedFoods(dbManager.get());
  } catch (error) {
    try {
      dbManager.reopen();
    } catch {
      // The manager may already be open.
    }
    throw error;
  }
}
