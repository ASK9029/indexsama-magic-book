import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const source = path.resolve('src/server/db/migrations');
const target = path.resolve('dist/server/migrations');

if (existsSync(source)) {
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true });
}

// The package/start scripts use index.mjs; tsup emits index.js for the esm format.
const built = path.resolve('dist/server/index.js');
const renamed = path.resolve('dist/server/index.mjs');
if (existsSync(built)) {
  await rm(renamed, { force: true });
  await rename(built, renamed);
  // esbuild strips the node: prefix from node:sqlite in this build; restore it.
  const content = await readFile(renamed, 'utf8');
  const next = content.replace(/(from\s*["'])sqlite(["'])/g, '$1node:sqlite$2');
  if (next !== content) await writeFile(renamed, next);
}
