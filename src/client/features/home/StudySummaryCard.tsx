import { Link } from 'react-router-dom';
import { Card } from '@client/components/ui/Card';

export function StudySummaryCard() {
  return (
    <Card className="flex h-full flex-col gap-2">
      <h2 className="text-sm font-medium text-ink">学习</h2>
      <p className="text-sm text-muted">今天还没有学习安排。</p>
      <Link to="/study/subjects" className="mt-auto text-sm text-accent">
        去学习 →
      </Link>
    </Card>
  );
}
