import { Trash2 } from 'lucide-react';
import { Checkbox } from '@client/components/ui/Checkbox';
import { Input } from '@client/components/ui/Input';
import type { WorkoutSet } from '@shared/types';

export function SetRow({
  set,
  onUpdate,
  onDelete,
}: {
  set: WorkoutSet;
  onUpdate: (patch: { weightKg?: number | null; reps?: number; done?: boolean }) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-line/70 px-2 py-1.5">
      <span className="w-8 text-xs text-muted">#{set.setNo}</span>
      <Input
        type="number"
        min={0}
        step={0.5}
        aria-label={`第 ${set.setNo} 组重量`}
        className="h-8 w-20"
        value={set.weightKg ?? ''}
        placeholder="kg"
        onChange={(event) =>
          onUpdate({
            weightKg:
              event.target.value === '' ? null : Number(event.target.value),
          })
        }
      />
      <span className="text-xs text-muted">×</span>
      <Input
        type="number"
        min={1}
        aria-label={`第 ${set.setNo} 组次数`}
        className="h-8 w-16"
        value={set.reps}
        onChange={(event) =>
          onUpdate({ reps: Math.max(1, Number(event.target.value) || 1) })
        }
      />
      <Checkbox checked={set.done} onChange={(done) => onUpdate({ done })} label="完成" />
      <button
        type="button"
        aria-label={`删除第 ${set.setNo} 组`}
        className="ml-auto text-muted hover:text-red-600"
        onClick={onDelete}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
