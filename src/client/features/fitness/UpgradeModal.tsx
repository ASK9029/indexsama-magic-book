import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import type { CurrentWeight, UpgradeInput } from '@client/hooks/useUpgrades';
import { todayLocal } from '@client/lib/clientDates';
import type { Exercise, ExerciseUpgrade } from '@shared/types';

export function UpgradeModal({
  open,
  onClose,
  exercises,
  currentWeights,
  initial,
  fixedExerciseId,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  exercises: Exercise[];
  currentWeights: CurrentWeight[];
  initial?: ExerciseUpgrade | null;
  fixedExerciseId?: string;
  onSave: (input: UpgradeInput) => void;
}) {
  const [exerciseId, setExerciseId] = useState('');
  const [date, setDate] = useState(todayLocal());
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');

  const currentFor = (id: string) =>
    currentWeights.find((item) => item.exerciseId === id)?.currentWeightKg;

  useEffect(() => {
    if (!open) return;
    const nextId =
      initial?.exerciseId ?? fixedExerciseId ?? exercises[0]?.id ?? '';
    setExerciseId(nextId);
    setDate(initial?.date ?? todayLocal());
    setFrom(
      String(initial?.fromWeightKg ?? currentFor(nextId) ?? ''),
    );
    setTo(initial ? String(initial.toWeightKg) : '');
    setNote(initial?.note ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial, fixedExerciseId]);

  const fromNumber = Number(from);
  const toNumber = Number(to);
  const difference =
    Number.isFinite(fromNumber) && Number.isFinite(toNumber)
      ? toNumber - fromNumber
      : 0;
  const canSave =
    exerciseId &&
    to !== '' &&
    Number.isFinite(toNumber) &&
    from !== '' &&
    Number.isFinite(fromNumber) &&
    toNumber !== fromNumber;

  const submit = () => {
    if (!canSave) return;
    onSave({
      exerciseId,
      date,
      fromWeightKg: fromNumber,
      toWeightKg: toNumber,
      note,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? '编辑升级记录' : '记录重量升级'}
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="upgrade-exercise" className="text-sm text-muted">
            动作
          </label>
          <Select
            id="upgrade-exercise"
            className="mt-1"
            value={exerciseId}
            onChange={(event) => {
              const next = event.target.value;
              setExerciseId(next);
              setFrom(String(currentFor(next) ?? ''));
            }}
            disabled={Boolean(fixedExerciseId || initial)}
          >
            {exercises.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="upgrade-date" className="text-sm text-muted">
            日期
          </label>
          <Input
            id="upgrade-date"
            className="mt-1"
            type="date"
            max={todayLocal()}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="upgrade-from" className="text-sm text-muted">
              原重量（kg）
            </label>
            <Input
              id="upgrade-from"
              className="mt-1"
              type="number"
              min={0}
              step={0.5}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="upgrade-to" className="text-sm text-muted">
              新重量（kg）
            </label>
            <Input
              id="upgrade-to"
              className="mt-1"
              type="number"
              min={0}
              step={0.5}
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>
        </div>

        <p className="text-xs text-muted">
          差额：{difference > 0 ? '+' : ''}
          {difference.toFixed(1)} kg
        </p>

        <div>
          <label htmlFor="upgrade-note" className="text-sm text-muted">
            备注
          </label>
          <Textarea
            id="upgrade-note"
            className="mt-1"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!canSave}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
