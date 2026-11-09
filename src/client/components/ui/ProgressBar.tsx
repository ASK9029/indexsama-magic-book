import { cn } from '@client/lib/cn';

export interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const percentage =
    max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-line/60', className)}
    >
      <div
        className="h-full rounded-full bg-accent transition-[width]"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
