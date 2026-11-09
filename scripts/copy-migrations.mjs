import { cp, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const source = path.resolve('src/server/db/migrations');
const target = path.resolve('dist/server/migrations');

if (existsSync(source)) {
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
}
