import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { ClearDataDialog } from './ClearDataDialog';

export function DangerTab() {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <h2 className="text-base font-medium text-ink">危险区</h2>
      <p className="mt-1 text-sm text-muted">
        清空全部业务数据会删除任务、备忘、学习、健身、饮食和游戏记录，且不可撤销。
        建议先在“备份”页导出一份完整备份。
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
        清空所有数据
      </Button>
      <ClearDataDialog open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}
