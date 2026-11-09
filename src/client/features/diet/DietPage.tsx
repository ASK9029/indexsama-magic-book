import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@client/components/ui/PageHeader';
import { DietStatsPage } from './DietStatsPage';
import { DietTabs } from './DietTabs';
import { DietTodayPage } from './DietTodayPage';
import { FoodLibraryPage } from './FoodLibraryPage';

export function DietPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'today';

  const setTab = (next: string) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    setParams(nextParams);
  };

  return (
    <div>
      <PageHeader title="饮食计划" subtitle="记录吃的，也计划吃的" />
      <DietTabs value={tab} onChange={setTab} />

      <div className="mt-5">
        {tab === 'library' ? (
          <FoodLibraryPage />
        ) : tab === 'stats' ? (
          <DietStatsPage />
        ) : (
          <DietTodayPage />
        )}
      </div>
    </div>
  );
}
