import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@client/api/client';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { Input } from '@client/components/ui/Input';
import { Select } from '@client/components/ui/Select';
import type { Settings } from '@shared/types';

type TargetKey = 'calorieTarget' | 'proteinTarget' | 'waterTarget';

export function PreferencesTab({
  settings,
  update,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}) {
  const [weekStart, setWeekStart] = useState(settings.weekStart);
  const [weightUnit, setWeightUnit] = useState(settings.weightUnit);
  const [calorie, setCalorie] = useState(
    settings.calorieTarget !== null ? String(settings.calorieTarget) : '',
  );
  const [protein, setProtein] = useState(
    settings.proteinTarget !== null ? String(settings.proteinTarget) : '',
  );
  const [water, setWater] = useState(
    settings.waterTarget !== null ? String(settings.waterTarget) : '',
  );

  useEffect(() => {
    setWeekStart(settings.weekStart);
    setWeightUnit(settings.weightUnit);
    setCalorie(
      settings.calorieTarget !== null ? String(settings.calorieTarget) : '',
    );
    setProtein(
      settings.proteinTarget !== null ? String(settings.proteinTarget) : '',
    );
    setWater(
      settings.waterTarget !== null ? String(settings.waterTarget) : '',
    );
  }, [settings]);

  const reference = useMutation({
    mutationFn: () =>
      apiPost<{ proteinTarget: number }>('/api/settings/protein-reference'),
  });

  const saveNumber = (key: TargetKey, raw: string) => {
    if (raw.trim() === '') {
      update({ [key]: null } as Partial<Settings>);
      return;
    }
    const value = Number(raw);
    if (Number.isFinite(value) && value >= 0) {
      update({ [key]: value } as Partial<Settings>);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-medium text-ink">每周与单位</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="week-start" className="text-sm text-muted">
              每周起始日
            </label>
            <Select
              id="week-start"
              className="mt-1"
              value={String(weekStart)}
              onChange={(event) => {
                const value = Number(event.target.value) as 0 | 1;
                setWeekStart(value);
                update({ weekStart: value });
              }}
            >
              <option value="1">周一</option>
              <option value="0">周日</option>
            </Select>
          </div>
          <div>
            <label htmlFor="weight-unit" className="text-sm text-muted">
              体重单位
            </label>
            <Select
              id="weight-unit"
              className="mt-1"
              value={weightUnit}
              onChange={(event) => {
                const value = event.target.value as Settings['weightUnit'];
                setWeightUnit(value);
                update({ weightUnit: value });
              }}
            >
              <option value="kg">公斤（kg）</option>
              <option value="jin">斤</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-medium text-ink">营养目标</h2>
        <p className="mt-1 text-sm text-muted">
          留空表示不设置目标；输入后离开输入框自动保存。
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="calorie-target" className="text-sm text-muted">
              每日热量目标（kcal）
            </label>
            <Input
              id="calorie-target"
              className="mt-1"
              type="number"
              min={0}
              value={calorie}
              onChange={(event) => setCalorie(event.target.value)}
              onBlur={() => saveNumber('calorieTarget', calorie)}
            />
          </div>
          <div>
            <label htmlFor="protein-target" className="text-sm text-muted">
              每日蛋白质目标（g）
            </label>
            <Input
              id="protein-target"
              className="mt-1"
              type="number"
              min={0}
              value={protein}
              onChange={(event) => setProtein(event.target.value)}
              onBlur={() => saveNumber('proteinTarget', protein)}
            />
          </div>
          <div>
            <label htmlFor="water-target" className="text-sm text-muted">
              每日饮水目标（ml）
            </label>
            <Input
              id="water-target"
              className="mt-1"
              type="number"
              min={0}
              value={water}
              onChange={(event) => setWater(event.target.value)}
              onBlur={() => saveNumber('waterTarget', water)}
            />
          </div>
        </div>

        <div className="mt-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              reference.mutate(undefined, {
                onSuccess: (data) => {
                  setProtein(String(data.proteinTarget));
                  update({ proteinTarget: data.proteinTarget });
                },
              })
            }
          >
            按体重建参考值
          </Button>
          {reference.isError ? (
            <p className="mt-2 text-xs text-red-600">
              还没有体重记录，请先在健身或饮食页记录体重。
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
