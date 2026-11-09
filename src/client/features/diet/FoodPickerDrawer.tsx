import { useState } from 'react';
import { Drawer } from '@client/components/ui/Drawer';
import { Input } from '@client/components/ui/Input';
import {
  useFoods,
  useFrequentFoods,
  useRecentFoods,
} from '@client/hooks/useFoods';
import { FOOD_CATEGORIES } from '@shared/schemas';
import type { Food, Meal } from '@shared/types';
import type { AddEntryInput } from '@client/hooks/useDietDay';
import { PortionStep } from './PortionStep';

function FoodList({
  title,
  foods,
  onSelect,
}: {
  title: string;
  foods: Food[];
  onSelect: (food: Food) => void;
}) {
  if (foods.length === 0) return null;
  return (
    <div className="mt-3">
      <h3 className="text-xs text-muted">{title}</h3>
      <div className="mt-1">
        {foods.map((food) => (
          <button
            key={food.id}
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-canvas"
            onClick={() => onSelect(food)}
          >
            <span className="text-ink">{food.name}</span>
            <span className="text-xs text-muted">
              {food.per100Calories} kcal/100{food.unit}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function FoodPickerDrawer({
  open,
  onClose,
  date,
  meal,
  kind,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
  meal: Meal;
  kind: 'plan' | 'actual';
  onAdd: (input: AddEntryInput) => void;
}) {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [selected, setSelected] = useState<Food | null>(null);

  const { data: foods = [] } = useFoods({
    q: q || undefined,
    category: category || undefined,
  });
  const { data: recent = [] } = useRecentFoods();
  const { data: frequent = [] } = useFrequentFoods();

  return (
    <Drawer open={open} onClose={onClose} title="添加食物">
      {selected ? (
        <PortionStep
          food={selected}
          date={date}
          meal={meal}
          kind={kind}
          onAdd={onAdd}
          onBack={() => setSelected(null)}
        />
      ) : (
        <div>
          <Input
            placeholder="搜索食物"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
          <div className="mt-2 flex flex-wrap gap-1">
            <button
              type="button"
              className={`rounded-full px-3 py-1 text-xs ${
                category === ''
                  ? 'bg-accent text-white'
                  : 'bg-canvas text-muted'
              }`}
              onClick={() => setCategory('')}
            >
              全部
            </button>
            {FOOD_CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full px-3 py-1 text-xs ${
                  category === item
                    ? 'bg-accent text-white'
                    : 'bg-canvas text-muted'
                }`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <FoodList title="最近" foods={recent} onSelect={setSelected} />
          <FoodList title="常吃" foods={frequent} onSelect={setSelected} />
          <FoodList title="全部" foods={foods} onSelect={setSelected} />
        </div>
      )}
    </Drawer>
  );
}
