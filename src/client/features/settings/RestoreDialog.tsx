import { useState } from 'react';
import { apiUpload } from '@client/api/client';
import { Button } from '@client/components/ui/Button';
import { Modal } from '@client/components/ui/Modal';

export function RestoreDialog({
  file,
  onClose,
}: {
  file: File | null;
  onClose: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!file) return null;

  const restore = async () => {
    if (!confirmed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      await apiUpload('/api/restore', form);
      window.location.reload();
    } catch {
      setError('恢复失败，当前数据未改变。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="从备份恢复">
      <div className="space-y-3">
        <p className="text-sm text-ink">备份文件：{file.name}</p>
        <p className="text-sm text-amber-700">
          恢复会覆盖当前全部数据。服务端会先自动写入一份恢复前留底。
        </p>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
          />
          我确认覆盖当前数据
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            取消
          </Button>
          <Button
            variant="danger"
            onClick={() => void restore()}
            disabled={!confirmed || busy}
          >
            {busy ? '正在恢复…' : '确认恢复'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
