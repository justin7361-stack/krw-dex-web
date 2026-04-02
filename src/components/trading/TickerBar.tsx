import { useState, useEffect, useMemo } from 'react';

import { useCandles } from '@/hooks/api/useCandles';
import { useTrades } from '@/hooks/api/useTrades';
import { useFundingRate } from '@/hooks/api/useFundingRate';
import { formatKRW, formatPercent, formatAmount } from '@/lib/bigint/format';
import { WsStatusBadge } from '@/components/ui/WsStatusBadge';

interface Props {
  pairId:      string;
  baseSymbol?: string;
  quoteSymbol?: string;
}

// ─── Funding countdown hook ────────────────────────────────────────────────────
function useFundingCountdown(targetTs: number): string {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, targetTs - now);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Stat cell ────────────────────────────────────────────────────────────────
interface StatCellProps {
  label:    string;
  value:    string;
  valueClassName?: string;
  sub?:     string;
  subClassName?: string;
}

function StatCell({ label, value, valueClassName = 'text-color-text-2', sub, subClassName }: StatCellProps) {
  return (
    <div className="hidden notMobile:flex flex-col justify-center px-3 border-r border-color-border h-full shrink-0 min-w-[80px]">
      <span className="text-tiny text-color-text-0 leading-none mb-0.5">{label}</span>
      <span className={`text-mini tabular-nums font-medium leading-none ${valueClassName}`}>{value}</span>
      {sub && (
        <span className={`text-tiny tabular-nums leading-none mt-0.5 ${subClassName ?? 'text-color-text-0'}`}>{sub}</span>
      )}
    </div>
  );
}

// ─── TickerBar ────────────────────────────────────────────────────────────────

export function TickerBar({ pairId, baseSymbol, quoteSymbol }: Props) {
  const { data: candles } = useCandles(pairId, '1d');
  const { data: trades  } = useTrades(pairId);
  const { data: funding } = useFundingRate(pairId);

  const lastCandle = candles?.[candles.length - 1];
  const lastTrade  = trades?.[0];

  // Last price: prefer WS trade, fallback to mark price
  const lastPrice   = lastTrade?.price ?? funding?.markPrice ?? 0n;
  const lastSide    = lastTrade?.side ?? 'buy';

  // 24h change % (basis-point arithmetic, scale-agnostic)
  const change24hBps = useMemo(() => {
    if (!lastCandle || lastCandle.open === 0n) return null;
    return Number((lastCandle.close - lastCandle.open) * 10000n / lastCandle.open);
  }, [lastCandle]);

  const changePct      = change24hBps !== null ? change24hBps / 100 : null;
  const changePositive = (changePct ?? 0) >= 0;

  const countdown = useFundingCountdown(funding?.nextFundingAt ?? 0);

  const priceColor  = lastSide === 'buy' ? 'text-color-positive' : 'text-color-negative';
  const changeColor = changePositive ? 'text-color-positive' : 'text-color-negative';

  const symbol = baseSymbol && quoteSymbol
    ? `${baseSymbol}/${quoteSymbol}`
    : pairId.split('/').map((a) => a.slice(0, 6)).join('/');

  return (
    <div className="flex items-stretch shrink-0 h-10 border-b border-color-border bg-color-layer-1 overflow-x-auto">

      {/* Symbol pill */}
      <div className="flex items-center gap-1.5 px-3 border-r border-color-border shrink-0">
        <span className="text-small font-bold text-color-text-2 whitespace-nowrap">{symbol}</span>
      </div>

      {/* Last price (large) + 24h change */}
      <div className="flex flex-col justify-center px-3 border-r border-color-border shrink-0">
        <span className={`text-medium font-bold tabular-nums leading-none ${priceColor}`}>
          {formatKRW(lastPrice, 0)}
        </span>
        {changePct !== null && (
          <span className={`text-tiny tabular-nums leading-none mt-0.5 ${changeColor}`}>
            {changePositive ? '+' : ''}{changePct.toFixed(2)}%
          </span>
        )}
      </div>

      {/* 24h high */}
      <StatCell
        label="24H 고가"
        value={lastCandle ? formatKRW(lastCandle.high, 0) : '—'}
        valueClassName="text-color-positive"
      />

      {/* 24h low */}
      <StatCell
        label="24H 저가"
        value={lastCandle ? formatKRW(lastCandle.low, 0) : '—'}
        valueClassName="text-color-negative"
      />

      {/* 24h volume */}
      <StatCell
        label="24H 거래량"
        value={lastCandle ? formatAmount(lastCandle.volume, 2) : '—'}
      />

      {/* Mark price */}
      {funding && (
        <StatCell
          label="마크 가격"
          value={formatKRW(funding.markPrice, 0)}
        />
      )}

      {/* Index price */}
      {funding && (
        <StatCell
          label="인덱스 가격"
          value={formatKRW(funding.indexPrice, 0)}
        />
      )}

      {/* Funding rate + countdown */}
      {funding && (
        <StatCell
          label={`펀딩 ${countdown}`}
          value={formatPercent(funding.rate)}
          valueClassName={funding.rate >= 0n ? 'text-color-positive' : 'text-color-negative'}
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* WS status — far right, desktop only */}
      <div className="hidden notMobile:flex items-center px-3 shrink-0 border-l border-color-border">
        <WsStatusBadge pairId={pairId} />
      </div>
    </div>
  );
}
