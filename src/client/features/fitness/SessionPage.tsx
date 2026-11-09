import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@client/components/ui/Button';
import { useConfirm } from '@client/components/ui/Confirm';
import { useExercises } from '@client/hooks/useExercises';
import {
  useWorkoutMutations,
  useWorkoutSession,
} from '@client/hooks/useWorkout';
import { formatClock } from '@client/components/layout/StudyTimerBar';
import { useCurrentWeights } from '@client/hooks/useUpgrades';
import type { WorkoutSession, WorkoutSet } from '@shared/types';
import { ExercisePicker } from './ExercisePicker';
import { ExerciseSetCard } from './ExerciseSetCard';
import { FinishSessionDialog } from './FinishSessionDialog';
import { SessionSummaryDrawer } from './SessionSummaryDrawer';

export function SessionPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { data: session, isLoading } = useWorkoutSession(id);
  const { exercises } = useExercises();
  const { data: currentWeights = [] } = useCurrentWeights();
  const {
    addSet,
    updateSet,
    deleteSet,
    deleteSession,
    finish,
  } = useWorkoutMutations();

  const [now, setNow] = useState(() => Date.now());
  const [finishOpen, setFinishOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [summarySession, setSummarySession] =
    useState<WorkoutSession | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted">正在加载…</div>;
  }

  if (!session) {
    return <div className="p-6 text-sm text-muted">训练不存在。</div>;
  }

  const elapsed =
    session.status === 'completed'
      ? (session.durationMinutes ?? 0) * 60
      : Math.max(
          0,
          Math.floor((now - new Date(session.startAt).getTime()) / 1000),
        );

  const groups = new Map<string, WorkoutSet[]>();
  for (const set of session.sets) {
    const key = set.exerciseId ?? set.exerciseName;
    const list = groups.get(key) ?? [];
    list.push(set);
    groups.set(key, list);
  }

  const addSetFor = (exerciseId: string | null, exerciseName: string) => {
    const same = session.sets.filter((set) =>
      exerciseId
        ? set.exerciseId === exerciseId
        : set.exerciseName === exerciseName,
    );
    const last = same[same.length - 1];
    addSet.mutate({
      sessionId: session.id,
      input: {
        exerciseId,
        exerciseName,
        reps: last?.reps ?? 8,
        weightKg: last?.weightKg ?? null,
      },
    });
  };

  const abandon = async () => {
    const ok = await confirm({
      title: '放弃训练',
      description: '这次草稿会被删除。',
      confirmText: '放弃',
      danger: true,
    });
    if (ok) {
      deleteSession.mutate(session.id, {
        onSuccess: () => navigate('/fitness'),
      });
    }
  };

  const handleFinish = (input: {
    durationMinutes: number;
    note: string;
    confirmEmpty: boolean;
  }) => {
    finish.mutate(
      {
        id: session.id,
        durationMinutes: input.durationMinutes,
        note: input.note,
        confirmEmpty: input.confirmEmpty,
      },
      {
        onSuccess: (completed) => {
          setFinishOpen(false);
          setSummarySession(completed);
          setSummaryOpen(true);
        },
      },
    );
  };

  return (
    <div className="min-h-screen bg-canvas p-6 text-ink">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="返回健身"
              className="rounded-[10px] border border-line bg-surface px-3 py-1.5 text-sm text-muted"
              onClick={() => navigate('/fitness')}
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-semibold">{session.name || '训练'}</h1>
              <p className="text-xs text-muted">
                {session.date} ·{' '}
                {session.status === 'completed' ? '已完成' : '草稿'} ·{' '}
                {formatClock(elapsed)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => void abandon()}>
              放弃
            </Button>
            <Button
              onClick={() => setFinishOpen(true)}
              disabled={session.status === 'completed'}
            >
              结束训练
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {[...groups.entries()].map(([key, sets]) => (
            <ExerciseSetCard
              key={key}
              exerciseName={sets[0].exerciseName}
              sets={sets}
              defaultWeight={
                sets[0].exerciseId
                  ? (currentWeights.find(
                      (item) => item.exerciseId === sets[0].exerciseId,
                    )?.currentWeightKg ?? null)
                  : null
              }
              onAddSet={() =>
                addSetFor(sets[0].exerciseId, sets[0].exerciseName)
              }
              onUpdateSet={(id, patch) => updateSet.mutate({ id, patch })}
              onDeleteSet={(id) => deleteSet.mutate(id)}
            />
          ))}
        </div>

        <Button
          className="mt-4"
          variant="secondary"
          onClick={() => setPickerOpen(true)}
        >
          添加动作
        </Button>

        <FinishSessionDialog
          open={finishOpen}
          onClose={() => setFinishOpen(false)}
          defaultDuration={Math.max(1, Math.round(elapsed / 60))}
          setCount={session.sets.length}
          onFinish={handleFinish}
        />

        <SessionSummaryDrawer
          open={summaryOpen}
          onClose={() => setSummaryOpen(false)}
          session={summarySession}
        />

        <ExercisePicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          exercises={exercises}
          onAdd={(ids) => {
            for (const exerciseId of ids) {
              const exercise = exercises.find((item) => item.id === exerciseId);
              if (!exercise) continue;
              addSetFor(exercise.id, exercise.name);
            }
          }}
        />
      </div>
    </div>
  );
}
