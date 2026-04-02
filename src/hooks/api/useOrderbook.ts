import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { encodePairId } from '@/lib/pair/pairId';
import type { OrderbookSnapshot, WsMessage } from '@/types/api';
import { useWsStream } from '@/hooks/ws/useWebSocket';

// ─── useOrderbook ─────────────────────────────────────────────────────────────
// Fetches initial orderbook snapshot via REST, then maintains it live via WS.
// "orderbook.update" from the server is a FULL 20-level snapshot, not a delta.

export function useOrderbook(pairId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.orderbook(pairId);

  // Initial REST fetch
  const query = useQuery({
    queryKey,
    queryFn: () =>
      api.get<OrderbookSnapshot>(`/orderbook/${encodePairId(pairId)}`),
    enabled: !!pairId,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
  });

  // WS handler — update query cache on live messages
  const handleWs = useCallback(
    (msg: WsMessage) => {
      if (msg.type === 'orderbook.snapshot' || msg.type === 'orderbook.update') {
        queryClient.setQueryData(queryKey, msg.data as OrderbookSnapshot);
      }
    },
    [queryClient, queryKey],
  );

  useWsStream(pairId, handleWs);

  return query;
}
