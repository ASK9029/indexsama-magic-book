import { useState } from 'react';
import { PageHeader } from '@client/components/ui/PageHeader';
import { QuickMemoCard } from './QuickMemoCard';
import { MemoDrawer } from './MemoDrawer';

export function HomePage() {
  const [memoOpen, setMemoOpen] = useState(false);

  return (
    <div>
      <PageHeader title="今天" subtitle="今天要做的事，一眼看完" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-card border border-dashed border-line bg-surface/60 p-6 text-sm text-muted">
          今日计划将在 Task 8/9 接入。
        </div>
        <QuickMemoCard onOpenAll={() => setMemoOpen(true)} />
      </div>

      <MemoDrawer open={memoOpen} onClose={() => setMemoOpen(false)} />
    </div>
  );
}
