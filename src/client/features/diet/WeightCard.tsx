import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useWeightMutations } from '@client/hooks/useWeights';
import { WeightModal } from '@client/features/fitness/WeightModal';
import { WeightRecordDrawer } from '@client/features/fitness/WeightRecordDrawer';
import type { WeightLog } from '@shared/types';

export function WeightCard({
  date,
  weightKg,
  future,
}: {
  date: string;
  weightKg: number | null;
  future: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<WeightLog | null>(null);
  const { create, update } = useWeightMutations();

  const save = (input: { date: string; weightKg: number }) => {
    if (editing) update.mutate({ id: editing.id, patch: input });
    else create.mutate(input);
    setModalOpen(false);
    setEditing(null);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">体重</h3>
        <Button
          size="sm"
          variant="ghost"
          disabled={future}
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          记录体重
        </Button>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-semibold text-ink">
          {weightKg !== null ? `${weightKg} kg` : '—'}
        </span>
        <button
          type="button"
          className="text-xs text-muted hover:text-accent"
          onClick={() => setDrawerOpen(true)}
        >
          历史
        </button>
      </div>
      {future ? (
        <p className="mt-2 text-xs text-amber-700">未来日期不能记录体重。</p>
      ) : null}

      <WeightModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSave={save}
      />

      {drawerOpen ? (
        <WeightRecordDrawer
          open
          onClose={() => setDrawerOpen(false)}
          from={date}
          to={date}
          onRecord={() => {
            setDrawerOpen(false);
            setEditing(null);
            setModalOpen(true);
          }}
          onEdit={(log) => {
            setDrawerOpen(false);
            setEditing(log);
            setModalOpen(true);
          }}
        />
      ) : null}
    </Card>
  );
}
