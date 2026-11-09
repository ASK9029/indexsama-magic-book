import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { Select } from '@client/components/ui/Select';
import { Textarea } from '@client/components/ui/Textarea';
import { useConfirm } from '@client/components/ui/Confirm';
import { useGame, useGameMutations, type GameInput } from '@client/hooks/useGames';
import { formatMinutes } from '@shared/format';
import type { GameStatus } from '@shared/types';
import { GameCoverUploader } from './GameCoverUploader';
import { GameModal, GAME_STATUS_LABELS } from './GameModal';

export function GameDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: game, isLoading } = useGame(id);
  const { update, remove, playtime } = useGameMutations();
  const { confirm } = useConfirm();

  const [notes, setNotes] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const initialized = useRef<string | null>(null);

  useEffect(() => {
    if (game && initialized.current !== game.id) {
      setNotes(game.notes);
      initialized.current = game.id;
    }
  }, [game]);

  useEffect(() => {
    if (!game) return;
    if (notes === game.notes) return;
    const timer = setTimeout(() => {
      update.mutate({ id: game.id, patch: { notes } });
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, game?.id]);

  if (isLoading || !game) {
    return <p className="text-sm text-muted">正在加载…</p>;
  }

  const saveEdit = (input: GameInput) => {
    update.mutate({ id: game.id, patch: input });
    setEditOpen(false);
  };

  const deleteGame = async () => {
    const ok = await confirm({
      title: '删除游戏',
      description: '封面文件也会一起删除。',
      confirmText: '删除',
      danger: true,
    });
    if (ok) {
      remove.mutate(game.id, { onSuccess: () => navigate('/games') });
    }
  };

  const addCustom = () => {
    const value = Number(customMinutes);
    if (Number.isFinite(value) && value > 0) {
      playtime.mutate({ id: game.id, minutes: value });
      setCustomMinutes('');
    }
  };

  return (
    <div>
      <Link to="/games" className="text-sm text-accent">
        ← 返回游戏库
      </Link>

      <div className="mt-3 grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden rounded-card border border-line bg-canvas">
            {game.coverUrl ? (
              <img src={game.coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-1 bg-canvas">
                <span className="text-3xl font-semibold text-muted">
                  {game.title.slice(0, 1)}
                </span>
                <span className="text-xs text-muted">{game.platform}</span>
              </div>
            )}
          </div>
          <GameCoverUploader
            gameId={game.id}
            hasCover={Boolean(game.coverFileId)}
          />
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-ink">{game.title}</h1>
              <p className="mt-1 text-sm text-muted">{game.platform}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                编辑
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void deleteGame()}>
                删除
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="detail-status" className="text-xs text-muted">
                状态
              </label>
              <Select
                id="detail-status"
                className="mt-1 w-28"
                value={game.status}
                onChange={(event) =>
                  update.mutate({
                    id: game.id,
                    patch: { status: event.target.value as GameStatus },
                  })
                }
              >
                {(Object.keys(GAME_STATUS_LABELS) as GameStatus[]).map((item) => (
                  <option key={item} value={item}>
                    {GAME_STATUS_LABELS[item]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="detail-rating" className="text-xs text-muted">
                评分
              </label>
              <Select
                id="detail-rating"
                className="mt-1 w-28"
                value={game.rating !== null ? String(game.rating) : ''}
                onChange={(event) =>
                  update.mutate({
                    id: game.id,
                    patch: {
                      rating:
                        event.target.value === ''
                          ? null
                          : Number(event.target.value),
                    },
                  })
                }
              >
                <option value="">未评分</option>
                {[1, 2, 3, 4, 5].map((item) => (
                  <option key={item} value={item}>
                    {item} 星
                  </option>
                ))}
              </Select>
            </div>
            <Button
              size="sm"
              onClick={() =>
                update.mutate({ id: game.id, patch: { status: 'completed' } })
              }
            >
              标记为已通关
            </Button>
          </div>

          <p className="mt-3 text-sm text-muted">
            游玩时长：{formatMinutes(game.playtimeMinutes)}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => playtime.mutate({ id: game.id, minutes: 30 })}
            >
              +30 分钟
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => playtime.mutate({ id: game.id, minutes: 60 })}
            >
              +1 小时
            </Button>
            <Input
              className="w-24"
              type="number"
              min={1}
              placeholder="自定义"
              value={customMinutes}
              onChange={(event) => setCustomMinutes(event.target.value)}
            />
            <Button size="sm" onClick={addCustom} disabled={!customMinutes}>
              累加
            </Button>
          </div>

          <p className="mt-3 text-sm text-muted">
            开始日期：{game.startDate ?? '—'} · 通关日期：{game.finishDate ?? '—'}
          </p>

          <div className="mt-4">
            <label htmlFor="detail-notes" className="text-sm text-muted">
              备注
            </label>
            <Textarea
              id="detail-notes"
              className="mt-1"
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>
      </div>

      <GameModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={game}
        onSave={saveEdit}
      />
    </div>
  );
}
