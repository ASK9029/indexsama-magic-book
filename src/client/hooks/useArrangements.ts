import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { StudyArrangement } from '@shared/types';

export type ArrangementInput = Pick<
  StudyArrangement,
  'subjectId' | 'date' | 'content' | 'plannedMinutes'
>;

export function useArrangements(date: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.arrangements(date),
    queryFn: () =>
      apiGet<StudyArrangement[]>(
        `/api/study/arrangements?date=${encodeURIComponent(date)}`,
      ),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['arrangements'] });
  };

  const create = useMutation({
    mutationFn: (input: ArrangementInput) =>
      apiPost<StudyArrangement>('/api/study/arrangements', input),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<StudyArrangement>;
    }) => apiPatch<StudyArrangement>(`/api/study/arrangements/${id}`, patch),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/study/arrangements/${id}`),
    onSuccess: refresh,
  });

  return {
    arrangements: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
