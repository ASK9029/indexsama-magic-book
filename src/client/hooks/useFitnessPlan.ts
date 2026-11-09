import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { PlanDay, PlanExercise } from '@shared/types';

export interface PlanDayInput {
  name: string;
  isRest: boolean;
  exercises: PlanExercise[];
}

export function useFitnessPlan() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.fitnessPlan,
    queryFn: () => apiGet<PlanDay[]>('/api/fitness/plan'),
  });

  const save = useMutation({
    mutationFn: ({ weekday, day }: { weekday: number; day: PlanDayInput }) =>
      apiPut<PlanDay>(`/api/fitness/plan/${weekday}`, day),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.fitnessPlan });
    },
  });

  return {
    plan: query.data ?? [],
    isLoading: query.isLoading,
    save,
  };
}
