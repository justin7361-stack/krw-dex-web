import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Pair } from '@/types/api';

export function usePairs() {
  return useQuery({
    queryKey: queryKeys.pairs(),
    queryFn: () => api.get<Pair[]>('/pairs'),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Get a single pair by pairId from the cached pairs list. */
export function usePair(pairId: string) {
  const { data: pairs, ...rest } = usePairs();
  const pair = pairs?.find((p) => p.pairId === pairId) ?? null;
  return { data: pair, ...rest };
}
