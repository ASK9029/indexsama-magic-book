import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useConfirm } from '@client/components/ui/Confirm';
import {
  useStudySessions,
  type SessionInput,
} from '@client/hooks/useStudySessions';
import { formatMinutes } from '@shared/format';
import type { StudySession } from '@shared/types';
import { SessionModal } from './SessionModal';

export function SubjectSessions({ subjectId }: { subjectId: string }) {
  const { sessions, isLoading, create, update, remove } =
    useStudySessions(subjectId);
  const { confirm } = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StudySession | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (session: StudySession) => {
    setEditing(session);
    setModalOpen(true);
  };

  const save = (input: SessionInput) => {
    if (editing) update.mutate({ id: editing.id, patch: input });
    else create.mutate(input);
    setModalOpen(false);
    setEditing(null);
  };

  const removeSession = async (session: StudySession) => {
    const ok = await confirm({
      title: '删除学习记录',
      description: '删除后无法恢复。',
      confirmText: '删除',
      danger: true,
    });
    if (ok) remove.mutate(session.id);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-ink">学习记录</h2>
        <Button variant="secondary" size="sm" onClick={openCreate}>
          补记
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted">正在加载…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-3 text-sm text-muted">还没有学习记录。</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {sessions.map((session) => (
            <li
              key={session.id}
              className="flex items-start justify-between gap-3 rounded-[10px] border border-line/70 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm text-ink">
                  {session.date} · {formatMinutes(session.durationMinutes)}
                </p>
                {session.note ? (
                  <p className="mt-0.5 text-xs text-muted">{session.note}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEdit(session)}
                >
                  编辑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeSession(session)}
                >
                  删除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SessionModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        subjectId={subjectId}
        initial={editing}
        onSave={save}
      />
    </Card>
  );
}
