import { useState } from 'react';
import { PageHeader } from '@client/components/ui/PageHeader';
import { ProgressBar } from '@client/components/ui/ProgressBar';
import { useTasks } from '@client/hooks/useTasks';
import { todayLocal } from '@client/lib/clientDates';
import { MemoDrawer } from './MemoDrawer';
import { QuickMemoCard } from './QuickMemoCard';
import { SummaryCards } from './SummaryCards';
import { TodayPlanCard } from './TodayPlanCard';

export function HomePage() {
  const [memoOpen, setMemoOpen] = useState(false);
  const { tasks } = useTasks(todayLocal());
  const done = tasks.filter((task) => task.done).length;
  const incomplete = tasks.length - done;

  return (
    <div>
      <PageHeader title="今天" subtitle={`还有 ${incomplete} 件事没做`} />

      <div className="mb-5">
        <ProgressBar value={done} max={Math.max(tasks.length, 1)} />
        <p className="mt-1 text-xs text-muted">
          已完成 {done} / {tasks.length}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <TodayPlanCard />
        <QuickMemoCard onOpenAll={() => setMemoOpen(true)} />
      </div>

      <div className="mt-5">
        <SummaryCards />
      </div>

      <MemoDrawer open={memoOpen} onClose={() => setMemoOpen(false)} />
    </div>
  );
}
