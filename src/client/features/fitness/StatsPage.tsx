import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { addDays, parseLocalDate, toLocalDate } from '@shared/dates';
import { Button } from '@client/components/ui/Button';
import { Select } from '@client/components/ui/Select';
import { Tabs } from '@client/components/ui/Tabs';
import { BarChart } from '@client/components/charts/BarChart';
import { ChartCard } from '@client/components/charts/ChartCard';
import { LineChart } from '@client/components/charts/LineChart';
import {
  useFitnessStats,
  type StatsView,
} from '@client/hooks/useFitnessStats';
import { useWeightMutations } from '@client/hooks/useWeights';
import { todayLocal } from '@client/lib/clientDates';
import type { WeightLog } from '@shared/types';
import { FitnessStatsCards } from './FitnessStatsCards';
import { TrainingHistory } from './TrainingHistory';
import { WeightModal } from './WeightModal';
import { WeightRecordDrawer } from './WeightRecordDrawer';

function shiftAnchor(view: StatsView, anchor: string, delta: number): string {
  if (view === 'week') return addDays(anchor, delta * 7);
  const parsed = parseLocalDate(anchor);
  if (view === 'month') {
    return toLocalDate(
      new Date(parsed.getFullYear(), parsed.getMonth() + delta, 1),
    );
  }
  return toLocalDate(new Date(parsed.getFullYear() + delta, 0, 1));
}

export function StatsPage() {
  const [params, setParams] = useSearchParams();
  const viewParam = params.get('view');
  const view: StatsView =
    viewParam === 'month' || viewParam === 'year' ? viewParam : 'week';
  const anchor = params.get('anchor') ?? todayLocal();
  const exerciseId = params.get('exerciseId') ?? undefined;

  const { data: stats, isLoading } = useFitnessStats(view, anchor, exerciseId);
  const { create, update } = useWeightMutations();

  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WeightLog | null>(null);
  const [weightDrawerOpen, setWeightDrawerOpen] = useState(false);

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };

  const saveWeight = (input: { date: string; weightKg: number }) => {
    if (editingWeight) {
      update.mutate({ id: editingWeight.id, patch: input });
    } else {
      create.mutate(input);
    }
    setWeightModalOpen(false);
    setEditingWeight(null);
  };

  if (isLoading || !stats) {
    return <p className="text-sm text-muted">正在加载…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          items={[
            { value: 'week', label: '周' },
            { value: 'month', label: '月' },
            { value: 'year', label: '年' },
          ]}
          value={view}
          onChange={(value) => setParam('view', value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setParam('anchor', shiftAnchor(view, anchor, -1))}
          >
            ←
          </Button>
          <span className="text-sm text-muted">
            {stats.range.from} ~ {stats.range.to}
          </span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setParam('anchor', shiftAnchor(view, anchor, 1))}
          >
            →
          </Button>
          {anchor !== todayLocal() ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setParam('anchor', todayLocal())}
            >
              回到现在
            </Button>
          ) : null}
        </div>
      </div>

      <FitnessStatsCards stats={stats} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="体重（kg）"
          action={
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditingWeight(null);
                  setWeightModalOpen(true);
                }}
              >
                记录体重
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setWeightDrawerOpen(true)}
              >
                历史
              </Button>
            </div>
          }
        >
          <LineChart data={stats.weight} unit="kg" />
        </ChartCard>

        <ChartCard title="训练量（kg）">
          <BarChart data={stats.volume} unit="kg" />
        </ChartCard>

        <ChartCard title="训练次数">
          <BarChart data={stats.count} unit="次" />
        </ChartCard>

        <ChartCard
          title="动作力量（kg）"
          action={
            <Select
              className="w-36"
              value={exerciseId ?? stats.exerciseOptions[0]?.id ?? ''}
              onChange={(event) => setParam('exerciseId', event.target.value)}
            >
              {stats.exerciseOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          }
        >
          <LineChart data={stats.strength} unit="kg" />
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-medium text-ink">训练记录</h2>
        <TrainingHistory />
      </div>

      <WeightModal
        open={weightModalOpen}
        onClose={() => {
          setWeightModalOpen(false);
          setEditingWeight(null);
        }}
        initial={editingWeight}
        onSave={saveWeight}
      />

      {weightDrawerOpen ? (
        <WeightRecordDrawer
          open
          onClose={() => setWeightDrawerOpen(false)}
          from={stats.range.from}
          to={stats.range.to}
          onRecord={() => {
            setWeightDrawerOpen(false);
            setEditingWeight(null);
            setWeightModalOpen(true);
          }}
          onEdit={(log) => {
            setWeightDrawerOpen(false);
            setEditingWeight(log);
            setWeightModalOpen(true);
          }}
        />
      ) : null}
    </div>
  );
}
