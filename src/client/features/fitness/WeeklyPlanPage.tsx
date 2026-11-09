import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useExercises } from '@client/hooks/useExercises';
import { useFitnessPlan } from '@client/hooks/useFitnessPlan';
import type { PlanDay, PlanExercise } from '@shared/types';
import { PlanDayModal } from './PlanDayModal';
import { CurrentWeightTable } from './CurrentWeightTable';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function WeeklyPlanPage() {
  const { plan, isLoading, save } = useFitnessPlan();
  const { exercises } = useExercises();
  const [editing, setEditing] = useState<PlanDay | null>(null);

  const jsDay = new Date().getDay();
  const today = jsDay === 0 ? 7 : jsDay;

  const handleSave = (input: {
    name: string;
    isRest: boolean;
    exercises: PlanExercise[];
  }) => {
    if (!editing) return;
    save.mutate({ weekday: editing.weekday, day: input });
    setEditing(null);
  };

  return (
    <div>
      {isLoading ? (
        <p className="text-sm text-muted">正在加载…</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
          {plan.map((day) => (
            <Card
              key={day.weekday}
              className={
                day.weekday === today ? 'ring-2 ring-accent' : undefined
              }
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-ink">
                  {WEEKDAYS[day.weekday - 1]}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`编辑 ${WEEKDAYS[day.weekday - 1]}`}
                  onClick={() => setEditing(day)}
                >
                  编辑
                </Button>
              </div>
              <p className="mt-2 text-sm text-ink">
                {day.isRest ? '休息' : day.name || '未命名'}
              </p>
              {!day.isRest ? (
                <p className="mt-1 text-xs text-muted">
                  {day.exercises.length} 个动作 ·{' '}
                  {day.exercises.reduce((sum, item) => sum + item.targetSets, 0)} 组
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <CurrentWeightTable />

      {editing ? (
        <PlanDayModal
          open
          onClose={() => setEditing(null)}
          day={editing}
          exercises={exercises}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
