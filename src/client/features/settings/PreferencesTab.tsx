import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiPost } from '@client/api/client';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { Input } from '@client/components/ui/Input';
import type { Settings } from '@shared/types';

export function PreferencesTab({
  settings,
  update,
}: {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}) {
  const [protein, setProtein] = useState(
    settings.proteinTarget !== null ? String(settings.proteinTarget) : '',
  );

  useEffect(() => {
    setProtein(
      settings.proteinTarget !== null ? String(settings.proteinTarget) : '',
    );
  }, [settings.proteinTarget]);

  const reference = useMutation({
    mutationFn: () =>
      apiPost<{ proteinTarget: number }>('/api/settings/protein-reference'),
  });

  const apply = () => {
    const value = Number(protein);
    if (Number.isFinite(value) && value > 0) {
      update({ proteinTarget: value });
    }
  };

  return (
    <Card>
      <h2 className="text-base font-medium text-ink">营养目标</h2>
      <p className="mt-1 text-sm text-muted">
        蛋白质目标可手动设置，也可按最近体重 × 1.6 生成参考值。
      </p>

      <div className="mt-4 max-w-xs">
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
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" onClick={apply}>
            保存目标
          </Button>
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
        </div>
        {reference.isError ? (
          <p className="mt-2 text-xs text-red-600">
            还没有体重记录，请先在健身或饮食页记录体重。
          </p>
        ) : null}
      </div>

      <p className="mt-4 text-xs text-muted">
        热量目标、饮水目标、单位和每周起始日将在 Task 23 补全。
      </p>
    </Card>
  );
}
