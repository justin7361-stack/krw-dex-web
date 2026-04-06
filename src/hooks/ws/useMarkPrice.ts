import { useState, useCallback } from 'react';

import { useWsStream } from './useWebSocket';
import type { WsMessage, WsMarkPriceData } from '@/types/api';

/**
 * Returns real-time mark price and index price for a pair via WebSocket.
 * Falls back to 0n until the first markprice.update message arrives.
 *
 * Note: bigintReviver in useWebSocket converts markPrice/indexPrice to bigint
 * at JSON.parse time, so BigInt() wrapping handles both the typed string form
 * and the runtime bigint form safely.
 */
export function useMarkPrice(pairId: string): {
  markPrice:  bigint;
  indexPrice: bigint;
  ts:         number;
} {
  const [state, setState] = useState({ markPrice: 0n, indexPrice: 0n, ts: 0 });

  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type !== 'markprice.update') return;
    const d = msg.data as WsMarkPriceData;
    if (d.pairId !== pairId) return;

    setState({
      markPrice:  BigInt(d.markPrice as unknown as string | bigint),
      indexPrice: BigInt(d.indexPrice as unknown as string | bigint),
      ts:         d.ts,
    });
  }, [pairId]);

  useWsStream(pairId, handleWs);

  return state;
}
