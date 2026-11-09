import { Trash2 } from 'lucide-react';
import { formatCalories } from '@shared/format';
import type { MealEntry } from '@shared/types';

export function MealEntryRow({
  entry,
  onDelete,
}: {
  entry: MealEntry;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-line/60 px-2 py-1.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">{entry.foodName}</p>
        <p className="text-xs text-muted">
          {entry.amount}
          {entry.unit}
          {entry.servingLabel ? ` · ${entry.servingLabel}` : ''}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs text-muted">
        <p>{formatCalories(entry.calories)}</p>
        <p>蛋白 {entry.protein.toFixed(1)} g</p>
      </div>
      <button
        type="button"
        aria-label={`删除 ${entry.foodName}`}
        className="text-muted hover:text-red-600"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
