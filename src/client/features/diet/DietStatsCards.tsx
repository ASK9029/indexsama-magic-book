import { Card } from '@client/components/ui/Card';
import type { DietStatsData } from '@client/hooks/useDietStats';

export function DietStatsCards({ stats }: { stats: DietStatsData }) {
  const change = stats.summary.weightChange;
  const cards = [
    { label: '记录天数', value: `${stats.summary.recordedDays} 天` },
    {
      label: '日均热量',
      value: `${Math.round(stats.summary.avgCalories)} kcal`,
    },
    {
      label: '日均蛋白',
      value: `${stats.summary.avgProtein.toFixed(1)} g`,
    },
    {
      label: '日均饮水',
      value: `${Math.round(stats.summary.avgWaterMl)} ml`,
    },
    {
      label: '体重变化',
      value:
        change === null
          ? '—'
          : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label}>
          <p className="text-xs text-muted">{card.label}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}
