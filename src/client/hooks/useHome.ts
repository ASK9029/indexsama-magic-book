import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { HomeAggregate } from '@shared/types';

export function useHome() {
  return useQuery({
    queryKey: queryKeys.home,
    queryFn: () => apiGet<HomeAggregate>('/api/home'),
  });
}
