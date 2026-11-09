import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useFitnessPlan } from '@client/hooks/useFitnessPlan';
import { todayLocal } from '@client/lib/clientDates';

export function TodayTrainingPage() {
  const { plan, isLoading } = useFitnessPlan();
  const jsDay = new Date().getDay();
  const weekday = jsDay === 0 ? 7 : jsDay;
  const day = plan.find((item) => item.weekday === weekday);

  return (
    <Card>
      <h2 className="text-base font-medium text-ink">今天 · {todayLocal()}</h2>
      {isLoading ? (
        <p className="mt-3 text-sm text-muted">正在加载…</p>
      ) : (
        <>
          <p className="mt-3 text-lg font-medium text-ink">
            {day?.isRest ? '休息日' : day?.name || '未安排训练'}
          </p>
          {!day?.isRest && day ? (
            <p className="mt-1 text-sm text-muted">
              {day.exercises.length} 个动作 ·{' '}
              {day.exercises.reduce((sum, item) => sum + item.targetSets, 0)} 组
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted">训练记录将在 Task 15 接入。</p>
          <Button className="mt-4" disabled>
            开始训练
          </Button>
        </>
      )}
    </Card>
  );
}
