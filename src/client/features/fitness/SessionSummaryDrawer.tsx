import { Button } from '@client/components/ui/Button';
import { Drawer } from '@client/components/ui/Drawer';
import { formatMinutes } from '@shared/format';
import type { WorkoutSession } from '@shared/types';

export function SessionSummaryDrawer({
  open,
  onClose,
  session,
}: {
  open: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
}) {
  if (!session) return null;

  const doneSets = session.sets.filter((set) => set.done);
  const volume = doneSets
    .filter((set) => set.weightKg !== null)
    .reduce((sum, set) => sum + (set.weightKg ?? 0) * set.reps, 0);

  return (
    <Drawer open={open} onClose={onClose} title="训练总结">
      <div className="space-y-2 text-sm text-muted">
        <p>训练：{session.name || '训练'}</p>
        <p>
          时长：
          {session.durationMinutes ? formatMinutes(session.durationMinutes) : '—'}
        </p>
        <p>
          完成组数：{doneSets.length} / {session.sets.length}
        </p>
        <p>训练量：{volume} kg</p>
      </div>
      <Button className="mt-4" onClick={onClose}>
        完成
      </Button>
    </Drawer>
  );
}
