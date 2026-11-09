import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { StudySession } from '@shared/types';

export interface SessionInput {
  subjectId: string;
  date: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  note?: string;
}

export function useStudySessions(subjectId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.studySessions(subjectId),
    queryFn: () =>
      apiGet<StudySession[]>(
        `/api/study/sessions${
          subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : ''
        }`,
      ),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['studySessions'] });
    void queryClient.invalidateQueries({ queryKey: ['studyStats'] });
    void queryClient.invalidateQueries({ queryKey: ['subjects'] });
  };

  const create = useMutation({
    mutationFn: (input: SessionInput) =>
      apiPost<StudySession>('/api/study/sessions', input),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<StudySession>;
    }) => apiPatch<StudySession>(`/api/study/sessions/${id}`, patch),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ ok: true }>(`/api/study/sessions/${id}`),
    onSuccess: refresh,
  });

  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
