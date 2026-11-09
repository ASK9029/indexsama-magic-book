import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';

export function QuickWaterModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (amountMl: number) => void;
}) {
  const [custom, setCustom] = useState('');

  return (
    <Modal open={open} onClose={onClose} title="记一杯水">
      <div className="space-y-3">
        <p className="text-sm text-muted">记录今天的饮水量，今日饮食页会同步更新。</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onAdd(250)}>+250 ml</Button>
          <Button onClick={() => onAdd(500)}>+500 ml</Button>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="quick-water-custom" className="text-xs text-muted">
              自定义毫升
            </label>
            <Input
              id="quick-water-custom"
              className="mt-1 w-32"
              type="number"
              min={1}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={!custom}
            onClick={() => {
              const value = Number(custom);
              if (value > 0) {
                onAdd(value);
                setCustom('');
              }
            }}
          >
            添加
          </Button>
        </div>
        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
}
