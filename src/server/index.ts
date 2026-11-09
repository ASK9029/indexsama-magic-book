import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildApp } from './app';
import { resolveDataDir } from './config';

const dataDir = resolveDataDir();
mkdirSync(dataDir, { recursive: true });

const basePort = Number(process.env.PORT ?? 43110);
const candidates = [
  basePort,
  ...Array.from({ length: 10 }, (_, index) => 43110 + index).filter(
    (port) => port !== basePort,
  ),
];

const app = await buildApp({
  dataDir,
  dbPath: path.join(dataDir, 'app.db'),
  logger: true,
});

const urlFile = path.join(dataDir, 'server-url.txt');
const removeUrlFile = () => {
  try {
    rmSync(urlFile, { force: true });
  } catch {
    // Best effort on shutdown.
  }
};
process.on('exit', removeUrlFile);
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void app.close().finally(() => process.exit(0));
  });
}

let listeningPort: number | null = null;
let lastError: unknown = null;

for (const port of candidates) {
  try {
    await app.listen({ host: '127.0.0.1', port });
    listeningPort = port;
    break;
  } catch (error) {
    lastError = error;
    if ((error as NodeJS.ErrnoException).code !== 'EADDRINUSE') break;
  }
}

if (listeningPort === null) {
  writeFileSync(
    path.join(dataDir, 'server-error.txt'),
    `无法启动本地服务。最后错误：${String(lastError)}\n`,
    'utf8',
  );
  console.error('我的生活 failed to start', lastError);
  process.exit(1);
}

writeFileSync(urlFile, `http://127.0.0.1:${listeningPort}`, 'utf8');
console.log(`我的生活 running at http://127.0.0.1:${listeningPort}`);
