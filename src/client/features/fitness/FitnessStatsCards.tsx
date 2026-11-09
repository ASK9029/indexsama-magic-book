import { Card } from '@client/components/ui/Card';
import type { FitnessStatsData } from '@client/hooks/useFitnessStats';
import { formatMinutes } from '@shared/format';

export function FitnessStatsCards({ stats }: { stats: FitnessStatsData }) {
  const latestWeight = [...stats.weight]
    .reverse()
    .find((point) => point.value !== null)?.value;

  const cards = [
    { label: '总训练量', value: `${stats.summary.totalVolume} kg` },
    { label: '训练次数', value: `${stats.summary.sessionCount} 次` },
    {
      label: '训练时长',
      value: formatMinutes(stats.summary.totalDurationMinutes),
    },
    {
      label: '最新体重',
      value: latestWeight !== undefined ? `${latestWeight} kg` : '—',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <p className="text-xs text-muted">{card.label}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}
