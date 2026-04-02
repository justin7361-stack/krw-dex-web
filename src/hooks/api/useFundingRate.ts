import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { encodePairId } from '@/lib/pair/pairId';
import type { FundingRate } from '@/types/api';

export function useFundingRate(pairId: string) {
  return useQuery({
    queryKey: queryKeys.fundingRate(pairId),
    queryFn: () =>
      api.get<FundingRate>(`/funding/${encodePairId(pairId)}`),
    enabled: !!pairId,
    staleTime: 30_000,
    refetchInterval: 30_000,  // poll every 30s
    refetchOnWindowFocus: false,
  });
}
