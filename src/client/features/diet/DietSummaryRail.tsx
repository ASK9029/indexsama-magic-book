import { Link } from 'react-router-dom';
import { Card } from '@client/components/ui/Card';
import { formatCalories } from '@shared/format';
import type { DietDay } from '@shared/types';
import { WaterCard } from './WaterCard';
import { WeightCard } from './WeightCard';

export function DietSummaryRail({
  day,
  date,
  future,
}: {
  day: DietDay;
  date: string;
  future: boolean;
}) {
  const calorieTarget = day.targets.calorieTarget;
  const proteinTarget = day.targets.proteinTarget;
  const caloriePercent =
    calorieTarget && calorieTarget > 0
      ? Math.min(100, Math.round((day.summary.calories / calorieTarget) * 100))
      : 0;
  const proteinPercent =
    proteinTarget && proteinTarget > 0
      ? Math.min(100, Math.round((day.summary.protein / proteinTarget) * 100))
      : 0;

  const calorieHint =
    calorieTarget === null
      ? '设置每日热量目标'
      : day.summary.calories > calorieTarget
        ? `超出 ${formatCalories(day.summary.calories - calorieTarget)}`
        : `还差 ${formatCalories(calorieTarget - day.summary.calories)}`;
  const proteinHint =
    proteinTarget === null
      ? '设置每日蛋白质目标'
      : day.summary.protein > proteinTarget
        ? `超出 ${(day.summary.protein - proteinTarget).toFixed(1)} g`
        : `还差 ${(proteinTarget - day.summary.protein).toFixed(1)} g`;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink">今日摄入</h2>
          <Link to="/settings" className="text-xs text-accent">
            改目标
          </Link>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted">
            <span>热量</span>
            <span>
              {formatCalories(day.summary.calories)} /{' '}
              {calorieTarget !== null
                ? formatCalories(calorieTarget)
                : '未设置'}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-canvas">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{calorieHint}</p>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-xs text-muted">
            <span>蛋白质</span>
            <span>
              {day.summary.protein.toFixed(1)} g /{' '}
              {proteinTarget !== null ? `${proteinTarget} g` : '未设置'}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-canvas">
            <div
              className="h-2 rounded-full bg-accent"
              style={{ width: `${proteinPercent}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">{proteinHint}</p>
        </div>
      </Card>

      <WaterCard
        date={date}
        waterMl={day.summary.waterMl}
        waterTarget={day.summary.waterTarget}
        future={future}
      />
      <WeightCard date={date} weightKg={day.summary.weightKg} future={future} />
    </div>
  );
}
