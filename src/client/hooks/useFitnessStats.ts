import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { SeriesPoint } from '@shared/types';

export type StatsView = 'week' | 'month' | 'year';

export interface FitnessStatsData {
  range: { from: string; to: string };
  summary: {
    totalVolume: number;
    sessionCount: number;
    totalDurationMinutes: number;
  };
  weight: SeriesPoint[];
  volume: SeriesPoint[];
  count: SeriesPoint[];
  strength: SeriesPoint[];
  exerciseOptions: { id: string; name: string }[];
}

export function useFitnessStats(
  view: StatsView,
  anchor: string,
  exerciseId?: string,
) {
  return useQuery({
    queryKey: queryKeys.fitnessStats(view, anchor, exerciseId),
    queryFn: () =>
      apiGet<FitnessStatsData>(
        `/api/stats/fitness?view=${view}&anchor=${encodeURIComponent(anchor)}${
          exerciseId ? `&exerciseId=${encodeURIComponent(exerciseId)}` : ''
        }`,
      ),
  });
}
