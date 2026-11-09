import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { Input } from '@client/components/ui/Input';
import { useWaterMutations } from '@client/hooks/useWater';

export function WaterCard({
  date,
  waterMl,
  waterTarget,
  future,
}: {
  date: string;
  waterMl: number;
  waterTarget: number | null;
  future: boolean;
}) {
  const [custom, setCustom] = useState('');
  const { add, undo } = useWaterMutations(date);

  const percent =
    waterTarget && waterTarget > 0
      ? Math.min(100, Math.round((waterMl / waterTarget) * 100))
      : 0;
  const remaining = waterTarget !== null ? waterTarget - waterMl : null;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-ink">饮水</h3>
        <span className="text-xs text-muted">
          {waterTarget !== null
            ? `${waterMl} / ${waterTarget} ml`
            : `${waterMl} ml`}
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-canvas">
        <div
          className="h-2 rounded-full bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-muted">
        {waterTarget === null
          ? '未设置饮水目标'
          : remaining !== null && remaining > 0
            ? `还差 ${remaining} ml`
            : '已达标'}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          disabled={future}
          onClick={() => add.mutate(250)}
        >
          +250
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={future}
          onClick={() => add.mutate(500)}
        >
          +500
        </Button>
        <div className="flex items-center gap-1">
          <Input
            className="w-20"
            type="number"
            min={1}
            placeholder="自定义"
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
          />
          <Button
            size="sm"
            disabled={future || !custom}
            onClick={() => {
              const value = Number(custom);
              if (value > 0) {
                add.mutate(value);
                setCustom('');
              }
            }}
          >
            加
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={future || waterMl === 0}
          onClick={() => undo.mutate()}
        >
          撤销
        </Button>
      </div>

      {future ? (
        <p className="mt-2 text-xs text-amber-700">未来日期不能记录饮水。</p>
      ) : null}
    </Card>
  );
}
