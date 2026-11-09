import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import type { Exercise } from '@shared/types';

const GROUPS = ['胸', '背', '腿', '肩', '手臂', '核心', '全身'];

export function ExercisePicker({
  open,
  onClose,
  exercises,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onAdd: (ids: string[]) => void;
}) {
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setGroup('');
    setSelected([]);
  }, [open]);

  const visible = exercises.filter(
    (exercise) =>
      (!q || exercise.name.includes(q)) &&
      (!group || exercise.muscleGroup === group),
  );

  const toggle = (id: string) => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  return (
    <Modal open={open} onClose={onClose} title="选择动作">
      <div className="flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="搜索动作"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Select
          className="max-w-28"
          value={group}
          onChange={(event) => setGroup(event.target.value)}
        >
          <option value="">全部部位</option>
          {GROUPS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="py-4 text-sm text-muted">没有符合条件的动作。</p>
        ) : (
          visible.map((exercise) => (
            <label
              key={exercise.id}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-canvas"
            >
              <input
                type="checkbox"
                checked={selected.includes(exercise.id)}
                onChange={() => toggle(exercise.id)}
                className="h-4 w-4 accent-[var(--accent)]"
              />
              <span className="flex-1 text-ink">{exercise.name}</span>
              <span className="text-xs text-muted">
                {exercise.muscleGroup} · {exercise.equipment}
              </span>
            </label>
          ))
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          取消
        </Button>
        <Button
          onClick={() => {
            onAdd(selected);
            onClose();
          }}
          disabled={selected.length === 0}
        >
          添加 {selected.length} 个
        </Button>
      </div>
    </Modal>
  );
}
