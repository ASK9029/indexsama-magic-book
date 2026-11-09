import { Link } from 'react-router-dom';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { ProgressBar } from '@client/components/ui/ProgressBar';
import type { Subject } from '@shared/types';

export function SubjectCard({
  subject,
  archived = false,
  weekMinutes = 0,
  totalMinutes = 0,
  onEdit,
  onArchive,
  onStart,
  onRestore,
}: {
  subject: Subject;
  archived?: boolean;
  weekMinutes?: number;
  totalMinutes?: number;
  onEdit?: (subject: Subject) => void;
  onArchive?: (subject: Subject) => void;
  onStart?: (subject: Subject) => void;
  onRestore?: (subject: Subject) => void;
}) {
  const weeklyHours = (subject.weeklyTargetMinutes / 60).toFixed(1);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
          <Link
            to={`/study/subjects/${subject.id}`}
            className="truncate text-base font-medium text-ink hover:text-accent"
          >
            {subject.name}
          </Link>
        </div>
        {archived ? <span className="text-xs text-muted">已归档</span> : null}
      </div>

      <p className="line-clamp-2 text-sm text-muted">
        {subject.goal || '还没有写目标。'}
      </p>

      <div>
        <div className="flex justify-between text-xs text-muted">
          <span>
            本周 {weekMinutes} 分钟 / {weeklyHours} 小时
          </span>
          <span>累计 {totalMinutes} 分钟</span>
        </div>
        <ProgressBar
          value={weekMinutes}
          max={Math.max(subject.weeklyTargetMinutes, 1)}
          className="mt-1"
        />
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <span className="text-xs text-muted">资料 0</span>
        {archived ? (
          <Button size="sm" variant="secondary" onClick={() => onRestore?.(subject)}>
            恢复
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit?.(subject)}>
              编辑
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onArchive?.(subject)}>
              归档
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={!onStart}
              onClick={() => onStart?.(subject)}
            >
              开始学习
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
