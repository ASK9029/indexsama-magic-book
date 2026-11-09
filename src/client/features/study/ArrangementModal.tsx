import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import type { ArrangementInput } from '@client/hooks/useArrangements';
import type { Subject } from '@shared/types';

export function ArrangementModal({
  open,
  onClose,
  date,
  subjects,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  subjects: Subject[];
  onSave: (input: ArrangementInput) => void;
}) {
  const [subjectId, setSubjectId] = useState('');
  const [content, setContent] = useState('');
  const [minutes, setMinutes] = useState('30');

  useEffect(() => {
    if (!open) return;
    setSubjectId(subjects[0]?.id ?? '');
    setContent('');
    setMinutes('30');
  }, [open, subjects]);

  const submit = () => {
    const trimmed = content.trim();
    const plannedMinutes = Number(minutes);
    if (!subjectId || !trimmed || !Number.isFinite(plannedMinutes)) return;
    onSave({
      subjectId,
      date,
      content: trimmed,
      plannedMinutes: Math.max(1, Math.min(600, Math.round(plannedMinutes))),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="添加学习安排">
      <div className="space-y-3">
        <p className="text-xs text-muted">日期：{date}</p>

        <div>
          <label htmlFor="arrangement-subject" className="text-sm text-muted">
            科目
          </label>
          <Select
            id="arrangement-subject"
            className="mt-1"
            value={subjectId}
            onChange={(event) => setSubjectId(event.target.value)}
          >
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="arrangement-content" className="text-sm text-muted">
            学习内容
          </label>
          <Input
            id="arrangement-content"
            className="mt-1"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="今天准备学什么？"
          />
        </div>

        <div>
          <label htmlFor="arrangement-minutes" className="text-sm text-muted">
            计划分钟
          </label>
          <Input
            id="arrangement-minutes"
            className="mt-1"
            type="number"
            min={1}
            max={600}
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={submit}
            disabled={!subjectId || !content.trim() || Number(minutes) < 1}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
