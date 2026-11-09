import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@client/components/ui/PageHeader';
import { EmptyState } from '@client/components/ui/EmptyState';
import { useSettings } from '@client/hooks/useSettings';
import { useTheme } from '@client/hooks/useTheme';
import { SettingsTabs } from './SettingsTabs';
import { AppearanceTab } from './AppearanceTab';
import { DataTab } from './DataTab';
import { PreferencesTab } from './PreferencesTab';

export function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const active = params.get('tab') ?? 'data';
  const { settings, isLoading, update } = useSettings();
  useTheme();

  const setTab = (tab: string) => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    setParams(next);
  };

  return (
    <div>
      <PageHeader title="数据与设置" subtitle="数据、外观和使用偏好" />
      <SettingsTabs value={active} onChange={setTab} />

      <div className="mt-5">
        {isLoading || !settings ? (
          <div className="text-sm text-muted">正在加载设置…</div>
        ) : active === 'data' ? (
          <DataTab />
        ) : active === 'appearance' ? (
          <AppearanceTab settings={settings} update={update} />
        ) : active === 'preferences' ? (
          <PreferencesTab settings={settings} update={update} />
        ) : (
          <EmptyState title="危险区" description="清空数据将在 Task 24 接入。" />
        )}
      </div>
    </div>
  );
}
