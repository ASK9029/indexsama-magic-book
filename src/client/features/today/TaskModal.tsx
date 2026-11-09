import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import type { TaskInput } from '@client/hooks/useTasks';
import type { Task, TaskCategory, TaskPriority } from '@shared/types';

export function TaskModal({
  open,
  onClose,
  date,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  initial?: Task | null;
  onSave: (input: TaskInput) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [time, setTime] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setCategory(initial?.category ?? 'work');
    setPriority(initial?.priority ?? 'medium');
    setTime(initial?.time ?? '');
    setNote(initial?.note ?? '');
  }, [open, initial]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      date,
      title: trimmed,
      category,
      priority,
      time: time || null,
      note,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? '编辑事项' : '添加事项'}
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="task-title" className="text-sm text-muted">
            标题
          </label>
          <Input
            id="task-title"
            className="mt-1"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="要做什么？"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-category" className="text-sm text-muted">
              分类
            </label>
            <Select
              id="task-category"
              className="mt-1"
              value={category}
              onChange={(event) => setCategory(event.target.value as TaskCategory)}
            >
              <option value="work">工作</option>
              <option value="life">生活</option>
              <option value="other">其他</option>
            </Select>
          </div>
          <div>
            <label htmlFor="task-priority" className="text-sm text-muted">
              优先级
            </label>
            <Select
              id="task-priority"
              className="mt-1"
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
            >
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="task-time" className="text-sm text-muted">
            时间（可选）
          </label>
          <Input
            id="task-time"
            type="time"
            className="mt-1"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="task-note" className="text-sm text-muted">
            备注
          </label>
          <Textarea
            id="task-note"
            className="mt-1"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!title.trim()}>
            {initial ? '保存' : '添加'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
