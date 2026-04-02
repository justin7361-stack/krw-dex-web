import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/queryKeys';
import { encodePairId } from '@/lib/pair/pairId';
import type { Candle, CandleResolution } from '@/types/api';

export function useCandles(pairId: string, resolution: CandleResolution) {
  return useQuery({
    queryKey: queryKeys.candles(pairId, resolution),
    queryFn: () =>
      api.get<Candle[]>(
        `/candles/${encodePairId(pairId)}?resolution=${resolution}`,
      ),
    enabled: !!pairId,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
