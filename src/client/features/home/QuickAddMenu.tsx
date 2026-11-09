import { Modal } from '@client/components/ui/Modal';
import type { QuickAddKind } from '@client/hooks/useQuickAdd';

const items: Array<{
  kind: QuickAddKind;
  label: string;
  hint: string;
  enabled: boolean;
}> = [
  { kind: 'task', label: '任务', hint: '加一件事', enabled: true },
  { kind: 'memo', label: '备忘', hint: '随手记', enabled: true },
  { kind: 'study', label: '学习', hint: '模块接入后开放', enabled: false },
  { kind: 'weight', label: '体重', hint: '模块接入后开放', enabled: false },
  { kind: 'water', label: '喝水', hint: '模块接入后开放', enabled: false },
];

export function QuickAddMenu({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (kind: QuickAddKind) => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="快速添加">
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <button
            key={item.kind}
            type="button"
            onClick={() => onSelect(item.kind)}
            className={`rounded-[10px] border border-line p-3 text-left transition hover:bg-canvas ${
              item.enabled ? '' : 'opacity-50'
            }`}
          >
            <div className="text-sm font-medium text-ink">{item.label}</div>
            <div className="mt-1 text-xs text-muted">{item.hint}</div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
