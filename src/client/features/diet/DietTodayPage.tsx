import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '@client/components/ui/Card';
import { DateNav } from '@client/components/ui/DateNav';
import { useDietDay, useDietMutations } from '@client/hooks/useDietDay';
import { todayLocal } from '@client/lib/clientDates';
import { formatCalories } from '@shared/format';
import type { Meal } from '@shared/types';
import { CopyPlanDialog } from './CopyPlanDialog';
import { FoodPickerDrawer } from './FoodPickerDrawer';
import { MealCard } from './MealCard';

export function DietTodayPage() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? todayLocal();
  const future = date > todayLocal();
  const { data: day, isLoading } = useDietDay(date);
  const mutations = useDietMutations(date);

  const [picker, setPicker] = useState<{
    meal: Meal;
    kind: 'plan' | 'actual';
  } | null>(null);
  const [copyMeal, setCopyMeal] = useState<Meal | null>(null);

  const setDate = (next: string) => {
    const nextParams = new URLSearchParams(params);
    if (next === todayLocal()) nextParams.delete('date');
    else nextParams.set('date', next);
    setParams(nextParams);
  };

  if (isLoading || !day) {
    return <p className="text-sm text-muted">正在加载…</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <DateNav value={date} onChange={setDate} />
        {future ? (
          <span className="text-xs text-amber-700">未来日期只能排计划。</span>
        ) : null}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card>
          <p className="text-xs text-muted">今日摄入</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {formatCalories(day.summary.calories)}
          </p>
          <p className="mt-1 text-xs text-muted">
            目标{' '}
            {day.targets.calorieTarget !== null
              ? formatCalories(day.targets.calorieTarget)
              : '未设置'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">蛋白质</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {day.summary.protein.toFixed(1)} g
          </p>
          <p className="mt-1 text-xs text-muted">
            目标{' '}
            {day.targets.proteinTarget !== null
              ? `${day.targets.proteinTarget} g`
              : '未设置'}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-muted">完成餐次</p>
          <p className="mt-1 text-lg font-semibold text-ink">
            {day.meals.filter((meal) => meal.done).length} / 4
          </p>
          <p className="mt-1 text-xs text-muted">勾选与实际记录分开</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {day.meals.map((bucket) => (
            <MealCard
              key={bucket.meal}
              bucket={bucket}
              future={future}
              onAdd={(kind) => setPicker({ meal: bucket.meal, kind })}
              onCopy={() => {
                if (bucket.actualEntries.length === 0) {
                  mutations.copyPlan.mutate({
                    meal: bucket.meal,
                    mode: 'replace',
                  });
                } else {
                  setCopyMeal(bucket.meal);
                }
              }}
              onClear={(kind) =>
                mutations.clear.mutate({ meal: bucket.meal, kind })
              }
              onDone={(done) =>
                mutations.setDone.mutate({ meal: bucket.meal, done })
              }
              onDelete={(id) => mutations.deleteEntry.mutate(id)}
            />
          ))}
        </div>

        <Card>
          <h2 className="text-base font-medium text-ink">饮水与体重</h2>
          <p className="mt-2 text-sm text-muted">饮水和体重将在 Task 20 接入。</p>
        </Card>
      </div>

      {picker ? (
        <FoodPickerDrawer
          open
          onClose={() => setPicker(null)}
          date={date}
          meal={picker.meal}
          kind={picker.kind}
          onAdd={(input) => {
            mutations.addEntry.mutate(input);
            setPicker(null);
          }}
        />
      ) : null}

      {copyMeal ? (
        <CopyPlanDialog
          open
          onClose={() => setCopyMeal(null)}
          onChoose={(mode) => {
            mutations.copyPlan.mutate({ meal: copyMeal, mode });
            setCopyMeal(null);
          }}
        />
      ) : null}
    </div>
  );
}
