import { Button } from '@client/components/ui/Button';
import { Modal } from '@client/components/ui/Modal';

export function CopyPlanDialog({
  open,
  onClose,
  onChoose,
}: {
  open: boolean;
  onClose: () => void;
  onChoose: (mode: 'replace' | 'append') => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="按计划吃">
      <p className="mb-5 text-sm text-muted">
        这餐已经有实际记录，选择替换还是追加。
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          取消
        </Button>
        <Button variant="secondary" onClick={() => onChoose('append')}>
          追加
        </Button>
        <Button onClick={() => onChoose('replace')}>替换</Button>
      </div>
    </Modal>
  );
}
