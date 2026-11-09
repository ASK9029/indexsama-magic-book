import { Button } from '@client/components/ui/Button';
import { Drawer } from '@client/components/ui/Drawer';
import { useWeightMutations, useWeights } from '@client/hooks/useWeights';
import type { WeightLog } from '@shared/types';

export function WeightRecordDrawer({
  open,
  onClose,
  from,
  to,
  onRecord,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  from: string;
  to: string;
  onRecord: () => void;
  onEdit: (log: WeightLog) => void;
}) {
  const { data, isLoading } = useWeights(from, to);
  const { remove } = useWeightMutations();

  return (
    <Drawer open={open} onClose={onClose} title="体重记录">
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={onRecord}>
          记录体重
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">正在加载…</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted">这个周期还没有体重记录。</p>
      ) : (
        <div className="space-y-2">
          {data.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-2 rounded-[10px] border border-line px-3 py-2"
            >
              <span className="text-sm text-muted">{log.date}</span>
              <span className="flex-1 text-sm text-ink">{log.weightKg} kg</span>
              <button
                type="button"
                className="text-xs text-muted hover:text-accent"
                onClick={() => onEdit(log)}
              >
                编辑
              </button>
              <button
                type="button"
                className="text-xs text-muted hover:text-red-600"
                onClick={() => remove.mutate(log.id)}
              >
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}
