import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useTasks, type TaskInput } from '@client/hooks/useTasks';
import { todayLocal } from '@client/lib/clientDates';
import type { Task } from '@shared/types';
import { TaskModal } from '../today/TaskModal';

export function TodayPlanCard() {
  const date = todayLocal();
  const { tasks, isLoading, create, update } = useTasks(date);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const incomplete = tasks.filter((task) => !task.done);
  const visible = incomplete.slice(0, 5);
  const done = tasks.filter((task) => task.done).length;

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setModalOpen(true);
  };

  const save = (input: TaskInput) => {
    if (editing) update.mutate({ id: editing.id, patch: input });
    else create.mutate(input);
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-ink">今日计划</h2>
        <Link to="/today" className="text-xs text-accent">
          查看全部
        </Link>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">正在加载…</p>
      ) : visible.length === 0 ? (
        <p className="mt-4 text-sm text-muted">今天还没有安排。</p>
      ) : (
        <ul className="mt-3 space-y-1">
          {visible.map((task) => (
            <li
              key={task.id}
              className="flex items-center gap-3 rounded-[10px] px-1 py-2 hover:bg-canvas/60"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() =>
                  update.mutate({ id: task.id, patch: { done: !task.done } })
                }
                aria-label={`完成 ${task.title}`}
                className="h-4 w-4 rounded border-line accent-[var(--accent)]"
              />
              <button
                type="button"
                className="min-w-0 flex-1 truncate text-left text-sm text-ink"
                onClick={() => openEdit(task)}
              >
                {task.title}
              </button>
              {task.time ? (
                <span className="shrink-0 text-xs text-muted">{task.time}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {incomplete.length > 5 ? (
        <Link to="/today" className="mt-2 text-xs text-muted">
          还有 {incomplete.length - 5} 件，查看全部
        </Link>
      ) : null}

      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-xs text-muted">已完成 {done} 件</span>
        <Button variant="ghost" size="sm" onClick={openCreate}>
          <Plus size={14} />
          加一件事
        </Button>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        date={date}
        initial={editing}
        onSave={save}
      />
    </Card>
  );
}
