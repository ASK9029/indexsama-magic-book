import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { DietDay, Meal, MealEntry, MealState } from '@shared/types';

export interface AddEntryInput {
  date: string;
  meal: Meal;
  kind: 'plan' | 'actual';
  foodId: string;
  amount: number;
  unit: 'g' | 'ml';
  servingLabel?: string | null;
}

export function useDietDay(date: string) {
  return useQuery({
    queryKey: queryKeys.dietDay(date),
    queryFn: () => apiGet<DietDay>(`/api/diet/day?date=${encodeURIComponent(date)}`),
  });
}

export function useDietMutations(date: string) {
  const queryClient = useQueryClient();

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.dietDay(date) });
  };

  const addEntry = useMutation({
    mutationFn: (input: AddEntryInput) =>
      apiPost<MealEntry>('/api/diet/entries', input),
    onSuccess: refresh,
  });

  const updateEntry = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: { amount?: number; meal?: Meal };
    }) => apiPatch<MealEntry>(`/api/diet/entries/${id}`, patch),
    onSuccess: refresh,
  });

  const deleteEntry = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/diet/entries/${id}`),
    onSuccess: refresh,
  });

  const setDone = useMutation({
    mutationFn: ({ meal, done }: { meal: Meal; done: boolean }) =>
      apiPost<MealState>(`/api/diet/meals/${meal}/done`, { date, done }),
    onSuccess: refresh,
  });

  const copyPlan = useMutation({
    mutationFn: ({ meal, mode }: { meal: Meal; mode: 'replace' | 'append' }) =>
      apiPost<MealEntry[]>(`/api/diet/meals/${meal}/copy-plan`, { date, mode }),
    onSuccess: refresh,
  });

  const clear = useMutation({
    mutationFn: ({ meal, kind }: { meal: Meal; kind: 'plan' | 'actual' }) =>
      apiPost<{ ok: true }>(`/api/diet/meals/${meal}/clear`, { date, kind }),
    onSuccess: refresh,
  });

  return { addEntry, updateEntry, deleteEntry, setDone, copyPlan, clear };
}
