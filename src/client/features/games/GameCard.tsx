import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatMinutes } from '@shared/format';
import type { Game } from '@shared/types';
import { GAME_STATUS_LABELS } from './GameModal';

const COLORS = [
  '#7c3aed',
  '#0f766e',
  '#b45309',
  '#be123c',
  '#1d4ed8',
  '#4d7c0f',
];

function colorFor(platform: string): string {
  let hash = 0;
  for (const char of platform) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return COLORS[hash % COLORS.length];
}

export function GameCard({ game }: { game: Game }) {
  const [broken, setBroken] = useState(false);
  const showCover = game.coverFileId !== null && !broken;
  const rating = game.rating ?? 0;

  return (
    <Link to={`/games/${game.id}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-card border border-line bg-canvas">
        {showCover ? (
          <img
            src={`/api/files/${game.coverFileId}`}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setBroken(true)}
          />
        ) : (
          <div
            className="flex h-full flex-col items-center justify-center gap-1"
            style={{ backgroundColor: colorFor(game.platform) }}
          >
            <span className="text-3xl font-semibold text-white/90">
              {game.title.slice(0, 1)}
            </span>
            <span className="text-xs text-white/80">{game.platform}</span>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
          {GAME_STATUS_LABELS[game.status]}
        </span>
      </div>
      <div className="mt-2">
        <p className="truncate text-sm text-ink group-hover:text-accent">
          {game.title}
        </p>
        <p className="text-xs text-muted">
          {game.platform} · {formatMinutes(game.playtimeMinutes)}
        </p>
        <p className="text-xs text-amber-500">
          {'★'.repeat(rating)}
          {'☆'.repeat(5 - rating)}
        </p>
      </div>
    </Link>
  );
}
