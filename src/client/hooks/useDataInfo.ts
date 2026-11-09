import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@client/api/client';
import { queryKeys } from '@client/api/queryKeys';
import type { DataInfo } from '@shared/types';

export function useDataInfo() {
  return useQuery({
    queryKey: queryKeys.dataInfo,
    queryFn: () => apiGet<DataInfo>('/api/data/info'),
  });
}
