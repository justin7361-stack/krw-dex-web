import { memo, useMemo } from 'react';
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
 */
export const Orderbook = memo(function Orderbook({ pairId }: Props) {
  const { data, isLoading } = useOrderbook(pairId);

  const asks = useMemo(() => {
    const levels = data?.asks ?? [];
    return levels.slice(0, MAX_ROWS).reverse(); // ascending for display (best ask at bottom)
  }, [data?.asks]);

  const bids = useMemo(() => {
    return (data?.bids ?? []).slice(0, MAX_ROWS);
  }, [data?.bids]);

  const bestAsk = asks[asks.length - 1];
  const bestBid = bids[0];
  const spread  = bestAsk && bestBid ? bestAsk.price - bestBid.price : null;

  // Find max total for depth bar width
  const maxAskTotal = asks.reduce((m, l) => (l.total > m ? l.total : m), 0n);
  const maxBidTotal = bids.reduce((m, l) => (l.total > m ? l.total : m), 0n);

  if (isLoading) {
    return <OrderbookSkeleton />;
  }

  return (
    <div className="flex flex-col h-full font-monospace">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-color-border">
        <span className="text-tiny font-medium text-color-text-1">오더북</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-3 px-3 py-1 text-tiny text-color-text-0">
        <span>가격 (KRW)</span>
        <span className="text-right">수량</span>
        <span className="text-right">누계</span>
      </div>

      {/* Asks (sell side) — displayed in reverse, best ask nearest spread */}
      <div className="flex flex-col-reverse flex-1 overflow-hidden">
        {asks.map((level, i) => (
          <OrderbookRow
            key={i}
            level={level}
            side="ask"
            maxTotal={maxAskTotal}
          />
        ))}
      </div>

      {/* Spread */}
      <div className="flex items-center justify-center gap-2 py-1.5 border-y border-color-border bg-color-layer-1">
        {spread !== null ? (
          <>
            <span className="text-tiny text-color-text-0">스프레드</span>
            <span className="text-tiny tabular-nums text-color-text-1">
              {formatKRW(spread, 0)}
            </span>
          </>
        ) : (
          <span className="text-tiny text-color-text-0">—</span>
        )}
      </div>

      {/* Bids (buy side) */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {bids.map((level, i) => (
          <OrderbookRow
            key={i}
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

function OrderbookRow({ level, side, maxTotal }: RowProps) {
  const depthPct = maxTotal > 0n
    ? Number((level.total * 10000n) / maxTotal) / 100
    : 0;

  const bgColor = side === 'bid'
    ? 'var(--color-positive-faded)'
    : 'var(--color-negative-faded)';

  const priceColor = side === 'bid' ? 'text-color-positive' : 'text-color-negative';

  return (
    <div
      className="relative grid grid-cols-3 px-3 py-[2px] hover:bg-color-layer-3 cursor-pointer transition-colors"
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
