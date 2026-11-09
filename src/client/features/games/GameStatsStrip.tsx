import { Card } from '@client/components/ui/Card';
import { useGameStats } from '@client/hooks/useGames';
import { formatMinutes } from '@shared/format';

export function GameStatsStrip() {
  const { data: stats } = useGameStats();
  if (!stats) return null;

  const items = [
    { label: '在玩', value: stats.playing },
    { label: '想玩', value: stats.wishlist },
    { label: '已通关', value: stats.completed },
    { label: '总游玩', value: formatMinutes(stats.totalMinutes) },
    { label: '今年通关', value: stats.completedThisYear },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <p className="text-xs text-muted">{item.label}</p>
          <p className="mt-1 text-lg font-semibold text-ink">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
