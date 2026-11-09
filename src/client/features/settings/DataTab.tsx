import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { useConfirm } from '@client/components/ui/Confirm';
import { useDataInfo } from '@client/hooks/useDataInfo';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DataTab() {
  const { confirm } = useConfirm();
  const { data: info, isLoading } = useDataInfo();
  const [copied, setCopied] = useState(false);

  if (isLoading || !info) {
    return <p className="text-sm text-muted">正在加载数据概览…</p>;
  }

  const counts = [
    { label: '任务', value: info.counts.tasks },
    { label: '备忘', value: info.counts.memos },
    { label: '科目', value: info.counts.subjects },
    { label: '资料', value: info.counts.materials },
    { label: '打卡', value: info.counts.checkins },
    { label: '学习记录', value: info.counts.sessions },
    { label: '训练', value: info.counts.workouts },
    { label: '饮食条目', value: info.counts.meals },
    { label: '游戏', value: info.counts.games },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-base font-medium text-ink">数据概览</h2>
        <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {counts.map((item) => (
            <div key={item.label}>
              <p className="text-xs text-muted">{item.label}</p>
              <p className="text-lg font-semibold text-ink">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-medium text-ink">存储与备份</h2>
        <p className="mt-2 text-sm text-muted">
          数据库 {formatBytes(info.storage.dbBytes)} · 文件{' '}
          {formatBytes(info.storage.filesBytes)} · 合计{' '}
          {formatBytes(info.storage.totalBytes)}
        </p>
        <p className="mt-1 text-sm text-muted">
          上次备份：
          {info.lastBackupAt
            ? new Date(info.lastBackupAt).toLocaleString('zh-CN')
            : '还没有备份'}
        </p>
        <p className="mt-2 break-all text-xs text-muted">{info.dataDir}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              void navigator.clipboard?.writeText(info.dataDir);
              setCopied(true);
            }}
          >
            {copied ? '已复制' : '复制路径'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              void fetch('/api/system/open-data-folder', { method: 'POST' });
            }}
          >
            打开数据文件夹
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">版本 {info.version}</p>
      </Card>

      <Card>
        <h2 className="text-base font-medium text-ink">退出 APP</h2>
        <p className="mt-1 text-sm text-muted">
          退出后浏览器页面会断开，数据不会丢失，下次双击图标再开。
        </p>
        <div className="mt-3">
          <Button
            variant="danger"
            onClick={async () => {
              const ok = await confirm({
                title: '退出 APP',
                description: '退出后浏览器页面会断开，下次双击图标再开。',
                confirmText: '退出',
                danger: true,
              });
              if (!ok) return;
              await fetch('/api/system/shutdown', { method: 'POST' });
            }}
          >
            退出 APP
          </Button>
        </div>
      </Card>
    </div>
  );
}
