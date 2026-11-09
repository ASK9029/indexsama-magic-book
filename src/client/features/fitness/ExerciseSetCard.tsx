import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import type { WorkoutSet } from '@shared/types';
import { SetRow } from './SetRow';

export function ExerciseSetCard({
  exerciseName,
  sets,
  defaultWeight,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
}: {
  exerciseName: string;
  sets: WorkoutSet[];
  defaultWeight?: number | null;
  onAddSet: () => void;
  onUpdateSet: (
    id: string,
    patch: { weightKg?: number | null; reps?: number; done?: boolean },
  ) => void;
  onDeleteSet: (id: string) => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-ink">{exerciseName}</h3>
        <Button size="sm" variant="secondary" onClick={onAddSet}>
          加一组
        </Button>
      </div>
      <div className="mt-3 space-y-2">
        {sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            defaultWeight={defaultWeight}
            onUpdate={(patch) => onUpdateSet(set.id, patch)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </div>
    </Card>
  );
}
