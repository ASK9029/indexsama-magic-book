import { Card } from '@client/components/ui/Card';
import { useStudyStats } from '@client/hooks/useStudyStats';
import { todayLocal } from '@client/lib/clientDates';

export function StudyWeekCard({ week = todayLocal() }: { week?: string }) {
  const { data, isLoading } = useStudyStats(week);
  const days = data?.days ?? [];
  const max = Math.max(1, ...days.map((day) => day.minutes));

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-ink">本周学习</h2>
        <span className="text-sm text-muted">{data?.totalMinutes ?? 0} 分钟</span>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted">正在加载…</p>
      ) : (
        <div className="mt-4 flex h-24 items-end gap-2">
          {days.map((day) => (
            <div
              key={day.date}
              className="flex flex-1 flex-col items-center gap-1"
              title={`${day.date} · ${day.minutes} 分钟`}
            >
              <div
                className="w-full rounded-t bg-accent/70"
                style={{ height: `${Math.max(4, (day.minutes / max) * 80)}px` }}
              />
              <span className="text-[10px] text-muted">{day.date.slice(5)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
