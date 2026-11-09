import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { Subject } from '@shared/types';

export type SubjectInput = Pick<
  Subject,
  'name' | 'color' | 'goal' | 'weeklyTargetMinutes'
>;

export function useSubjects(archived = false) {
  const queryClient = useQueryClient();
  const key = archived ? queryKeys.archivedSubjects : queryKeys.subjects;

  const query = useQuery({
    queryKey: key,
    queryFn: () =>
      apiGet<Subject[]>(`/api/subjects${archived ? '?archived=1' : ''}`),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['subjects'] });
  };

  const create = useMutation({
    mutationFn: (input: SubjectInput) => apiPost<Subject>('/api/subjects', input),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<SubjectInput> }) =>
      apiPatch<Subject>(`/api/subjects/${id}`, patch),
    onSuccess: refresh,
  });

  const archive = useMutation({
    mutationFn: (id: string) => apiPost<Subject>(`/api/subjects/${id}/archive`),
    onSuccess: refresh,
  });

  const restore = useMutation({
    mutationFn: (id: string) => apiPost<Subject>(`/api/subjects/${id}/restore`),
    onSuccess: refresh,
  });

  return {
    subjects: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    archive,
    restore,
  };
}
