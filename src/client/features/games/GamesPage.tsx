import { useState } from 'react';
import { Button } from '@client/components/ui/Button';
import { Input } from '@client/components/ui/Input';
import { PageHeader } from '@client/components/ui/PageHeader';
import { Select } from '@client/components/ui/Select';
import { Tabs } from '@client/components/ui/Tabs';
import {
  useGameMutations,
  useGames,
  type GameInput,
} from '@client/hooks/useGames';
import { GameCard } from './GameCard';
import { GameModal } from './GameModal';
import { GameStatsStrip } from './GameStatsStrip';

const STATUS_TABS = [
  { value: 'all', label: '全部' },
  { value: 'playing', label: '在玩' },
  { value: 'wishlist', label: '想玩' },
  { value: 'completed', label: '已通关' },
  { value: 'paused', label: '搁置' },
];

const PLATFORMS = ['PC', 'Switch', 'PS5', 'Xbox', '手机', '其他'];

export function GamesPage() {
  const [status, setStatus] = useState('all');
  const [platform, setPlatform] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('updated');
  const [modalOpen, setModalOpen] = useState(false);

  const { data: games = [], isLoading } = useGames({
    status: status === 'all' ? undefined : status,
    platform: platform || undefined,
    q: q || undefined,
    sort,
  });
  const { create } = useGameMutations();

  const save = (input: GameInput) => {
    create.mutate(input, { onSuccess: () => setModalOpen(false) });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageHeader
          title="游戏娱乐"
          subtitle="想玩的、在玩的、通关的都收在这里"
        />
        <Button onClick={() => setModalOpen(true)}>添加游戏</Button>
      </div>

      <GameStatsStrip />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Tabs items={STATUS_TABS} value={status} onChange={setStatus} />
        <Input
          className="w-48"
          placeholder="搜索游戏"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
        <Select
          className="w-32"
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
        >
          <option value="">全部平台</option>
          {PLATFORMS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
        <Select
          className="w-32"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        >
          <option value="updated">最近更新</option>
          <option value="title">标题</option>
          <option value="playtime">游玩时长</option>
          <option value="rating">评分</option>
        </Select>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-muted">正在加载…</p>
      ) : games.length === 0 ? (
        <p className="mt-4 text-sm text-muted">还没有游戏，添加一个吧。</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      <GameModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={save}
      />
    </div>
  );
}
