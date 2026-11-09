import { addDays } from '@shared/dates';
import { formatDateLabel, todayLocal } from '@client/lib/clientDates';
import { cn } from '@client/lib/cn';
import { Button } from './Button';

export interface DateNavProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateNav({ value, onChange, className }: DateNavProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="sm"
        aria-label="前一天"
        onClick={() => onChange(addDays(value, -1))}
      >
        ‹
      </Button>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-[10px] border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent"
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label="后一天"
        onClick={() => onChange(addDays(value, 1))}
      >
        ›
      </Button>
      {value !== todayLocal() ? (
        <Button variant="secondary" size="sm" onClick={() => onChange(todayLocal())}>
          今天
        </Button>
      ) : null}
      <span className="text-sm text-muted">{formatDateLabel(value)}</span>
    </div>
  );
}
