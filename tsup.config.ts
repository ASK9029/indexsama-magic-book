import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist/server',
  external: ['node:sqlite'],
  noExternal: [/.*/],
  esbuildOptions(options) {
    // CJS dependencies use require() for node builtins; provide one in the ESM bundle.
    options.banner = {
      js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);",
    };
  },
});
