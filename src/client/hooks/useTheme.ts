import { useEffect } from 'react';
import { useSettings } from './useSettings';

export type ResolvedTheme = 'light' | 'dark';

export function resolveTheme(theme: 'light' | 'dark' | 'system'): ResolvedTheme {
  if (theme !== 'system') return theme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: 'light' | 'dark' | 'system'): void {
  document.documentElement.dataset.theme = resolveTheme(theme);
}

export function useTheme(): void {
  const { settings } = useSettings();
  const theme = settings?.theme ?? 'light';

  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);
}
