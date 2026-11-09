import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import type { AddEntryInput } from '@client/hooks/useDietDay';
import { formatCalories } from '@shared/format';
import type { Food, Meal } from '@shared/types';

export function PortionStep({
  food,
  date,
  meal,
  kind,
  onAdd,
  onBack,
}: {
  food: Food;
  date: string;
  meal: Meal;
  kind: 'plan' | 'actual';
  onAdd: (input: AddEntryInput) => void;
  onBack: () => void;
}) {
  const [amount, setAmount] = useState(
    food.servingAmount ? String(food.servingAmount) : '100',
  );
  const [servingLabel, setServingLabel] = useState<string | null>(
    food.servingName,
  );

  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0;
  const calories = valid ? (food.per100Calories * value) / 100 : 0;
  const protein = valid ? (food.per100Protein * value) / 100 : 0;

  return (
    <div className="space-y-3">
      <button type="button" className="text-sm text-accent" onClick={onBack}>
        ← 重新选择
      </button>

      <div>
        <h3 className="text-base font-medium text-ink">{food.name}</h3>
        <p className="text-xs text-muted">
          {food.per100Calories} kcal · 蛋白 {food.per100Protein} g / 100
          {food.unit}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="portion-amount" className="text-xs text-muted">
            分量
          </label>
          <div className="mt-1 flex items-center gap-2">
            <Input
              id="portion-amount"
              type="number"
              min={1}
              step={1}
              className="w-28"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setServingLabel(null);
              }}
            />
            <span className="text-sm text-muted">{food.unit}</span>
          </div>
        </div>
        {food.servingName && food.servingAmount ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setAmount(String(food.servingAmount));
              setServingLabel(food.servingName);
            }}
          >
            {food.servingName}（{food.servingAmount}
            {food.unit}）
          </Button>
        ) : null}
      </div>

      <p className="text-sm text-muted">
        {formatCalories(calories)} · 蛋白 {protein.toFixed(1)} g
      </p>

      <Button
        disabled={!valid}
        onClick={() =>
          onAdd({
            date,
            meal,
            kind,
            foodId: food.id,
            amount: value,
            unit: food.unit,
            servingLabel,
          })
        }
      >
        添加
      </Button>
    </div>
  );
}
