import { Link } from 'react-router-dom';
import { Card } from '@client/components/ui/Card';

export function DietSummaryCard() {
  return (
    <Card className="flex h-full flex-col gap-2">
      <h2 className="text-sm font-medium text-ink">饮食</h2>
      <p className="text-sm text-muted">今天还没有记录饮食。</p>
      <Link to="/diet" className="mt-auto text-sm text-accent">
        去记录 →
      </Link>
    </Card>
  );
}
