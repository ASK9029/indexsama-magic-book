import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type {
  Game,
  GameStats,
  GameStatus,
  GameWithCover,
} from '@shared/types';

export interface GameFiltersValue {
  status?: string;
  platform?: string;
  q?: string;
  sort?: string;
}

export interface GameInput {
  title: string;
  platform: string;
  status?: GameStatus;
  rating?: number | null;
  startDate?: string | null;
  finishDate?: string | null;
  notes?: string;
}

export function useGames(filters: GameFiltersValue = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const queryString = params.toString();

  return useQuery({
    queryKey: queryKeys.games(filters as Record<string, string | undefined>),
    queryFn: () =>
      apiGet<Game[]>(`/api/games${queryString ? `?${queryString}` : ''}`),
  });
}

export function useGameStats() {
  return useQuery({
    queryKey: queryKeys.gameStats,
    queryFn: () => apiGet<GameStats>('/api/games/stats'),
  });
}

export function useGame(id?: string) {
  return useQuery({
    queryKey: queryKeys.game(id ?? ''),
    queryFn: () => apiGet<GameWithCover>(`/api/games/${id}`),
    enabled: Boolean(id),
  });
}

export function useGameMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['games'] });
    void queryClient.invalidateQueries({ queryKey: ['game'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.gameStats });
  };

  const create = useMutation({
    mutationFn: (input: GameInput) => apiPost<Game>('/api/games', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<GameInput> }) =>
      apiPatch<Game>(`/api/games/${id}`, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: true }>(`/api/games/${id}`),
    onSuccess: invalidate,
  });

  const playtime = useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) =>
      apiPost<Game>(`/api/games/${id}/playtime`, { minutes }),
    onSuccess: invalidate,
  });

  const uploadCover = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append('file', file);
      return apiUpload<GameWithCover>(`/api/games/${id}/cover`, form);
    },
    onSuccess: invalidate,
  });

  const removeCover = useMutation({
    mutationFn: (id: string) =>
      apiDelete<GameWithCover>(`/api/games/${id}/cover`),
    onSuccess: invalidate,
  });

  return { create, update, remove, playtime, uploadCover, removeCover };
}
