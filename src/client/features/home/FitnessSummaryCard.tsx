import { Link } from 'react-router-dom';
import { Card } from '@client/components/ui/Card';

export function FitnessSummaryCard() {
  return (
    <Card className="flex h-full flex-col gap-2">
      <h2 className="text-sm font-medium text-ink">健身</h2>
      <p className="text-sm text-muted">今天还没有训练。</p>
      <Link to="/fitness" className="mt-auto text-sm text-accent">
        去训练 →
      </Link>
    </Card>
  );
}
