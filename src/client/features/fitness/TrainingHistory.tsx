import { Link } from 'react-router-dom';
import { useWorkoutHistory, useWorkoutMutations } from '@client/hooks/useWorkout';
import { formatMinutes } from '@shared/format';

export function TrainingHistory() {
  const { data, isLoading } = useWorkoutHistory();
  const { deleteSession } = useWorkoutMutations();

  if (isLoading) return <p className="text-sm text-muted">正在加载…</p>;
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted">还没有训练记录。</p>;
  }

  return (
    <div className="space-y-2">
      {data.map((session) => (
        <div
          key={session.id}
          className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-surface px-3 py-2"
        >
          <Link
            to={`/fitness/session/${session.id}`}
            className="min-w-0 flex-1 text-sm text-ink hover:text-accent"
          >
            {session.date} · {session.name || '训练'}
          </Link>
          <span className="text-xs text-muted">
            {session.durationMinutes
              ? formatMinutes(session.durationMinutes)
              : '—'}
          </span>
          <span className="text-xs text-muted">
            {session.sets.filter((set) => set.done).length} 组
          </span>
          <button
            type="button"
            className="text-xs text-muted hover:text-red-600"
            onClick={() => deleteSession.mutate(session.id)}
          >
            删除
          </button>
        </div>
      ))}
    </div>
  );
}
