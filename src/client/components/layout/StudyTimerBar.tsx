import { useStudyTimer } from '@client/hooks/useStudyTimer';
import { useSubjects } from '@client/hooks/useSubjects';
import { Button } from '@client/components/ui/Button';

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(rest)}`
    : `${pad(minutes)}:${pad(rest)}`;
}

export function StudyTimerBar() {
  const { timer, elapsedSeconds, pause, resume, stop } = useStudyTimer();
  const { subjects } = useSubjects(false);

  if (!timer || timer.status === 'idle') return null;

  const subject = subjects.find((item) => item.id === timer.subjectId);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-accent/10 px-6 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
        <span className="font-medium text-ink">{subject?.name ?? '学习'}</span>
        <span className="tabular-nums text-muted">{formatClock(elapsedSeconds)}</span>
        {timer.status === 'paused' ? (
          <span className="text-xs text-muted">已暂停</span>
        ) : null}
      </div>
      <div className="flex gap-2">
        {timer.status === 'running' ? (
          <Button size="sm" variant="secondary" onClick={pause}>
            暂停
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={resume}>
            继续
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={stop}>
          结束
        </Button>
      </div>
    </div>
  );
}
