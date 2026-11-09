import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Checkbox } from '@client/components/ui/Checkbox';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import type { Exercise, PlanDay, PlanExercise } from '@shared/types';
import { ExercisePicker } from './ExercisePicker';

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function PlanDayModal({
  open,
  onClose,
  day,
  exercises,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  day: PlanDay;
  exercises: Exercise[];
  onSave: (input: {
    name: string;
    isRest: boolean;
    exercises: PlanExercise[];
  }) => void;
}) {
  const [name, setName] = useState('');
  const [isRest, setIsRest] = useState(true);
  const [rows, setRows] = useState<PlanExercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(day.name);
    setIsRest(day.isRest);
    setRows(day.exercises.map((row) => ({ ...row })));
  }, [open, day]);

  const updateRow = (index: number, patch: Partial<PlanExercise>) => {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, rowIndex) => rowIndex !== index));
  };

  const addExercises = (ids: string[]) => {
    setRows((current) => {
      const next = [...current];
      for (const id of ids) {
        if (next.some((row) => row.exerciseId === id)) continue;
        next.push({
          exerciseId: id,
          targetSets: 3,
          targetReps: '8-12',
          sortOrder: next.length,
        });
      }
      return next;
    });
  };

  const save = () => {
    onSave({
      name: name.trim(),
      isRest,
      exercises: rows.map((row, index) => ({ ...row, sortOrder: index })),
    });
  };

  const exerciseName = (id: string) =>
    exercises.find((exercise) => exercise.id === id)?.name ?? id;

  return (
    <Modal open={open} onClose={onClose} title={`编辑${WEEKDAYS[day.weekday - 1]}`}>
      <div className="space-y-3">
        <div>
          <label htmlFor="plan-day-name" className="text-sm text-muted">
            训练名称
          </label>
          <Input
            id="plan-day-name"
            className="mt-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：推日"
          />
        </div>

        <Checkbox checked={isRest} onChange={setIsRest} label="休息日" />

        {!isRest ? (
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-ink">动作</h3>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPickerOpen(true)}
              >
                添加动作
              </Button>
            </div>

            {rows.length === 0 ? (
              <p className="mt-2 text-sm text-muted">还没有动作。</p>
            ) : (
              rows.map((row, index) => (
                <div
                  key={`${row.exerciseId}-${index}`}
                  className="mt-2 flex flex-wrap items-center gap-2 rounded-[10px] border border-line px-2 py-1.5"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {exerciseName(row.exerciseId)}
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    aria-label="目标组数"
                    className="w-16"
                    value={row.targetSets}
                    onChange={(event) =>
                      updateRow(index, {
                        targetSets: Math.max(1, Number(event.target.value) || 1),
                      })
                    }
                  />
                  <Input
                    aria-label="目标次数"
                    className="w-20"
                    value={row.targetReps}
                    onChange={(event) =>
                      updateRow(index, { targetReps: event.target.value })
                    }
                  />
                  <button
                    type="button"
                    aria-label="上移"
                    className="px-1 text-muted hover:text-ink"
                    onClick={() => move(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    aria-label="下移"
                    className="px-1 text-muted hover:text-ink"
                    onClick={() => move(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    aria-label="删除动作"
                    className="px-1 text-muted hover:text-red-600"
                    onClick={() => removeRow(index)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={save}>保存</Button>
        </div>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        exercises={exercises}
        onAdd={addExercises}
      />
    </Modal>
  );
}
