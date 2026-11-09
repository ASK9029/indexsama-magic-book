import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { Food } from '@shared/types';

export interface FoodFiltersValue {
  q?: string;
  category?: string;
}

export type FoodInput = Pick<
  Food,
  | 'name'
  | 'category'
  | 'unit'
  | 'per100Calories'
  | 'per100Protein'
  | 'servingName'
  | 'servingAmount'
>;

export function useFoods(filters: FoodFiltersValue = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const queryString = params.toString();

  return useQuery({
    queryKey: queryKeys.foods(filters as Record<string, string | undefined>),
    queryFn: () =>
      apiGet<Food[]>(`/api/foods${queryString ? `?${queryString}` : ''}`),
  });
}

export function useRecentFoods() {
  return useQuery({
    queryKey: queryKeys.recentFoods,
    queryFn: () => apiGet<Food[]>('/api/foods/recent'),
  });
}

export function useFrequentFoods() {
  return useQuery({
    queryKey: queryKeys.frequentFoods,
    queryFn: () => apiGet<Food[]>('/api/foods/frequent'),
  });
}

export function useFoodMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['foods'] });
  };

  const create = useMutation({
    mutationFn: (input: FoodInput) => apiPost<Food>('/api/foods', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FoodInput> }) =>
      apiPatch<Food>(`/api/foods/${id}`, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: true }>(`/api/foods/${id}`),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
