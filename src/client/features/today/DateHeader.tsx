import { DateNav } from '@client/components/ui/DateNav';
import { ProgressBar } from '@client/components/ui/ProgressBar';

export function DateHeader({
  date,
  onChange,
  done,
  total,
}: {
  date: string;
  onChange: (date: string) => void;
  done: number;
  total: number;
}) {
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="mb-5 rounded-card border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav value={date} onChange={onChange} />
        <div className="text-sm text-muted">
          {done} / {total} 完成
        </div>
      </div>
      <ProgressBar value={done} max={Math.max(total, 1)} className="mt-3" />
      <p className="mt-1 text-xs text-muted">{percentage}%</p>
    </div>
  );
}
