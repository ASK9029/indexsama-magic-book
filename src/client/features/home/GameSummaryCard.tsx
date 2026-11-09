import { Link } from 'react-router-dom';
import { Card } from '@client/components/ui/Card';

export function GameSummaryCard() {
  return (
    <Card className="flex h-full flex-col gap-2">
      <h2 className="text-sm font-medium text-ink">游戏</h2>
      <p className="text-sm text-muted">还没有想玩的游戏。</p>
      <Link to="/games" className="mt-auto text-sm text-accent">
        去游戏 →
      </Link>
    </Card>
  );
}
