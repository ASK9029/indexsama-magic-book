import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { Settings } from '@shared/types';

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => apiGet<Settings>('/api/settings'),
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<Settings>) => apiPatch<Settings>('/api/settings', patch),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.settings, data);
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    update: (patch: Partial<Settings>) => mutation.mutate(patch),
  };
}
