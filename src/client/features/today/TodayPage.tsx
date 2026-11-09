import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { addDays } from '@shared/dates';
import { todayLocal } from '@client/lib/clientDates';
import { useTasks, type TaskInput } from '@client/hooks/useTasks';
import { Button } from '@client/components/ui/Button';
import { EmptyState } from '@client/components/ui/EmptyState';
import { PageHeader } from '@client/components/ui/PageHeader';
import { DateHeader } from './DateHeader';
import { TaskGroup } from './TaskGroup';
import { TaskModal } from './TaskModal';
import { TaskRow } from './TaskRow';
import type { Task } from '@shared/types';

export function TodayPage() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? todayLocal();
  const { tasks, isLoading, create, update, remove, carryOver } = useTasks(date);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const deleteTimer = useRef<number | null>(null);

  const setDate = (next: string) => {
    const nextParams = new URLSearchParams(params);
    if (next === todayLocal()) nextParams.delete('date');
    else nextParams.set('date', next);
    setParams(nextParams);
  };

  const doneCount = tasks.filter((task) => task.done).length;
  const visible = tasks.filter((task) => task.id !== pendingDelete?.id);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (task: Task) => {
    setEditing(task);
    setModalOpen(true);
  };

  const save = (input: TaskInput) => {
    if (editing) {
      update.mutate({ id: editing.id, patch: input });
    } else {
      create.mutate(input);
    }
    setModalOpen(false);
    setEditing(null);
  };

  const toggle = (task: Task) => {
    update.mutate({ id: task.id, patch: { done: !task.done } });
  };

  const carry = (task: Task) => {
    carryOver.mutate({ id: task.id, targetDate: addDays(date, 1) });
  };

  const scheduleDelete = (task: Task) => {
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
    setPendingDelete(task);
    deleteTimer.current = window.setTimeout(() => {
      remove.mutate(task.id);
      setPendingDelete(null);
      deleteTimer.current = null;
    }, 5000);
  };

  const undoDelete = () => {
    if (deleteTimer.current) {
      window.clearTimeout(deleteTimer.current);
      deleteTimer.current = null;
    }
    setPendingDelete(null);
  };

  return (
    <div>
      <PageHeader
        title="今日计划"
        subtitle="手动事项和模块自动汇总"
        action={
          <Button onClick={openCreate}>
            <Plus size={16} />
            添加事项
          </Button>
        }
      />

      <DateHeader
        date={date}
        onChange={setDate}
        done={doneCount}
        total={tasks.length}
      />

      <div className="space-y-4">
        <TaskGroup title="我的事项" count={visible.length}>
          {isLoading ? (
            <p className="px-2 py-4 text-sm text-muted">正在加载…</p>
          ) : visible.length === 0 ? (
            <EmptyState
              title="今天还没有手动事项"
              description="加一件要做的，或者去各模块记录。"
            />
          ) : (
            visible.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggle}
                onEdit={openEdit}
                onCarryOver={carry}
                onDelete={scheduleDelete}
              />
            ))
          )}
        </TaskGroup>

        <TaskGroup title="学习" placeholder="尚未接入" />
        <TaskGroup title="健身" placeholder="尚未接入" />
        <TaskGroup title="饮食" placeholder="尚未接入" />
      </div>

      {pendingDelete ? (
        <div className="mt-4 flex items-center justify-between rounded-[10px] bg-canvas px-3 py-2 text-xs text-muted">
          <span>已删除「{pendingDelete.title}」</span>
          <button type="button" className="text-accent" onClick={undoDelete}>
            撤销
          </button>
        </div>
      ) : null}

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
    </div>
  );
}
