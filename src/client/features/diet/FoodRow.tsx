import type { Food } from '@shared/types';

export function FoodRow({
  food,
  onEdit,
  onDelete,
}: {
  food: Food;
  onEdit: (food: Food) => void;
  onDelete: (food: Food) => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line/60 px-3 py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink">{food.name}</span>
          <span className="rounded bg-canvas px-1.5 py-0.5 text-xs text-muted">
            {food.category}
          </span>
          {food.builtIn ? (
            <span className="text-xs text-muted">内置</span>
          ) : (
            <span className="text-xs text-accent">自定义</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {food.per100Calories} kcal · 蛋白 {food.per100Protein} g / 100
          {food.unit}
          {food.servingName && food.servingAmount
            ? ` · ${food.servingName} ${food.servingAmount}${food.unit}`
            : ''}
        </p>
      </div>
      {!food.builtIn ? (
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className="text-xs text-muted hover:text-accent"
            onClick={() => onEdit(food)}
          >
            编辑
          </button>
          <button
            type="button"
            className="text-xs text-muted hover:text-red-600"
            onClick={() => onDelete(food)}
          >
            删除
          </button>
        </div>
      ) : null}
    </div>
  );
}
