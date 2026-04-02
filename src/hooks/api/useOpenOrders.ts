import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import type { Order, WsMessage } from '@/types/api';
import { useWsStream } from '@/hooks/ws/useWebSocket';

// Server response shape: { orders: StoredOrder[] }
interface OrdersResponse { orders: Order[] }

export function useOpenOrders(address: string, pairId?: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.openOrders(address);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.get<OrdersResponse>(`/orders/${address}?status=open`);
      // Server returns isBuy, map to side for frontend compatibility
      return (res.orders ?? []).map((o) => normalizeOrder(o as unknown as Record<string, unknown>));
    },
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

  useWsStream(pairId ?? '', handleWs);

  return query;
}

export function useFilledOrders(address: string) {
  return useQuery({
    queryKey: [...queryKeys.openOrders(address), 'filled'],
    queryFn: async () => {
      const res = await api.get<OrdersResponse>(`/orders/${address}?status=filled`);
      return (res.orders ?? []).map((o) => normalizeOrder(o as unknown as Record<string, unknown>));
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Map server StoredOrder → frontend Order type */
function normalizeOrder(o: Record<string, unknown>): Order {
  return {
    ...(o as unknown as Order),
    // Server exposes both id and orderId — prefer orderId if present
    orderId: (o['orderId'] ?? o['id']) as string,
    // Map isBuy → side
    side: (o['isBuy'] ? 'buy' : 'sell') as Order['side'],
    // Ensure bigint fields (reviver already applied, but fallback for strings)
    price:        typeof o['price']        === 'bigint' ? o['price']        as bigint : BigInt(String(o['price'] ?? '0')),
    amount:       typeof o['amount']       === 'bigint' ? o['amount']       as bigint : BigInt(String(o['amount'] ?? '0')),
    filledAmount: typeof o['filledAmount'] === 'bigint' ? o['filledAmount'] as bigint : BigInt(String(o['filledAmount'] ?? '0')),
    nonce:        typeof o['nonce']        === 'bigint' ? o['nonce']        as bigint : BigInt(String(o['nonce'] ?? '0')),
    expiry:       typeof o['expiry']       === 'bigint' ? o['expiry']       as bigint : BigInt(String(o['expiry'] ?? '0')),
  };
}
