import { useState } from 'react';
import { apiPost } from '@client/api/client';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';

export function ClearDataDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clear = async () => {
    if (text !== '清空' || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost('/api/data/clear', { confirm: '清空' });
      window.location.reload();
    } catch {
      setError('清空失败，请稍后再试。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="清空所有数据">
      <div className="space-y-3">
        <p className="text-sm text-red-600">
          此操作会删除全部任务、学习、健身、饮食、游戏数据和文件，且不可撤销。
          建议先在“备份”页导出完整备份。
        </p>
        <div>
          <label htmlFor="clear-confirm" className="text-sm text-muted">
            输入“清空”确认
          </label>
          <Input
            id="clear-confirm"
            className="mt-1"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => void clear()}
            disabled={text !== '清空' || busy}
          >
            {busy ? '正在清空…' : '确认清空'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
