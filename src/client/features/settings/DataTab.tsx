import { Button } from '@client/components/ui/Button';
import { useConfirm } from '@client/components/ui/Confirm';

export function DataTab() {
  const { confirm } = useConfirm();

  return (
    <div className="space-y-4">
      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="text-base font-medium text-ink">数据文件夹</h2>
        <p className="mt-1 text-sm text-muted">所有数据保存在本机的 data 文件夹。</p>
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() => {
              void fetch('/api/system/open-data-folder', { method: 'POST' });
            }}
          >
            打开数据文件夹
          </Button>
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-5">
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
      </section>
    </div>
  );
}
