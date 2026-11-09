import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { todayLocal } from '@client/lib/clientDates';
import type { WeightLog } from '@shared/types';

export function WeightModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: WeightLog | null;
  onSave: (input: { date: string; weightKg: number }) => void;
}) {
  const [date, setDate] = useState(todayLocal());
  const [weight, setWeight] = useState('');

  useEffect(() => {
    if (!open) return;
    setDate(initial?.date ?? todayLocal());
    setWeight(initial ? String(initial.weightKg) : '');
  }, [open, initial]);

  const submit = () => {
    const value = Number(weight);
    if (!date || !Number.isFinite(value) || value <= 0) return;
    onSave({ date, weightKg: value });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? '编辑体重' : '记录体重'}>
      <div className="space-y-3">
        <div>
          <label htmlFor="weight-date" className="text-sm text-muted">
            日期
          </label>
          <Input
            id="weight-date"
            className="mt-1"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="weight-value" className="text-sm text-muted">
            体重（kg）
          </label>
          <Input
            id="weight-value"
            className="mt-1"
            type="number"
            min={1}
            step={0.1}
            value={weight}
            onChange={(event) => setWeight(event.target.value)}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!date || !weight}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
