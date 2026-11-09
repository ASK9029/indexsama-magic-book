import { useSearchParams } from 'react-router-dom';
import { EmptyState } from '@client/components/ui/EmptyState';
import { PageHeader } from '@client/components/ui/PageHeader';
import { ExerciseLibraryPage } from './ExerciseLibraryPage';
import { FitnessTabs } from './FitnessTabs';
import { TodayTrainingPage } from './TodayTrainingPage';
import { WeeklyPlanPage } from './WeeklyPlanPage';
import { TrainingHistory } from './TrainingHistory';

export function FitnessPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? 'today';

  const setTab = (next: string) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set('tab', next);
    setParams(nextParams);
  };

  return (
    <div>
      <PageHeader title="健身计划" subtitle="训练、周计划和动作库" />
      <FitnessTabs value={tab} onChange={setTab} />

      <div className="mt-5">
        {tab === 'plan' ? (
          <WeeklyPlanPage />
        ) : tab === 'exercises' ? (
          <ExerciseLibraryPage />
        ) : tab === 'stats' ? (
          <div className="space-y-4">
            <TrainingHistory />
            <EmptyState
              title="统计图表"
              description="体重、训练量和力量曲线将在 Task 16 接入。"
            />
          </div>
        ) : (
          <TodayTrainingPage />
        )}
      </div>
    </div>
  );
}
