import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@client/components/ui/Checkbox';
import type { Task } from '@shared/types';

const priorityLabels = { high: '高', medium: '中', low: '低' } as const;
const categoryLabels = { work: '工作', life: '生活', other: '其他' } as const;

export function TaskRow({
  task,
  onToggle,
  onEdit,
  onCarryOver,
  onDelete,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onCarryOver: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative flex items-start gap-3 rounded-[10px] px-2 py-2.5 hover:bg-canvas/60">
      <div className="mt-0.5">
        <Checkbox
          checked={task.done}
          onChange={() => onToggle(task)}
          label={task.title}
          className={task.done ? 'text-muted line-through' : ''}
        />
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 text-xs text-muted">
        <span className="rounded bg-canvas px-1.5 py-0.5">{priorityLabels[task.priority]}</span>
        <span>{categoryLabels[task.category]}</span>
        {task.time ? <span>{task.time}</span> : null}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="更多操作"
          onClick={() => setMenuOpen((open) => !open)}
          className="rounded p-1 text-muted hover:bg-canvas hover:text-ink"
        >
          <MoreHorizontal size={16} />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 top-7 z-10 w-32 rounded-[10px] border border-line bg-surface p-1 shadow-lg">
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-canvas"
              onClick={() => {
                setMenuOpen(false);
                onEdit(task);
              }}
            >
              编辑
            </button>
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm text-ink hover:bg-canvas"
              onClick={() => {
                setMenuOpen(false);
                onCarryOver(task);
              }}
            >
              顺延到明天
            </button>
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm text-red-600 hover:bg-canvas"
              onClick={() => {
                setMenuOpen(false);
                onDelete(task);
              }}
            >
              删除
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
