import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { encodePairId } from '@/lib/pair/pairId';
import type { Trade, WsMessage } from '@/types/api';
import { useWsStream } from '@/hooks/ws/useWebSocket';

const MAX_TRADES = 50;

export function useTrades(pairId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.trades(pairId);

  // Initial fetch
  const query = useQuery({
    queryKey,
    queryFn: () => api.get<Trade[]>(`/trades/${encodePairId(pairId)}`),
    enabled: !!pairId,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  // Prepend new trades from WS
  const handleWs = useCallback(
    (msg: WsMessage) => {
      if (msg.type === 'trades.recent') {
        const incoming = msg.data as Trade[];
        queryClient.setQueryData<Trade[]>(queryKey, (prev) => {
          const merged = [...incoming, ...(prev ?? [])];
          return merged.slice(0, MAX_TRADES);
        });
      }
    },
    [queryClient, queryKey],
  );

  useWsStream(pairId, handleWs);

  return query;
}
