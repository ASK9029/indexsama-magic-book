import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  globalSetup: undefined,
  use: {
    baseURL: 'http://127.0.0.1:43111',
    trace: 'retain-on-failure',
    channel: 'msedge',
  },
  webServer: {
    command:
      'node -e "require(\'node:fs\').rmSync(\'.e2e-data\',{recursive:true,force:true})" && node dist/server/index.mjs',
    port: 43111,
    env: { DATA_DIR: '.e2e-data', PORT: '43111' },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
