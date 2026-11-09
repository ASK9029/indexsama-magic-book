import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { DayAggregate } from '@shared/types';

export function useDay(date: string) {
  return useQuery({
    queryKey: queryKeys.day(date),
    queryFn: () => apiGet<DayAggregate>(`/api/day/${encodeURIComponent(date)}`),
  });
}
