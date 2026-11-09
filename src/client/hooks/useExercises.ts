import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { Exercise } from '@shared/types';

export interface ExerciseFiltersValue {
  q?: string;
  muscleGroup?: string;
  equipment?: string;
  type?: string;
}

export type ExerciseInput = Pick<
  Exercise,
  'name' | 'muscleGroup' | 'equipment' | 'type' | 'notes'
>;

export function useExercises(filters: ExerciseFiltersValue = {}) {
  const queryClient = useQueryClient();
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value);
  }
  const queryString = params.toString();

  const query = useQuery({
    queryKey: queryKeys.exercises(
      filters as Record<string, string | undefined>,
    ),
    queryFn: () =>
      apiGet<Exercise[]>(
        `/api/fitness/exercises${queryString ? `?${queryString}` : ''}`,
      ),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['exercises'] });
  };

  const create = useMutation({
    mutationFn: (input: ExerciseInput) =>
      apiPost<Exercise>('/api/fitness/exercises', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ExerciseInput> }) =>
      apiPatch<Exercise>(`/api/fitness/exercises/${id}`, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/fitness/exercises/${id}`),
    onSuccess: invalidate,
  });

  return {
    exercises: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
