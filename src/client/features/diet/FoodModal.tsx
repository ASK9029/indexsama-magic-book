import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import type { FoodInput } from '@client/hooks/useFoods';
import { FOOD_CATEGORIES } from '@shared/schemas';
import type { Food } from '@shared/types';

export function FoodModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Food | null;
  onSave: (input: FoodInput) => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(FOOD_CATEGORIES[0]);
  const [unit, setUnit] = useState<'g' | 'ml'>('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [servingName, setServingName] = useState('');
  const [servingAmount, setServingAmount] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setCategory(initial?.category ?? FOOD_CATEGORIES[0]);
    setUnit(initial?.unit ?? 'g');
    setCalories(initial ? String(initial.per100Calories) : '');
    setProtein(initial ? String(initial.per100Protein) : '');
    setServingName(initial?.servingName ?? '');
    setServingAmount(
      initial?.servingAmount !== null && initial?.servingAmount !== undefined
        ? String(initial.servingAmount)
        : '',
    );
  }, [open, initial]);

  const submit = () => {
    const calorieValue = Number(calories);
    const proteinValue = Number(protein);
    if (
      !name.trim() ||
      !Number.isFinite(calorieValue) ||
      !Number.isFinite(proteinValue)
    ) {
      return;
    }
    const amountValue = servingAmount === '' ? null : Number(servingAmount);

    onSave({
      name: name.trim(),
      category,
      unit,
      per100Calories: calorieValue,
      per100Protein: proteinValue,
      servingName: servingName.trim() || null,
      servingAmount:
        amountValue !== null && Number.isFinite(amountValue) && amountValue > 0
          ? amountValue
          : null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? '编辑食物' : '新增自定义食物'}
    >
      <div className="space-y-3">
        <div>
          <label htmlFor="food-name" className="text-sm text-muted">
            名称
          </label>
          <Input
            id="food-name"
            className="mt-1"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="food-category" className="text-sm text-muted">
              分类
            </label>
            <Select
              id="food-category"
              className="mt-1"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {FOOD_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="food-unit" className="text-sm text-muted">
              单位
            </label>
            <Select
              id="food-unit"
              className="mt-1"
              value={unit}
              onChange={(event) => setUnit(event.target.value as 'g' | 'ml')}
            >
              <option value="g">克</option>
              <option value="ml">毫升</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="food-calories" className="text-sm text-muted">
              每 100 热量（kcal）
            </label>
            <Input
              id="food-calories"
              className="mt-1"
              type="number"
              min={0}
              step={0.1}
              value={calories}
              onChange={(event) => setCalories(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="food-protein" className="text-sm text-muted">
              每 100 蛋白质（g）
            </label>
            <Input
              id="food-protein"
              className="mt-1"
              type="number"
              min={0}
              step={0.1}
              value={protein}
              onChange={(event) => setProtein(event.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="food-serving-name" className="text-sm text-muted">
              常见一份名称
            </label>
            <Input
              id="food-serving-name"
              className="mt-1"
              value={servingName}
              onChange={(event) => setServingName(event.target.value)}
              placeholder="例如：一碗"
            />
          </div>
          <div>
            <label htmlFor="food-serving-amount" className="text-sm text-muted">
              一份重量
            </label>
            <Input
              id="food-serving-amount"
              className="mt-1"
              type="number"
              min={0}
              step={1}
              value={servingAmount}
              onChange={(event) => setServingAmount(event.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            onClick={submit}
            disabled={!name.trim() || calories === '' || protein === ''}
          >
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
