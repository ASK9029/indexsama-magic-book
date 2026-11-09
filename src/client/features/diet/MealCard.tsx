import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { Checkbox } from '@client/components/ui/Checkbox';
import { Tabs } from '@client/components/ui/Tabs';
import { formatCalories } from '@shared/format';
import type { Meal, MealBucket } from '@shared/types';
import { MealEntryRow } from './MealEntryRow';

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
};

export function MealCard({
  bucket,
  future,
  onAdd,
  onCopy,
  onClear,
  onDone,
  onDelete,
}: {
  bucket: MealBucket;
  future: boolean;
  onAdd: (kind: 'plan' | 'actual') => void;
  onCopy: () => void;
  onClear: (kind: 'plan' | 'actual') => void;
  onDone: (done: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [kind, setKind] = useState<'actual' | 'plan'>('actual');
  const entries = kind === 'actual' ? bucket.actualEntries : bucket.plannedEntries;
  const calories =
    kind === 'actual' ? bucket.actualCalories : bucket.plannedCalories;
  const protein =
    kind === 'actual' ? bucket.actualProtein : bucket.plannedProtein;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-ink">
          {MEAL_LABELS[bucket.meal]}
        </h2>
        <Checkbox
          checked={bucket.done}
          onChange={onDone}
          label="完成"
          disabled={future}
        />
      </div>

      <div className="mt-2">
        <Tabs
          items={[
            { value: 'actual', label: '实际' },
            { value: 'plan', label: '计划' },
          ]}
          value={kind}
          onChange={(value) => setKind(value as 'actual' | 'plan')}
        />
      </div>

      <div className="mt-2">
        {entries.length === 0 ? (
          <p className="py-2 text-sm text-muted">
            {kind === 'actual' ? '还没有实际记录。' : '还没有计划。'}
          </p>
        ) : (
          entries.map((entry) => (
            <MealEntryRow
              key={entry.id}
              entry={entry}
              onDelete={() => onDelete(entry.id)}
            />
          ))
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted">
          {formatCalories(calories)} · 蛋白 {protein.toFixed(1)} g
        </span>
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onAdd(kind)}
            disabled={future && kind === 'actual'}
          >
            加食物
          </Button>
          {bucket.plannedEntries.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={onCopy}>
              按计划吃
            </Button>
          ) : null}
          {entries.length > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => onClear(kind)}>
              清空
            </Button>
          ) : null}
        </div>
      </div>

      {future && kind === 'actual' ? (
        <p className="mt-2 text-xs text-amber-700">未来日期只能排计划。</p>
      ) : null}
    </Card>
  );
}
