import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useDataInfo } from '@client/hooks/useDataInfo';
import { APP_NAME } from '@shared/constants';
import { RestoreDialog } from './RestoreDialog';

function formatDateTime(value: string | null): string {
  if (!value) return '还没有备份';
  return new Date(value).toLocaleString('zh-CN');
}

export function BackupTab() {
  const queryClient = useQueryClient();
  const { data: info, isLoading } = useDataInfo();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  if (isLoading || !info) {
    return <p className="text-sm text-muted">正在加载备份信息…</p>;
  }

  const olderThan30Days = info.lastBackupAt
    ? Date.now() - new Date(info.lastBackupAt).getTime() > 30 * 86400000
    : false;

  const exportBackup = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) throw new Error('backup failed');
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
      const filename = match
        ? decodeURIComponent(match[1])
        : `${APP_NAME}-备份.zip`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      void queryClient.invalidateQueries({ queryKey: ['dataInfo'] });
    } catch {
      setError('导出备份失败，请稍后再试。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {olderThan30Days ? (
        <div className="rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          上次备份已经超过 30 天，建议现在导出一份完整备份。
        </div>
      ) : null}

      <Card>
        <h2 className="text-base font-medium text-ink">备份与恢复</h2>
        <p className="mt-2 text-sm text-muted">
          上次备份：{formatDateTime(info.lastBackupAt)}
        </p>
        <p className="mt-1 text-sm text-muted">
          备份包含数据库和全部文件（资料、打卡照片、游戏封面），可以离线保存。
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => void exportBackup()} disabled={busy}>
            {busy ? '正在导出…' : '导出备份'}
          </Button>
          <label className="cursor-pointer rounded-[10px] border border-line bg-surface px-4 py-2 text-sm text-ink hover:border-accent">
            选择备份文件
            <input
              type="file"
              accept=".zip"
              className="hidden"
              aria-label="选择备份文件"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setRestoreFile(file);
                event.target.value = '';
              }}
            />
          </label>
        </div>

        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </Card>

      <RestoreDialog file={restoreFile} onClose={() => setRestoreFile(null)} />
    </div>
  );
}
