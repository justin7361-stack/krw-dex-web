import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Order, WsMessage } from '@/types/api';
import { useWsStream } from '@/hooks/ws/useWebSocket';

export function useOpenOrders(address: string, pairId?: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.openOrders(address);

  const query = useQuery({
    queryKey,
    queryFn: () => api.get<Order[]>(`/orders/${address}?status=open`),
    enabled: !!address,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  // Update order status in cache when WS delivers an update
  const handleWs = useCallback(
    (msg: WsMessage) => {
      if (msg.type === 'order.status') {
        const { orderId, status } = msg.data as { orderId: string; status: string };
        queryClient.setQueryData<Order[]>(queryKey, (prev) => {
          if (!prev) return prev;
          return prev
            .map((o) => (o.orderId === orderId ? { ...o, status: status as Order['status'] } : o))
            .filter((o) => o.status === 'open' || o.status === 'partially_filled');
        });
      }
    },
    [queryClient, queryKey],
  );

  // Subscribe to the pair's WS stream if provided
  useWsStream(pairId ?? '', handleWs);

  return query;
}
