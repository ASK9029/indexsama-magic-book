import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { useExercises } from '@client/hooks/useExercises';
import { useFitnessPlan } from '@client/hooks/useFitnessPlan';
import {
  useCurrentWeights,
  useUpgradeMutations,
  type CurrentWeight,
  type UpgradeInput,
} from '@client/hooks/useUpgrades';
import type { Exercise, ExerciseUpgrade } from '@shared/types';
import { UpgradeDrawer } from './UpgradeDrawer';
import { UpgradeModal } from './UpgradeModal';

export function CurrentWeightTable() {
  const { data: current = [] } = useCurrentWeights();
  const { plan } = useFitnessPlan();
  const { exercises } = useExercises();
  const { create, update } = useUpgradeMutations();

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExerciseUpgrade | null>(null);
  const [fixedExerciseId, setFixedExerciseId] = useState<string | undefined>();
  const [drawerExercise, setDrawerExercise] = useState<Exercise | null>(null);

  const planIds = new Set(
    plan.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId)),
  );
  const filtered = current.filter(
    (row) => !search || row.exerciseName.includes(search),
  );
  const planned = filtered.filter((row) => planIds.has(row.exerciseId));
  const other = filtered.filter((row) => !planIds.has(row.exerciseId));
  const weightExercises = exercises.filter(
    (exercise) => exercise.type === 'weight',
  );

  const openRecord = (exerciseId?: string) => {
    setEditing(null);
    setFixedExerciseId(exerciseId);
    setModalOpen(true);
  };

  const openHistory = (exerciseId: string) => {
    setDrawerExercise(
      exercises.find((exercise) => exercise.id === exerciseId) ?? null,
    );
  };

  const save = (input: UpgradeInput) => {
    if (editing) update.mutate({ id: editing.id, patch: input });
    else create.mutate(input);
    setModalOpen(false);
    setEditing(null);
    setFixedExerciseId(undefined);
  };

  const renderRows = (rows: CurrentWeight[]) => {
    if (rows.length === 0) {
      return <p className="px-2 py-3 text-sm text-muted">没有动作。</p>;
    }

    return rows.map((row) => {
      const exercise = exercises.find((item) => item.id === row.exerciseId);
      return (
        <div
          key={row.exerciseId}
          className="flex flex-wrap items-center gap-2 border-b border-line/60 px-2 py-2 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink">{row.exerciseName}</p>
            <p className="text-xs text-muted">
              {exercise
                ? `${exercise.muscleGroup} · ${exercise.equipment}`
                : '—'}
            </p>
          </div>
          <span className="w-20 text-sm text-ink">
            {row.currentWeightKg !== null ? `${row.currentWeightKg} kg` : '—'}
          </span>
          <span className="w-44 text-xs text-muted">
            {row.latestUpgrade
              ? `${row.latestUpgrade.date} ${row.latestUpgrade.fromWeightKg}→${row.latestUpgrade.toWeightKg} kg`
              : '—'}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openRecord(row.exerciseId)}
            >
              升级
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openHistory(row.exerciseId)}
            >
              历史
            </Button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="mt-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-medium text-ink">动作重量与升级</h2>
        <div className="flex gap-2">
          <Input
            className="w-48"
            placeholder="搜索动作"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button onClick={() => openRecord()}>记录升级</Button>
        </div>
      </div>

      <div className="rounded-card border border-line bg-surface p-3">
        <h3 className="px-2 text-xs text-muted">计划动作</h3>
        <div className="mt-1">{renderRows(planned)}</div>
        <h3 className="mt-4 px-2 text-xs text-muted">其他动作</h3>
        <div className="mt-1">{renderRows(other)}</div>
      </div>

      <UpgradeModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setFixedExerciseId(undefined);
        }}
        exercises={weightExercises}
        currentWeights={current}
        initial={editing}
        fixedExerciseId={fixedExerciseId}
        onSave={save}
      />

      {drawerExercise ? (
        <UpgradeDrawer
          open
          onClose={() => setDrawerExercise(null)}
          exercise={drawerExercise}
          currentWeight={
            current.find((row) => row.exerciseId === drawerExercise.id)
              ?.currentWeightKg ?? null
          }
          onRecord={() => {
            const id = drawerExercise.id;
            setDrawerExercise(null);
            openRecord(id);
          }}
          onEdit={(upgrade) => {
            setEditing(upgrade);
            setFixedExerciseId(upgrade.exerciseId ?? undefined);
            setDrawerExercise(null);
            setModalOpen(true);
          }}
        />
      ) : null}
    </div>
  );
}
