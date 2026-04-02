import { useEffect, useRef } from 'react';
import { bigintReviver } from '@/lib/bigint/reviver';
import type { WsMessage } from '@/types/api';

// ─── WebSocket Singleton Manager ──────────────────────────────────────────────
// One WS connection per pairId, shared across all subscribers.
// Auto-connects on first subscriber, auto-closes on last unsubscribe.
// Reconnects with exponential backoff on unexpected close.

const WS_BASE = import.meta.env['VITE_WS_URL'] ?? 'ws://localhost:3000';
const PING_INTERVAL_MS  = 30_000;
const BACKOFF_BASE_MS   = 500;
const BACKOFF_MAX_MS    = 30_000;

type MessageHandler = (msg: WsMessage) => void;

interface WsEntry {
  ws:       WebSocket;
  refCount: number;
  handlers: Set<MessageHandler>;
  pingTimer:    ReturnType<typeof setInterval> | null;
  reconnectTimer: ReturnType<typeof setTimeout> | null;
  backoff:  number;
  // Track if we intentionally closed (no reconnect needed)
  intentionalClose: boolean;
}

// Singleton map: pairId → WsEntry
const connections = new Map<string, WsEntry>();

function connect(pairId: string, entry: WsEntry): void {
  const url = `${WS_BASE}/stream?pair=${encodeURIComponent(pairId)}`;
  const ws = new WebSocket(url);
  entry.ws = ws;
  entry.intentionalClose = false;

  ws.onopen = () => {
    entry.backoff = BACKOFF_BASE_MS;
    // Start ping/pong heartbeat
    entry.pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, PING_INTERVAL_MS);
  };

  ws.onmessage = (event: MessageEvent<string>) => {
    let msg: WsMessage;
    try {
      msg = JSON.parse(event.data, bigintReviver) as WsMessage;
    } catch {
      return;
    }

    // Respond to server pings
    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      return;
    }

    entry.handlers.forEach((handler) => handler(msg));
  };

  ws.onclose = (event) => {
    if (entry.pingTimer) {
      clearInterval(entry.pingTimer);
      entry.pingTimer = null;
    }
    if (entry.intentionalClose) return;

    // Reconnect with exponential backoff
    const delay = Math.min(entry.backoff, BACKOFF_MAX_MS);
    entry.backoff = Math.min(entry.backoff * 2, BACKOFF_MAX_MS);

    entry.reconnectTimer = setTimeout(() => {
      if (connections.has(pairId) && !entry.intentionalClose) {
        connect(pairId, entry);
      }
    }, delay);
  };

  ws.onerror = () => {
    // onclose will handle reconnect
    ws.close();
  };
}

/**
 * Subscribe to WebSocket messages for a trading pair.
 * Returns an unsubscribe function — call it in useEffect cleanup.
 *
 * @param pairId  - server pairId format ("0xBASE/0xQUOTE")
 * @param handler - called for each incoming WS message
 */
export function subscribeToStream(
  pairId: string,
  handler: MessageHandler,
): () => void {
  let entry = connections.get(pairId);

  if (!entry) {
    // Create a placeholder entry; connect() will fill in .ws
    entry = {
      ws:               null as unknown as WebSocket,
      refCount:         0,
      handlers:         new Set(),
      pingTimer:        null,
      reconnectTimer:   null,
      backoff:          BACKOFF_BASE_MS,
      intentionalClose: false,
    };
    connections.set(pairId, entry);
    connect(pairId, entry);
  }

  entry.refCount++;
  entry.handlers.add(handler);

  return () => {
    if (!entry) return;
    entry.handlers.delete(handler);
    entry.refCount--;

    if (entry.refCount <= 0) {
      // Last subscriber — close the connection
      entry.intentionalClose = true;
      if (entry.pingTimer) {
        clearInterval(entry.pingTimer);
        entry.pingTimer = null;
      }
      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer);
        entry.reconnectTimer = null;
      }
      entry.ws?.close();
      connections.delete(pairId);
    }
  };
}

/**
 * React hook — subscribe to a WebSocket stream for a pair.
 *
 * @param pairId  - server pairId format ("0xBASE/0xQUOTE"), or empty string to skip
 * @param handler - stable callback (wrap in useCallback to avoid re-subscribing)
 */
export function useWsStream(pairId: string, handler: MessageHandler): void {
  // Keep a stable ref to handler to avoid subscription churn
  const handlerRef = useRef<MessageHandler>(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!pairId) return;

    const stableHandler: MessageHandler = (msg) => handlerRef.current(msg);
    const unsubscribe = subscribeToStream(pairId, stableHandler);
    return unsubscribe;
  }, [pairId]);
}
