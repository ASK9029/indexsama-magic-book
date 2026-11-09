import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { WeightLog } from '@shared/types';

export interface WeightInput {
  date: string;
  weightKg: number;
}

export function useWeights(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const queryString = params.toString();

  return useQuery({
    queryKey: queryKeys.weights(from, to),
    queryFn: () =>
      apiGet<WeightLog[]>(`/api/weights${queryString ? `?${queryString}` : ''}`),
  });
}

export function useWeightMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['weights'] });
    void queryClient.invalidateQueries({ queryKey: ['stats'] });
  };

  const create = useMutation({
    mutationFn: (input: WeightInput) =>
      apiPost<WeightLog>('/api/weights', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<WeightInput>;
    }) => apiPatch<WeightLog>(`/api/weights/${id}`, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/weights/${id}`),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
