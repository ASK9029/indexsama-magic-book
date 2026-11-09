import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Checkbox } from '@client/components/ui/Checkbox';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Textarea } from '@client/components/ui/Textarea';

export function FinishSessionDialog({
  open,
  onClose,
  defaultDuration,
  setCount,
  onFinish,
}: {
  open: boolean;
  onClose: () => void;
  defaultDuration: number;
  setCount: number;
  onFinish: (input: {
    durationMinutes: number;
    note: string;
    confirmEmpty: boolean;
  }) => void;
}) {
  const [duration, setDuration] = useState('30');
  const [note, setNote] = useState('');
  const [confirmEmpty, setConfirmEmpty] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDuration(String(Math.max(1, Math.round(defaultDuration))));
    setNote('');
    setConfirmEmpty(false);
  }, [open, defaultDuration]);

  const submit = () => {
    onFinish({
      durationMinutes: Math.max(1, Math.round(Number(duration) || 1)),
      note,
      confirmEmpty,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="结束训练">
      <div className="space-y-3">
        <div>
          <label htmlFor="finish-duration" className="text-sm text-muted">
            训练时长（分钟）
          </label>
          <Input
            id="finish-duration"
            className="mt-1"
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="finish-note" className="text-sm text-muted">
            备注
          </label>
          <Textarea
            id="finish-note"
            className="mt-1"
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
        {setCount === 0 ? (
          <Checkbox
            checked={confirmEmpty}
            onChange={setConfirmEmpty}
            label="还没有训练组，确认结束"
          />
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={setCount === 0 && !confirmEmpty}>
            保存并结束
          </Button>
        </div>
      </div>
    </Modal>
  );
}
