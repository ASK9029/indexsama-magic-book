import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@client/components/ui/Card';
import { PageHeader } from '@client/components/ui/PageHeader';
import { ProgressBar } from '@client/components/ui/ProgressBar';
import { useHome } from '@client/hooks/useHome';
import { useTasks } from '@client/hooks/useTasks';
import { todayLocal } from '@client/lib/clientDates';
import { MemoDrawer } from './MemoDrawer';
import { QuickMemoCard } from './QuickMemoCard';
import { SummaryCards } from './SummaryCards';
import { TodayPlanCard } from './TodayPlanCard';

export function HomePage() {
  const [memoOpen, setMemoOpen] = useState(false);
  const { tasks } = useTasks(todayLocal());
  const { data: home } = useHome();

  const done = home?.progress?.done ?? tasks.filter((task) => task.done).length;
  const total = home?.progress?.total ?? tasks.length;
  const incomplete = Math.max(0, total - done);
  const items = home?.items ?? [];

  return (
    <div>
      <PageHeader title="今天" subtitle={`还有 ${incomplete} 件事没做`} />

      <div className="mb-5">
        <ProgressBar value={done} max={Math.max(total, 1)} />
        <p className="mt-1 text-xs text-muted">
          已完成 {done} / {total}
        </p>
      </div>

      {items.length > 0 ? (
        <Card className="mb-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-ink">今天要做</h2>
            <Link to="/today" className="text-xs text-accent">
              查看全部
            </Link>
          </div>
          <div>
            {items.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="flex items-center gap-3 border-b border-line/60 px-2 py-2 last:border-b-0"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    item.done ? 'bg-accent' : 'bg-line'
                  }`}
                />
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    item.done ? 'text-muted line-through' : 'text-ink'
                  }`}
                >
                  {item.title}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {item.subtitle}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {home?.studySummary ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <p className="text-xs text-muted">学习</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {home.studySummary.minutes} 分钟
            </p>
            <p className="text-xs text-muted">
              {home.studySummary.arrangements} 项安排
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">健身</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {home.fitnessSummary.completed ? '已完成' : '未完成'}
            </p>
            <p className="text-xs text-muted">
              {home.fitnessSummary.minutes} 分钟
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">饮食</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {Math.round(home.dietSummary.calories)} kcal
            </p>
            <p className="text-xs text-muted">
              蛋白 {home.dietSummary.protein.toFixed(1)} g
            </p>
          </Card>
          <Card>
            <p className="text-xs text-muted">游戏</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {home.gameSummary.playing} 在玩
            </p>
            <p className="text-xs text-muted">
              今年通关 {home.gameSummary.completedThisYear}
            </p>
          </Card>
        </div>
      ) : null}

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
