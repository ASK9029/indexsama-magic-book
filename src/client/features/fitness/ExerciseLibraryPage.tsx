import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { Input } from '@client/components/ui/Input';
import { Select } from '@client/components/ui/Select';
import { useExercises } from '@client/hooks/useExercises';
import { useCurrentWeights } from '@client/hooks/useUpgrades';
import type { Exercise } from '@shared/types';
import { ExerciseModal } from './ExerciseModal';

const GROUPS = ['胸', '背', '腿', '肩', '手臂', '核心', '全身'];
const EQUIPMENT = ['杠铃', '哑铃', '器械', '绳索', '自重', '其他'];

export function ExerciseLibraryPage() {
  const [q, setQ] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [equipment, setEquipment] = useState('');
  const [type, setType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const { exercises, isLoading, create, update, remove } = useExercises({
    q: q || undefined,
    muscleGroup: muscleGroup || undefined,
    equipment: equipment || undefined,
    type: type || undefined,
  });
  const { data: currentWeights = [] } = useCurrentWeights();

  const save = (input: Parameters<typeof create.mutate>[0]) => {
    if (editing) update.mutate({ id: editing.id, patch: input });
    else create.mutate(input);
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          className="max-w-xs"
          placeholder="搜索动作"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Select
          className="max-w-28"
          value={muscleGroup}
          onChange={(event) => setMuscleGroup(event.target.value)}
        >
          <option value="">全部部位</option>
          {GROUPS.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </Select>
        <Select
          className="max-w-28"
          value={equipment}
          onChange={(event) => setEquipment(event.target.value)}
        >
          <option value="">全部器械</option>
          {EQUIPMENT.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          className="max-w-28"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          <option value="">全部类型</option>
          <option value="weight">重量</option>
          <option value="bodyweight">徒手</option>
        </Select>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          新增动作
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">正在加载…</p>
      ) : exercises.length === 0 ? (
        <p className="text-sm text-muted">没有符合条件的动作。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {exercises.map((exercise) => (
            <Card key={exercise.id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink">{exercise.name}</h3>
                {exercise.builtIn ? (
                  <span className="text-xs text-muted">内置</span>
                ) : null}
              </div>
              <p className="text-xs text-muted">
                {exercise.muscleGroup} · {exercise.equipment} ·{' '}
                {exercise.type === 'weight' ? '重量' : '徒手'}
              </p>
              {(() => {
                const current = currentWeights.find(
                  (item) => item.exerciseId === exercise.id,
                );
                return current ? (
                  <p className="text-xs text-muted">
                    当前{' '}
                    {current.currentWeightKg !== null
                      ? `${current.currentWeightKg} kg`
                      : '—'}
                  </p>
                ) : null;
              })()}
              {exercise.notes ? (
                <p className="text-xs text-muted">{exercise.notes}</p>
              ) : null}
              {!exercise.builtIn ? (
                <div className="mt-auto flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditing(exercise);
                      setModalOpen(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove.mutate(exercise.id)}
                  >
                    删除
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <ExerciseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSave={save}
      />
    </div>
  );
}
