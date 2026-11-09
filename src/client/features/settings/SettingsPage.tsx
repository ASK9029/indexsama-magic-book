import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@client/components/ui/PageHeader';
import { EmptyState } from '@client/components/ui/EmptyState';
import { useSettings } from '@client/hooks/useSettings';
import { useTheme } from '@client/hooks/useTheme';
import { SettingsTabs } from './SettingsTabs';
import { AppearanceTab } from './AppearanceTab';
import { DataTab } from './DataTab';

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
          <EmptyState
            title="偏好设置"
            description="每周起始日、单位和目标将在 Task 23 接入。"
          />
        ) : (
          <EmptyState title="危险区" description="清空数据将在 Task 24 接入。" />
        )}
      </div>
    </div>
  );
}
