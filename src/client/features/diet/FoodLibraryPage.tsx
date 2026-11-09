import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { useConfirm } from '@client/components/ui/Confirm';
import {
  useFoodMutations,
  useFoods,
  type FoodInput,
} from '@client/hooks/useFoods';
import { FOOD_CATEGORIES } from '@shared/schemas';
import type { Food } from '@shared/types';
import { FoodModal } from './FoodModal';
import { FoodRow } from './FoodRow';

export function FoodLibraryPage() {
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Food | null>(null);

  const { confirm } = useConfirm();
  const { data: foods = [], isLoading } = useFoods({
    q: q || undefined,
    category: category || undefined,
  });
  const { create, update, remove } = useFoodMutations();

  const save = (input: FoodInput) => {
    if (editing) update.mutate({ id: editing.id, patch: input });
    else create.mutate(input);
    setModalOpen(false);
    setEditing(null);
  };

  const removeFood = async (food: Food) => {
    const ok = await confirm({
      title: '删除食物',
      description: '历史饮食条目会保留食物快照。',
      confirmText: '删除',
      danger: true,
    });
    if (ok) remove.mutate(food.id);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          className="max-w-xs"
          placeholder="搜索食物"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          新增自定义食物
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        <button
          type="button"
          className={`rounded-full px-3 py-1 text-xs ${
            category === ''
              ? 'bg-accent text-white'
              : 'bg-canvas text-muted hover:text-ink'
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
                : 'bg-canvas text-muted hover:text-ink'
            }`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">正在加载…</p>
      ) : foods.length === 0 ? (
        <p className="text-sm text-muted">没有找到食物。</p>
      ) : (
        <div className="rounded-card border border-line bg-surface">
          {foods.map((food) => (
            <FoodRow
              key={food.id}
              food={food}
              onEdit={(item) => {
                setEditing(item);
                setModalOpen(true);
              }}
              onDelete={(item) => void removeFood(item)}
            />
          ))}
        </div>
      )}

      <FoodModal
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
