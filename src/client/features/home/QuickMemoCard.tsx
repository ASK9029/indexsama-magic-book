import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pin, Plus, Trash2 } from 'lucide-react';
import { apiDelete, apiGet, apiPatch, apiPost } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import { Button } from '@client/components/ui/Button';
import { Card } from '@client/components/ui/Card';
import { Input } from '@client/components/ui/Input';
import { formatMemoTime } from '@client/lib/memoTime';
import type { Memo } from '@shared/types';

export function QuickMemoCard({ onOpenAll }: { onOpenAll?: () => void }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<Memo | null>(null);
  const pendingTimer = useRef<number | null>(null);

  const { data: memos = [] } = useQuery({
    queryKey: queryKeys.memos,
    queryFn: () => apiGet<Memo[]>('/api/memos'),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.memos });
  };

  const create = useMutation({
    mutationFn: (input: { text: string }) => apiPost<Memo>('/api/memos', input),
    onSuccess: () => {
      setText('');
      refresh();
    },
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Memo> }) =>
      apiPatch<Memo>(`/api/memos/${id}`, patch),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: true }>(`/api/memos/${id}`),
    onSuccess: refresh,
  });

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    create.mutate({ text: value });
  };

  const scheduleDelete = (memo: Memo) => {
    if (pendingTimer.current) window.clearTimeout(pendingTimer.current);
    setPending(memo);
    queryClient.setQueryData<Memo[]>(queryKeys.memos, (old) =>
      old?.filter((item) => item.id !== memo.id),
    );
    pendingTimer.current = window.setTimeout(() => {
      remove.mutate(memo.id);
      setPending(null);
      pendingTimer.current = null;
    }, 5000);
  };

  const undoDelete = () => {
    if (pendingTimer.current) {
      window.clearTimeout(pendingTimer.current);
      pendingTimer.current = null;
    }
    setPending(null);
    refresh();
  };

  const visible = memos.slice(0, 4);

  return (
    <Card className="flex h-full flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-medium text-ink">快速备忘</h2>
        {onOpenAll ? (
          <Button variant="ghost" size="sm" onClick={onOpenAll}>
            全部
          </Button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="记点什么，比如：买牛奶"
        />
        <Button size="sm" onClick={submit} aria-label="添加备忘">
          <Plus size={16} />
        </Button>
      </div>

      <div className="mt-3 flex-1 space-y-2">
        {visible.length === 0 ? (
          <p className="py-4 text-sm text-muted">随手记一笔，别让小事占脑子。</p>
        ) : (
          visible.map((memo) => (
            <div
              key={memo.id}
              className="group flex items-start gap-2 rounded-[10px] border border-line/70 px-3 py-2"
            >
              <button
                type="button"
                aria-label={memo.pinned ? '取消置顶' : '置顶'}
                onClick={() =>
                  update.mutate({ id: memo.id, patch: { pinned: !memo.pinned } })
                }
                className="mt-0.5 text-muted hover:text-accent"
              >
                <Pin
                  size={14}
                  className={memo.pinned ? 'fill-accent text-accent' : ''}
                />
              </button>
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words text-sm text-ink">
                  {memo.text}
                </p>
                <p className="mt-0.5 text-xs text-muted">{formatMemoTime(memo.updatedAt)}</p>
              </div>
              <button
                type="button"
                aria-label="删除备忘"
                onClick={() => scheduleDelete(memo)}
                className="mt-0.5 text-muted opacity-0 transition group-hover:opacity-100 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {pending ? (
        <div className="mt-3 flex items-center justify-between rounded-[10px] bg-canvas px-3 py-2 text-xs text-muted">
          <span>已删除一条备忘</span>
          <button type="button" className="text-accent" onClick={undoDelete}>
            撤销
          </button>
        </div>
      ) : null}
    </Card>
  );
}
