import { useEffect, useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Modal } from '@client/components/ui/Modal';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import type { GameInput } from '@client/hooks/useGames';
import type { Game, GameStatus } from '@shared/types';

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  wishlist: '想玩',
  playing: '在玩',
  completed: '已通关',
  paused: '搁置',
};

export function GameModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Game | null;
  onSave: (input: GameInput) => void;
}) {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('PC');
  const [status, setStatus] = useState<GameStatus>('wishlist');
  const [rating, setRating] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    setTitle(initial?.title ?? '');
    setPlatform(initial?.platform ?? 'PC');
    setStatus(initial?.status ?? 'wishlist');
    setRating(initial?.rating !== null && initial?.rating !== undefined ? String(initial.rating) : '');
    setNotes(initial?.notes ?? '');
  }, [open, initial]);

  const submit = () => {
    if (!title.trim() || !platform.trim()) return;
    onSave({
      title: title.trim(),
      platform: platform.trim(),
      status,
      rating: rating === '' ? null : Number(rating),
      notes,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? '编辑游戏' : '添加游戏'}>
      <div className="space-y-3">
        <div>
          <label htmlFor="game-title" className="text-sm text-muted">
            标题
          </label>
          <Input
            id="game-title"
            className="mt-1"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="game-platform" className="text-sm text-muted">
              平台
            </label>
            <Input
              id="game-platform"
              className="mt-1"
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="game-status" className="text-sm text-muted">
              状态
            </label>
            <Select
              id="game-status"
              className="mt-1"
              value={status}
              onChange={(event) => setStatus(event.target.value as GameStatus)}
            >
              {(Object.keys(GAME_STATUS_LABELS) as GameStatus[]).map((item) => (
                <option key={item} value={item}>
                  {GAME_STATUS_LABELS[item]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="game-rating" className="text-sm text-muted">
            评分
          </label>
          <Select
            id="game-rating"
            className="mt-1"
            value={rating}
            onChange={(event) => setRating(event.target.value)}
          >
            <option value="">未评分</option>
            {[1, 2, 3, 4, 5].map((item) => (
              <option key={item} value={item}>
                {item} 星
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="game-notes" className="text-sm text-muted">
            备注
          </label>
          <Textarea
            id="game-notes"
            className="mt-1"
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={submit} disabled={!title.trim() || !platform.trim()}>
            保存
          </Button>
        </div>
      </div>
    </Modal>
  );
}
