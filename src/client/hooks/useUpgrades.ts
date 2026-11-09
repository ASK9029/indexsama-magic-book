import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { ExerciseUpgrade } from '@shared/types';

export interface CurrentWeight {
  exerciseId: string;
  exerciseName: string;
  currentWeightKg: number | null;
  latestUpgrade: ExerciseUpgrade | null;
}

export interface UpgradeInput {
  exerciseId: string;
  date: string;
  fromWeightKg?: number;
  toWeightKg: number;
  note?: string;
}

export function useCurrentWeights() {
  return useQuery({
    queryKey: queryKeys.currentWeights,
    queryFn: () => apiGet<CurrentWeight[]>('/api/fitness/current-weights'),
  });
}

export function useUpgrades(exerciseId?: string) {
  return useQuery({
    queryKey: queryKeys.upgrades(exerciseId),
    queryFn: () =>
      apiGet<ExerciseUpgrade[]>(
        `/api/fitness/upgrades${
          exerciseId ? `?exerciseId=${encodeURIComponent(exerciseId)}` : ''
        }`,
      ),
  });
}

export function useUpgradeMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['currentWeights'] });
    void queryClient.invalidateQueries({ queryKey: ['upgrades'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.fitnessPlan });
  };

  const create = useMutation({
    mutationFn: (input: UpgradeInput) =>
      apiPost<ExerciseUpgrade>('/api/fitness/upgrades', input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<UpgradeInput>;
    }) => apiPatch<ExerciseUpgrade>(`/api/fitness/upgrades/${id}`, patch),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/fitness/upgrades/${id}`),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
