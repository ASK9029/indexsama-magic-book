import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Textarea } from '@client/components/ui/Textarea';
import type { SubjectInput } from '@client/hooks/useSubjects';
import type { Subject } from '@shared/types';

const COLORS = [
  '#2F6B5E',
  '#D97757',
  '#5B7DB1',
  '#B07AA1',
  '#E0A458',
  '#6A9A5B',
  '#C25B5B',
  '#7A6A5B',
];

export function SubjectModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Subject | null;
  onSave: (input: SubjectInput) => void;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [goal, setGoal] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('0');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setColor(initial?.color ?? COLORS[0]);
    setGoal(initial?.goal ?? '');
    setWeeklyHours(String((initial?.weeklyTargetMinutes ?? 0) / 60));
  }, [open, initial]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const hours = Number(weeklyHours);
    onSave({
      name: trimmed,
      color,
      goal: goal.trim(),
      weeklyTargetMinutes: Number.isFinite(hours)
        ? Math.max(0, Math.round(hours * 60))
        : 0,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? '编辑科目' : '新增科目'}
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="subject-name" className="text-sm text-muted">
            科目名称
          </label>
          <Input
            id="subject-name"
            className="mt-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="例如：线性代数"
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="subject-goal" className="text-sm text-muted">
            一句目标
          </label>
          <Textarea
            id="subject-goal"
            className="mt-1"
            rows={2}
            value={goal}
            onChange={(event) => setGoal(event.target.value)}
            placeholder="这一阶段想达成什么？"
          />
        </div>

        <div>
          <label htmlFor="subject-hours" className="text-sm text-muted">
            每周目标（小时）
          </label>
          <Input
            id="subject-hours"
            className="mt-1"
            type="number"
            min={0}
            max={168}
            step={0.5}
            value={weeklyHours}
            onChange={(event) => setWeeklyHours(event.target.value)}
          />
        </div>

        <div>
          <div className="text-sm text-muted">颜色</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={option}
                onClick={() => setColor(option)}
                className={`h-7 w-7 rounded-full ${
                  color === option ? 'ring-2 ring-ink ring-offset-2' : ''
                }`}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!name.trim()}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
