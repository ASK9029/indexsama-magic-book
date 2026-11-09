import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { Task } from '@shared/types';

export type TaskInput = Pick<
  Task,
  'date' | 'title' | 'category' | 'priority' | 'time' | 'note'
>;

export function useTasks(date: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.tasks(date),
    queryFn: () => apiGet<Task[]>(`/api/tasks?date=${encodeURIComponent(date)}`),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const create = useMutation({
    mutationFn: (input: TaskInput) => apiPost<Task>('/api/tasks', input),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      apiPatch<Task>(`/api/tasks/${id}`, patch),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: true }>(`/api/tasks/${id}`),
    onSuccess: refresh,
  });

  const carryOver = useMutation({
    mutationFn: ({ id, targetDate }: { id: string; targetDate: string }) =>
      apiPost<Task>(`/api/tasks/${id}/carry-over`, { targetDate }),
    onSuccess: refresh,
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
    carryOver,
  };
}
