import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { encodePairId } from '@/lib/pair/pairId';
import type { FundingRate, WsMessage, WsFundingData } from '@/types/api';
import { useWsStream } from '@/hooks/ws/useWebSocket';

export function useFundingRate(pairId: string) {
  const queryClient = useQueryClient();
  const queryKey = queryKeys.fundingRate(pairId);

  const query = useQuery({
    queryKey,
    queryFn: () =>
      api.get<FundingRate>(`/funding/${encodePairId(pairId)}`),
    enabled: !!pairId,
    staleTime: 60_000,          // WS keeps data fresh; REST is fallback
    refetchInterval: 60_000,    // poll every 60s as fallback (was 30s)
    refetchOnWindowFocus: false,
  });

  // Update TanStack Query cache when WS delivers a funding.update event.
  // bigintReviver in useWebSocket already converts markPrice/indexPrice/rate
  // to bigint at JSON.parse time, so we cast through unknown to bigint.
  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type !== 'funding.update') return;
    const d = msg.data as WsFundingData;
    if (d.pairId !== pairId) return;

    queryClient.setQueryData<FundingRate>(queryKey, {
      pairId:        d.pairId,
      rate:          d.rate as unknown as bigint,
      markPrice:     d.markPrice as unknown as bigint,
      indexPrice:    d.indexPrice as unknown as bigint,
      nextFundingAt: d.nextFundingAt,
    });
  }, [pairId, queryClient, queryKey]);

  useWsStream(pairId, handleWs);

  return query;
}
