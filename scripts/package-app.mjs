import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runBuild() {
  const vite = path.join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const tsup = path.join(root, 'node_modules', 'tsup', 'dist', 'cli-default.js');

  execFileSync(process.execPath, [vite, 'build'], { cwd: root, stdio: 'inherit' });
  execFileSync(
    process.execPath,
    [
      tsup,
      'src/server/index.ts',
      '--format',
      'esm',
      '--out-dir',
      'dist/server',
      '--platform',
      'node',
      '--target',
      'node22',
    ],
    { cwd: root, stdio: 'inherit' },
  );
  execFileSync(
    process.execPath,
    [path.join(root, 'scripts', 'copy-migrations.mjs')],
    { cwd: root, stdio: 'inherit' },
  );
}

export async function buildRelease(targetDir, options = {}) {
  const target = path.resolve(targetDir);
  if (!options.skipBuild) runBuild();

  const appDir = path.join(target, 'app');
  const runtimeDir = path.join(target, 'runtime');
  const dataDir = path.join(target, 'data');

  await mkdir(target, { recursive: true });
  await mkdir(runtimeDir, { recursive: true });

  for (const dir of ['client', 'server', 'node_modules']) {
    await rm(path.join(appDir, dir), { recursive: true, force: true });
  }
  await mkdir(appDir, { recursive: true });

  await cp(path.join(root, 'dist', 'client'), path.join(appDir, 'client'), {
    recursive: true,
  });
  await cp(path.join(root, 'dist', 'server'), path.join(appDir, 'server'), {
    recursive: true,
  });
  await cp(path.join(root, 'package.json'), path.join(appDir, 'package.json'));
  await cp(process.execPath, path.join(runtimeDir, 'node.exe'));
  await cp(
    path.join(root, 'scripts', 'launcher.vbs'),
    path.join(target, '启动IndexSama的魔法录.vbs'),
  );
  await cp(
    path.join(root, 'scripts', 'README.txt'),
    path.join(target, 'README.txt'),
  );

  // Existing data is user data: create the directory only when missing.
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }

  return { target };
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const targetIndex = process.argv.indexOf('--target');
  const target =
    targetIndex >= 0
      ? process.argv[targetIndex + 1]
      : path.join(root, 'release', 'IndexSama的魔法录');
  const result = await buildRelease(target);
  console.log(`release ready: ${result.target}`);
}
