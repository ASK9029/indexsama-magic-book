import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/client/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        line: 'var(--border)',
      },
      borderRadius: { card: '14px' },
    },
  },
  plugins: [],
};

export default config;
