import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';

export interface PositionEntry {
  maker:            string;
  pairId:           string;
  size:             bigint;   // positive = long, negative = short
  margin:           bigint;
  mode:             'cross' | 'isolated';
  markPrice:        bigint;
  entryPrice:       bigint;
  liquidationPrice: bigint;
  leverage:         bigint;
  unrealizedPnl:    bigint;
}

export interface PositionsResponse {
  address:      string;
  totalBalance: bigint;
  freeMargin:   bigint;
  positions:    PositionEntry[];
}

export function usePositions(address: string) {
  return useQuery({
    queryKey: queryKeys.positions(address),
    queryFn: () => api.get<PositionsResponse>(`/positions/${address}`),
    enabled: !!address,
    staleTime: 10_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
  });
}
