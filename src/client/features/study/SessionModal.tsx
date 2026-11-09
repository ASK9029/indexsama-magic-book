import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Textarea } from '@client/components/ui/Textarea';
import type { SessionInput } from '@client/hooks/useStudySessions';
import { todayLocal } from '@client/lib/clientDates';
import type { StudySession } from '@shared/types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toLocalInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function SessionModal({
  open,
  onClose,
  subjectId,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  initial?: StudySession | null;
  onSave: (input: SessionInput) => void;
}) {
  const [date, setDate] = useState(todayLocal());
  const [start, setStart] = useState(`${todayLocal()}T09:00`);
  const [end, setEnd] = useState(`${todayLocal()}T09:30`);
  const [duration, setDuration] = useState('30');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    const nextDate = initial?.date ?? todayLocal();
    setDate(nextDate);
    setStart(
      initial?.startAt
        ? toLocalInput(initial.startAt)
        : `${nextDate}T09:00`,
    );
    setEnd(
      initial?.endAt ? toLocalInput(initial.endAt) : `${nextDate}T09:30`,
    );
    setDuration(String(initial?.durationMinutes ?? 30));
    setNote(initial?.note ?? '');
  }, [open, initial]);

  const submit = () => {
    if (!date || !start || !end) return;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return;
    }
    onSave({
      subjectId,
      date,
      startAt: startDate.toISOString(),
      endAt: endDate.toISOString(),
      durationMinutes: Math.max(1, Math.round(Number(duration) || 1)),
      note,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? '编辑学习记录' : '补记学习'}
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="session-date" className="text-sm text-muted">
            日期
          </label>
          <Input
            id="session-date"
            className="mt-1"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="session-start" className="text-sm text-muted">
              开始
            </label>
            <Input
              id="session-start"
              className="mt-1"
              type="datetime-local"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="session-end" className="text-sm text-muted">
              结束
            </label>
            <Input
              id="session-end"
              className="mt-1"
              type="datetime-local"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="session-duration" className="text-sm text-muted">
            时长（分钟）
          </label>
          <Input
            id="session-duration"
            className="mt-1"
            type="number"
            min={1}
            max={1440}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="session-note" className="text-sm text-muted">
            备注
          </label>
          <Textarea
            id="session-note"
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
          <Button onClick={submit} disabled={!date || !start || !end}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
