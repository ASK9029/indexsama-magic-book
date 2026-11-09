import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { addDays } from '@shared/dates';
import { todayLocal } from '@client/lib/clientDates';
import { useTasks, type TaskInput } from '@client/hooks/useTasks';
import { useArrangements } from '@client/hooks/useArrangements';
import { useSubjects } from '@client/hooks/useSubjects';
import { useDay } from '@client/hooks/useDay';
import { useDietMutations } from '@client/hooks/useDietDay';
import { Button } from '@client/components/ui/Button';
import { EmptyState } from '@client/components/ui/EmptyState';
import { PageHeader } from '@client/components/ui/PageHeader';
import { DateHeader } from './DateHeader';
import { TaskGroup } from './TaskGroup';
import { TaskModal } from './TaskModal';
import { TaskRow } from './TaskRow';
import type { Meal, Task } from '@shared/types';

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export function TodayPage() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') ?? todayLocal();
  const { tasks, isLoading, create, update, remove, carryOver } = useTasks(date);
  const {
    arrangements,
    isLoading: arrangementsLoading,
    update: updateArrangement,
  } = useArrangements(date);
  const { subjects } = useSubjects(false);
  const { data: day } = useDay(date);
  const dietMutations = useDietMutations(date);
  const prevDate = addDays(date, -1);
  const prev = useTasks(prevDate);

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
  const studyItems = day?.study?.arrangements ?? arrangements;
  const plannedMeals = day?.diet?.meals?.filter((meal) => meal.planned) ?? [];
  const fitness = day?.fitness;
  const hasFitness = Boolean(
    fitness?.session ||
      (fitness?.plan && !fitness.plan.isRest && fitness.plan.exercises.length > 0),
  );
  const progressDone = day?.progress?.done ?? doneCount;
  const progressTotal = day?.progress?.total ?? tasks.length;
  const prevIncomplete = prev.tasks.filter((task) => !task.done);

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
        done={progressDone}
        total={progressTotal}
      />

      {prevIncomplete.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-card border border-amber-300 bg-amber-50 px-4 py-3">
          <span className="text-sm text-amber-800">
            昨天还有 {prevIncomplete.length} 件未完成
          </span>
          <div className="flex items-center gap-2">
            <Link
              to={`/today?date=${prevDate}`}
              className="text-sm text-accent"
            >
              查看昨天
            </Link>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                prevIncomplete.forEach((task) =>
                  prev.carryOver.mutate({ id: task.id, targetDate: date }),
                );
              }}
            >
              全部顺延
            </Button>
          </div>
        </div>
      ) : null}

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

        <TaskGroup title="学习" count={studyItems.length}>
          {arrangementsLoading && !day ? (
            <p className="px-2 py-4 text-sm text-muted">正在加载…</p>
          ) : studyItems.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted">今天没有学习安排。</p>
          ) : (
            studyItems.map((arrangement) => {
              const subject = subjects.find(
                (item) => item.id === arrangement.subjectId,
              );
              const actualMinutes =
                'actualMinutes' in arrangement
                  ? arrangement.actualMinutes
                  : undefined;
              return (
                <div
                  key={arrangement.id}
                  className="flex items-center gap-3 rounded-[10px] px-2 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={arrangement.done}
                    onChange={() =>
                      updateArrangement.mutate({
                        id: arrangement.id,
                        patch: { done: !arrangement.done },
                      })
                    }
                    aria-label={`完成 ${arrangement.content}`}
                    className="h-4 w-4 rounded border-line accent-[var(--accent)]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink">
                      {arrangement.content}
                    </p>
                    <p className="text-xs text-muted">
                      {subject?.name ?? '未知科目'} · {arrangement.plannedMinutes}{' '}
                      分钟
                      {actualMinutes !== undefined
                        ? ` · 实际 ${actualMinutes} 分钟`
                        : ''}
                    </p>
                  </div>
                  <Link
                    to="/study/subjects"
                    className="text-xs text-accent"
                  >
                    去学习
                  </Link>
                </div>
              );
            })
          )}
        </TaskGroup>

        <TaskGroup title="健身" count={hasFitness ? 1 : 0}>
          {hasFitness ? (
            <div className="flex items-center gap-3 rounded-[10px] px-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">
                  {fitness?.session?.name ?? fitness?.plan?.name ?? '今日训练'}
                </p>
                <p className="text-xs text-muted">
                  {fitness?.session
                    ? `${fitness.session.status === 'completed' ? '已完成' : '进行中'} · ${fitness.session.durationMinutes ?? 0} 分钟`
                    : '按周计划训练；完成状态来自训练会话'}
                </p>
              </div>
              <Link to="/fitness?tab=today" className="text-xs text-accent">
                去训练
              </Link>
            </div>
          ) : (
            <p className="px-2 py-4 text-sm text-muted">今天没有训练。</p>
          )}
        </TaskGroup>

        <TaskGroup title="饮食" count={plannedMeals.length}>
          {plannedMeals.length === 0 ? (
            <p className="px-2 py-4 text-sm text-muted">今天没有计划饮食。</p>
          ) : (
            plannedMeals.map((meal) => (
              <div
                key={meal.meal}
                className="flex items-center gap-3 rounded-[10px] px-2 py-2.5"
              >
                <input
                  type="checkbox"
                  checked={meal.done}
                  onChange={() =>
                    dietMutations.setDone.mutate({
                      meal: meal.meal,
                      done: !meal.done,
                    })
                  }
                  aria-label={`完成 ${MEAL_LABELS[meal.meal]}`}
                  className="h-4 w-4 rounded border-line accent-[var(--accent)]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{MEAL_LABELS[meal.meal]}</p>
                  <p className="text-xs text-muted">
                    计划 {Math.round(meal.plannedCalories)} kcal · 实际{' '}
                    {Math.round(meal.actualCalories)} kcal
                  </p>
                </div>
                <Link to="/diet" className="text-xs text-accent">
                  去记录
                </Link>
              </div>
            ))
          )}
        </TaskGroup>
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
