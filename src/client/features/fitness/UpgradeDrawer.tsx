import { useUpgrades, useUpgradeMutations } from '@client/hooks/useUpgrades';
import { Button } from '@client/components/ui/Button';
import { Drawer } from '@client/components/ui/Drawer';
import type { Exercise, ExerciseUpgrade } from '@shared/types';

export function UpgradeDrawer({
  open,
  onClose,
  exercise,
  currentWeight,
  onRecord,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  currentWeight: number | null;
  onRecord: () => void;
  onEdit: (upgrade: ExerciseUpgrade) => void;
}) {
  const { data, isLoading } = useUpgrades(exercise?.id);
  const { remove } = useUpgradeMutations();

  if (!exercise) return null;

  const upgrades = data ?? [];
  const groups = new Map<string, ExerciseUpgrade[]>();
  for (const upgrade of upgrades) {
    const month = upgrade.date.slice(0, 7);
    const list = groups.get(month) ?? [];
    list.push(upgrade);
    groups.set(month, list);
  }

  return (
    <Drawer open={open} onClose={onClose} title={`${exercise.name} · 升级记录`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted">
          当前重量：{currentWeight !== null ? `${currentWeight} kg` : '—'}
        </p>
        <Button size="sm" onClick={onRecord}>
          记录升级
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">正在加载…</p>
      ) : upgrades.length === 0 ? (
        <p className="text-sm text-muted">还没有升级记录。</p>
      ) : (
        <div className="space-y-4">
          {[...groups.entries()].map(([month, list]) => (
            <div key={month}>
              <h3 className="text-xs text-muted">{month}</h3>
              <div className="mt-1 space-y-2">
                {list.map((upgrade) => (
                  <div
                    key={upgrade.id}
                    className="rounded-[10px] border border-line px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-ink">
                        {upgrade.date} · {upgrade.fromWeightKg} → {upgrade.toWeightKg} kg
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className="text-xs text-muted hover:text-accent"
                          onClick={() => onEdit(upgrade)}
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          className="text-xs text-muted hover:text-red-600"
                          onClick={() => remove.mutate(upgrade.id)}
                        >
                          删除
                        </button>
                      </div>
                    </div>
                    {upgrade.note ? (
                      <p className="mt-1 text-xs text-muted">{upgrade.note}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
