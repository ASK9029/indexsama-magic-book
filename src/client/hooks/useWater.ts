import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPost,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { WaterLog } from '@shared/types';

export function useWater(date: string) {
  return useQuery({
    queryKey: queryKeys.water(date),
    queryFn: () => apiGet<WaterLog[]>(`/api/water?date=${encodeURIComponent(date)}`),
  });
}

export function useWaterMutations(date: string) {
  const queryClient = useQueryClient();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.water(date) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.dietDay(date) });
  };

  const add = useMutation({
    mutationFn: (amountMl: number) =>
      apiPost<WaterLog>('/api/water', { date, amountMl }),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/water/${id}`),
    onSuccess: refresh,
  });

  const undo = useMutation({
    mutationFn: () => apiPost<{ ok: true }>('/api/water/undo', { date }),
    onSuccess: refresh,
  });

  return { add, remove, undo };
}
