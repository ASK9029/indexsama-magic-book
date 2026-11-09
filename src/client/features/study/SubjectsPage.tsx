import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { EmptyState } from '@client/components/ui/EmptyState';
import { PageHeader } from '@client/components/ui/PageHeader';
import {
  useArrangements,
  type ArrangementInput,
} from '@client/hooks/useArrangements';
import { useSubjects, type SubjectInput } from '@client/hooks/useSubjects';
import { todayLocal } from '@client/lib/clientDates';
import type { StudyArrangement, Subject } from '@shared/types';
import { ArrangementModal } from './ArrangementModal';
import { SubjectCard } from './SubjectCard';
import { SubjectModal } from './SubjectModal';

export function SubjectsPage() {
  const today = todayLocal();
  const active = useSubjects(false);
  const archived = useSubjects(true);
  const arrangements = useArrangements(today);

  const [showArchived, setShowArchived] = useState(false);
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [arrangementModalOpen, setArrangementModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StudyArrangement | null>(null);
  const deleteTimer = useRef<number | null>(null);

  const subjects = showArchived ? archived.subjects : active.subjects;
  const isLoading = showArchived ? archived.isLoading : active.isLoading;
  const subjectById = new Map(
    [...active.subjects, ...archived.subjects].map((subject) => [
      subject.id,
      subject,
    ]),
  );
  const visibleArrangements = arrangements.arrangements.filter(
    (arrangement) => arrangement.id !== pendingDelete?.id,
  );

  const openCreateSubject = () => {
    setEditingSubject(null);
    setSubjectModalOpen(true);
  };

  const openEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectModalOpen(true);
  };

  const saveSubject = (input: SubjectInput) => {
    if (editingSubject) {
      active.update.mutate({ id: editingSubject.id, patch: input });
    } else {
      active.create.mutate(input);
    }
    setSubjectModalOpen(false);
    setEditingSubject(null);
  };

  const saveArrangement = (input: ArrangementInput) => {
    arrangements.create.mutate(input);
    setArrangementModalOpen(false);
  };

  const scheduleDelete = (arrangement: StudyArrangement) => {
    if (deleteTimer.current) window.clearTimeout(deleteTimer.current);
    setPendingDelete(arrangement);
    deleteTimer.current = window.setTimeout(() => {
      arrangements.remove.mutate(arrangement.id);
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
        title="学习科目"
        subtitle="按科目管理学习安排和目标"
        action={<Button onClick={openCreateSubject}>新增科目</Button>}
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium text-ink">今天要学</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setArrangementModalOpen(true)}
              disabled={active.subjects.length === 0}
            >
              添加安排
            </Button>
          </div>

          {arrangements.isLoading ? (
            <p className="mt-3 text-sm text-muted">正在加载…</p>
          ) : visibleArrangements.length === 0 ? (
            <p className="mt-3 text-sm text-muted">今天还没有学习安排。</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {visibleArrangements.map((arrangement) => {
                const subject = subjectById.get(arrangement.subjectId);
                return (
                  <li
                    key={arrangement.id}
                    className="flex items-center gap-3 rounded-[10px] border border-line/70 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      checked={arrangement.done}
                      onChange={() =>
                        arrangements.update.mutate({
                          id: arrangement.id,
                          patch: { done: !arrangement.done },
                        })
                      }
                      aria-label={`完成 ${arrangement.content}`}
                      className="h-4 w-4 rounded border-line accent-[var(--accent)]"
                    />
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: subject?.color ?? '#999999' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">{arrangement.content}</p>
                      <p className="text-xs text-muted">
                        {subject?.name ?? '未知科目'} · {arrangement.plannedMinutes} 分钟
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="删除安排"
                      onClick={() => scheduleDelete(arrangement)}
                      className="text-muted hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {pendingDelete ? (
            <div className="mt-3 flex items-center justify-between rounded-[10px] bg-canvas px-3 py-2 text-xs text-muted">
              <span>已删除「{pendingDelete.content}」</span>
              <button type="button" className="text-accent" onClick={undoDelete}>
                撤销
              </button>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-base font-medium text-ink">本周学习</h2>
          <p className="mt-2 text-sm text-muted">每周学习统计将在 Task 11 接入。</p>
        </Card>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-ink">
          {showArchived ? '已归档科目' : '我的科目'}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived((value) => !value)}
        >
          {showArchived ? '返回当前科目' : '已归档'}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">正在加载…</p>
      ) : subjects.length === 0 ? (
        <EmptyState
          title={showArchived ? '没有归档科目' : '还没有科目'}
          description={
            showArchived
              ? '归档的科目会出现在这里。'
              : '新增一个科目，开始记录学习。'
          }
          action={
            showArchived ? null : (
              <Button onClick={openCreateSubject}>新增科目</Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              archived={showArchived}
              onEdit={openEditSubject}
              onArchive={(item) => active.archive.mutate(item.id)}
              onRestore={(item) => active.restore.mutate(item.id)}
            />
          ))}
        </div>
      )}

      <SubjectModal
        open={subjectModalOpen}
        onClose={() => {
          setSubjectModalOpen(false);
          setEditingSubject(null);
        }}
        initial={editingSubject}
        onSave={saveSubject}
      />

      <ArrangementModal
        open={arrangementModalOpen}
        onClose={() => setArrangementModalOpen(false)}
        date={today}
        subjects={active.subjects}
        onSave={saveArrangement}
      />
    </div>
  );
}
