import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { useWsStream } from '@/hooks/ws/useWebSocket';
import type { WsMessage, WsPositionData } from '@/types/api';

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

export function usePositions(address: string, pairId?: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.positions(address);

  const query = useQuery({
    queryKey,
    queryFn: () => api.get<PositionsResponse>(`/positions/${address}`),
    enabled: !!address,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  // Update cache when WS delivers position.update
  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type !== 'position.update') return;
    const d = msg.data as WsPositionData;
    if (d.maker.toLowerCase() !== address.toLowerCase()) return;

    // Update the position in the cached list
    queryClient.setQueryData<PositionsResponse>(queryKey, (old) => {
      if (!old) return old;
      const existingIdx = old.positions.findIndex(
        p => p.pairId === d.pairId,
      );
      const updated = {
        size:       BigInt(d.size),
        margin:     BigInt(d.margin),
        mode:       d.mode as 'cross' | 'isolated',
        entryPrice: BigInt(d.entryPrice),
      };
      if (existingIdx >= 0) {
        // Update existing position
        const positions = [...old.positions];
        const existing = positions[existingIdx] as PositionEntry;
        positions[existingIdx] = { ...existing, ...updated };
        return { ...old, positions };
      } else if (BigInt(d.size) !== 0n) {
        // New position
        const newEntry: PositionEntry = {
          maker:            d.maker,
          pairId:           d.pairId,
          unrealizedPnl:    0n,
          markPrice:        0n,
          liquidationPrice: 0n,
          leverage:         1n,
          size:             updated.size,
          margin:           updated.margin,
          mode:             updated.mode,
          entryPrice:       updated.entryPrice,
        };
        return {
          ...old,
          positions: [...old.positions, newEntry],
        };
      }
      return old;
    });
  }, [address, queryClient, queryKey]);

  // Subscribe to WS stream for the active pair
  useWsStream(pairId ?? '', handleWs);

  return query;
}
