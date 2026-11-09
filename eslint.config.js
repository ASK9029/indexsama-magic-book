import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'data', 'release', '.superpowers', '.e2e-data'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
