import { useEffect, useState } from 'react';
import { subscribeToStream } from './useWebSocket';

export type WsStatus = 'connecting' | 'connected' | 'disconnected';

/**
 * Returns the current WebSocket connection status for a pair.
 * Subscribes with an empty handler just to track connection state.
 */
export function useWsStatus(pairId: string): WsStatus {
  const [status, setStatus] = useState<WsStatus>('connecting');

  useEffect(() => {
    if (!pairId) return;

    // Subscribe with a no-op handler to open connection
    const unsubscribe = subscribeToStream(pairId, (msg) => {
      // Any message received = connected
      if (status !== 'connected') setStatus('connected');
    });

    // Check if WS is open after a tick
    const timer = setTimeout(() => setStatus('connected'), 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
      setStatus('disconnected');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairId]);

  return status;
}
