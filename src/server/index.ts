import path from 'node:path';
import { buildApp } from './app';
import { resolveDataDir } from './config';

const dataDir = resolveDataDir();
const port = Number(process.env.PORT ?? 43110);

const app = await buildApp({
  dataDir,
  dbPath: path.join(dataDir, 'app.db'),
  logger: true,
});

await app.listen({ host: '127.0.0.1', port });
console.log(`我的生活 running at http://127.0.0.1:${port}`);
