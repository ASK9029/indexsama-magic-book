import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';

export function DangerTab() {
  return (
    <Card>
      <h2 className="text-base font-medium text-ink">危险区</h2>
      <p className="mt-1 text-sm text-muted">
        清空全部业务数据会删除任务、备忘、学习、健身、饮食和游戏记录，且不可撤销。
        备份与恢复将在 Task 24 接入。
      </p>
      <Button variant="danger" className="mt-4" disabled>
        清空所有数据（Task 24 接入）
      </Button>
    </Card>
  );
}
