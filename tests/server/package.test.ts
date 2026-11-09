import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const root = process.cwd();
const port = 43112;
let target = '';

function runPackage() {
  execFileSync(
    process.execPath,
    [path.join(root, 'scripts', 'package-app.mjs'), '--target', target],
    { cwd: root, stdio: 'inherit' },
  );
}

beforeAll(async () => {
  target = await mkdtemp(path.join(tmpdir(), 'life-release-'));
  runPackage();
  await writeFile(path.join(target, 'data', 'marker.txt'), 'keep me');
  runPackage();
}, 600000);

afterAll(async () => {
  if (target) await rm(target, { recursive: true, force: true });
}, 120000);

describe('portable package', () => {
  it('produces the portable layout and preserves data', () => {
    expect(existsSync(path.join(target, 'runtime', 'node.exe'))).toBe(true);
    expect(
      existsSync(path.join(target, 'app', 'server', 'index.mjs')),
    ).toBe(true);
    expect(
      existsSync(path.join(target, 'app', 'client', 'index.html')),
    ).toBe(true);
    expect(
      existsSync(path.join(target, 'app', 'node_modules', 'fastify', 'package.json')),
    ).toBe(true);
    expect(existsSync(path.join(target, '启动IndexSama的魔法录.vbs'))).toBe(true);
    expect(existsSync(path.join(target, 'README.txt'))).toBe(true);
    expect(existsSync(path.join(target, 'data', 'marker.txt'))).toBe(true);
  }, 300000);

  it('starts the packaged server and serves health plus the client', async () => {
    const child = spawn(
      path.join(target, 'runtime', 'node.exe'),
      [path.join(target, 'app', 'server', 'index.mjs')],
      {
        cwd: target,
        env: {
          ...process.env,
          DATA_DIR: path.join(target, 'data'),
          PORT: String(port),
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    let childLog = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      childLog += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      childLog += chunk.toString();
    });

    try {
      let healthy = false;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
          const response = await fetch(`http://127.0.0.1:${port}/api/health`);
          if (response.ok) {
            healthy = true;
            break;
          }
        } catch {
          // Server is still starting.
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      if (!healthy) console.error('packaged server log:', childLog);
      expect(healthy).toBe(true);

      const response = await fetch(`http://127.0.0.1:${port}/`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('<div id="root">');
    } finally {
      await new Promise<void>((resolve) => {
        child.once('exit', () => resolve());
        child.kill();
        setTimeout(resolve, 3000);
      });
    }
  }, 300000);
});
