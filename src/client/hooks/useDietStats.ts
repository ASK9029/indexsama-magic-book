import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { SeriesPoint } from '@shared/types';
import type { StatsView } from '@client/hooks/useFitnessStats';

export interface DietStatsData {
  range: { from: string; to: string };
  summary: {
    recordedDays: number;
    avgCalories: number;
    avgProtein: number;
    avgWaterMl: number;
    weightChange: number | null;
  };
  calories: SeriesPoint[];
  protein: SeriesPoint[];
  water: SeriesPoint[];
  weight: SeriesPoint[];
  targets: {
    calorieTarget: number | null;
    proteinTarget: number | null;
    waterTarget: number | null;
  };
}

export function useDietStats(view: StatsView, anchor: string) {
  return useQuery({
    queryKey: queryKeys.dietStats(view, anchor),
    queryFn: () =>
      apiGet<DietStatsData>(
        `/api/stats/diet?view=${view}&anchor=${encodeURIComponent(anchor)}`,
      ),
  });
}
