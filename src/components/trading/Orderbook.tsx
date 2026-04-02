import { memo, useMemo, useEffect, useRef, useState } from 'react';
import { useOrderbook } from '@/hooks/api/useOrderbook';
import { formatKRW, formatAmount } from '@/lib/bigint/format';
import type { PriceLevel } from '@/types/api';

interface Props {
  pairId: string;
}

const MAX_ROWS = 15;

/**
 * Orderbook component.
 * - Wrapped in React.memo to prevent re-render from parent state changes.
 * - Subscribes to WS internally via useOrderbook (not from parent).
 * - Flash animations on price-level total changes.
 * - Imbalance bar (bid% vs ask%) in header.
 */
export const Orderbook = memo(function Orderbook({ pairId }: Props) {
  const { data, isLoading } = useOrderbook(pairId);

  const asks = useMemo(() => {
    const levels = data?.asks ?? [];
    return levels.slice(0, MAX_ROWS).reverse(); // ascending → best ask at bottom (nearest spread)
  }, [data?.asks]);

  const bids = useMemo(() => {
    return (data?.bids ?? []).slice(0, MAX_ROWS);
  }, [data?.bids]);

  const bestAsk = asks[asks.length - 1];
  const bestBid = bids[0];
  const spread  = bestAsk && bestBid ? bestAsk.price - bestBid.price : null;

  // Max totals for depth bars
  const maxAskTotal = useMemo(
    () => asks.reduce((m, l) => (l.total > m ? l.total : m), 0n),
    [asks],
  );
  const maxBidTotal = useMemo(
    () => bids.reduce((m, l) => (l.total > m ? l.total : m), 0n),
    [bids],
  );

  // Total bid/ask volume for imbalance bar
  const totalBidAmt = useMemo(
    () => bids.reduce((s, l) => s + l.amount, 0n),
    [bids],
  );
  const totalAskAmt = useMemo(
    () => asks.reduce((s, l) => s + l.amount, 0n),
    [asks],
  );
  const totalAll = totalBidAmt + totalAskAmt;
  const bidPct   = totalAll > 0n ? Number((totalBidAmt * 100n) / totalAll) : 50;
  const askPct   = 100 - bidPct;

  if (isLoading) {
    return <OrderbookSkeleton />;
  }

  return (
    <div className="flex flex-col h-full font-monospace">

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-color-border">
        <span className="text-tiny font-medium text-color-text-1">오더북</span>
        {/* Total volume display */}
        <div className="flex items-center gap-2 text-tiny tabular-nums">
          <span className="text-color-positive">{formatAmount(totalBidAmt, 2)}</span>
          <span className="text-color-text-0">/</span>
          <span className="text-color-negative">{formatAmount(totalAskAmt, 2)}</span>
        </div>
      </div>

      {/* Imbalance bar */}
      <div className="flex h-1.5 shrink-0">
        <div
          className="bg-color-positive transition-all duration-300"
          style={{ width: `${bidPct}%` }}
        />
        <div
          className="bg-color-negative transition-all duration-300"
          style={{ width: `${askPct}%` }}
        />
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-tiny text-color-text-0">
        <span>가격 (KRW)</span>
        <span className="text-right">수량</span>
        <span className="text-right">누계</span>
      </div>

      {/* Asks (sell side) — displayed bottom-to-top, best ask nearest spread */}
      <div className="flex flex-col-reverse flex-1 overflow-hidden">
        {asks.map((level) => (
          <OrderbookRow
            key={level.price.toString()}
            level={level}
            side="ask"
            maxTotal={maxAskTotal}
          />
        ))}
      </div>

      {/* Spread + imbalance ratio */}
      <div className="flex items-center justify-between px-3 py-1.5 border-y border-color-border bg-color-layer-1">
        {spread !== null ? (
          <>
            <span className="text-tiny text-color-text-0">스프레드</span>
            <span className="text-tiny tabular-nums text-color-text-1">
              {formatKRW(spread, 0)}
            </span>
            <span className="text-tiny text-color-text-0 tabular-nums">
              <span className="text-color-positive">{bidPct}%</span>
              {' / '}
              <span className="text-color-negative">{askPct}%</span>
            </span>
          </>
        ) : (
          <span className="text-tiny text-color-text-0 mx-auto">—</span>
        )}
      </div>

      {/* Bids (buy side) */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {bids.map((level) => (
          <OrderbookRow
            key={level.price.toString()}
            level={level}
            side="bid"
            maxTotal={maxBidTotal}
          />
        ))}
      </div>
    </div>
  );
});

// ─── Row ──────────────────────────────────────────────────────────────────────

interface RowProps {
  level:    PriceLevel;
  side:     'bid' | 'ask';
  maxTotal: bigint;
}

/**
 * OrderbookRow — individual price level.
 * Uses key-by-price (from parent) so each price keeps its own ref across renders.
 * Flash animation triggers whenever the cumulative total changes at this price.
 */
function OrderbookRow({ level, side, maxTotal }: RowProps) {
  const prevTotalRef = useRef<bigint | null>(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevTotalRef.current !== null && prevTotalRef.current !== level.total) {
      // Trigger flash
      setFlash(false); // reset first so animation can re-trigger
      requestAnimationFrame(() => setFlash(true));
      const timer = setTimeout(() => setFlash(false), 600);
      prevTotalRef.current = level.total;
      return () => clearTimeout(timer);
    }
    prevTotalRef.current = level.total;
  }, [level.total]);

  const depthPct = maxTotal > 0n
    ? Number((level.total * 10000n) / maxTotal) / 100
    : 0;

  const bgColor = side === 'bid'
    ? 'var(--color-positive-faded)'
    : 'var(--color-negative-faded)';

  const priceColor    = side === 'bid' ? 'text-color-positive' : 'text-color-negative';
  const flashClass    = flash
    ? (side === 'bid' ? 'animate-flash-bid' : 'animate-flash-ask')
    : '';

  return (
    <div
      className={`relative grid grid-cols-3 px-3 py-[2px] hover:bg-color-layer-3 cursor-pointer transition-colors ${flashClass}`}
      style={{
        background: `linear-gradient(to left, ${bgColor} ${depthPct}%, transparent ${depthPct}%)`,
      }}
    >
      <span className={`text-tiny tabular-nums font-medium ${priceColor}`}>
        {formatKRW(level.price, 0)}
      </span>
      <span className="text-tiny tabular-nums text-right text-color-text-1">
        {formatAmount(level.amount, 4)}
      </span>
      <span className="text-tiny tabular-nums text-right text-color-text-0">
        {formatAmount(level.total, 4)}
      </span>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OrderbookSkeleton() {
  return (
    <div className="flex flex-col h-full px-3 gap-1 pt-10">
      {Array.from({ length: 30 }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-color-layer-3 animate-pulse" />
      ))}
    </div>
  );
}
