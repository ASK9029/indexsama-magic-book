import { applyTheme } from '@client/hooks/useTheme';
import { Select } from '@client/components/ui/Select';
import type { Settings } from '@shared/types';

export function AppearanceTab({
  settings,
  update,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}) {
  return (
    <section className="max-w-md rounded-card border border-line bg-surface p-5">
      <label htmlFor="theme" className="text-sm font-medium text-ink">
        主题
      </label>
      <Select
        id="theme"
        className="mt-2"
        value={settings.theme}
        onChange={(event) => {
          const theme = event.target.value as Settings['theme'];
          applyTheme(theme);
          update({ theme });
        }}
      >
        <option value="light">浅色</option>
        <option value="dark">深色</option>
        <option value="system">跟随系统</option>
      </Select>
      <p className="mt-2 text-xs text-muted">切换后立即生效，并保存在本机。</p>
    </section>
  );
}
