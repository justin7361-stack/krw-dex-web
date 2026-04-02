import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { CandleChart } from '@/components/trading/CandleChart';
import { TickerBar } from '@/components/trading/TickerBar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { usePairs } from '@/hooks/api/usePairs';
import { useTrades } from '@/hooks/api/useTrades';
import { useCandles } from '@/hooks/api/useCandles';
import { useTradingStore } from '@/store/tradingStore';
import { formatKRW, formatAmount, toNumber } from '@/lib/bigint/format';
import { pairIdToSlug } from '@/lib/pair/pairId';
import type { Pair, Candle } from '@/types/api';

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ candles, positive }: { candles: Candle[]; positive: boolean }) {
  const closes = useMemo(
    () => candles.slice(-20).map((c) => toNumber(c.close)),
    [candles],
  );
  if (closes.length < 2) return <div className="w-20 h-8" />;

  const min   = Math.min(...closes);
  const max   = Math.max(...closes);
  const range = max - min || 1;
  const W = 80, H = 32;

  const points = closes
    .map((v, i) => {
      const x = (i / (closes.length - 1)) * W;
      const y = H - ((v - min) / range) * (H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' L ');

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <path
        d={`M ${points}`}
        fill="none"
        stroke={positive ? 'var(--color-positive)' : 'var(--color-negative)'}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── MarketPairRow ─────────────────────────────────────────────────────────────

interface RowProps {
  pair:       Pair;
  selected:   boolean;
  onSelect:   (pairId: string) => void;
  onNavigate: (pairId: string) => void;
}

function MarketPairRow({ pair, selected, onSelect, onNavigate }: RowProps) {
  const { data: trades  } = useTrades(pair.pairId);
  const { data: candles } = useCandles(pair.pairId, '1d');

  const lastPrice   = trades?.[0]?.price ?? 0n;
  const lastCandle  = candles?.[candles.length - 1];

  // 24h change %
  const changeBps = useMemo(() => {
    if (!lastCandle || lastCandle.open === 0n) return null;
    return Number((lastCandle.close - lastCandle.open) * 10000n / lastCandle.open);
  }, [lastCandle]);

  const changePct  = changeBps !== null ? changeBps / 100 : null;
  const isPositive = (changePct ?? 0) >= 0;

  function handleClick() {
    // On mobile (≤600px): navigate directly to trade page
    // On desktop: select the pair to show in the right panel
    if (window.innerWidth < 600) {
      onNavigate(pair.pairId);
    } else {
      onSelect(pair.pairId);
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-color-border transition-colors text-left ${
        selected
          ? 'bg-color-layer-3 border-l-2 border-l-color-accent'
          : 'hover:bg-color-layer-2 border-l-2 border-l-transparent'
      }`}
    >
      {/* Pair name */}
      <div className="flex flex-col min-w-0 w-[90px]">
        <span className="text-small font-semibold text-color-text-2 truncate">
          {pair.baseSymbol}
        </span>
        <span className="text-tiny text-color-text-0 truncate">
          /{pair.quoteSymbol}
        </span>
      </div>

      {/* Sparkline */}
      <div className="flex-shrink-0">
        {candles && candles.length >= 2
          ? <Sparkline candles={candles} positive={isPositive} />
          : <div className="w-20 h-8 bg-color-layer-4 rounded animate-pulse" />
        }
      </div>

      {/* Price + change */}
      <div className="flex flex-col items-end ml-auto min-w-[100px]">
        <span className="text-small font-medium tabular-nums text-color-text-2">
          {lastPrice > 0n ? formatKRW(lastPrice, 0) : '—'}
        </span>
        {changePct !== null ? (
          <span className={`text-tiny tabular-nums font-medium ${isPositive ? 'text-color-positive' : 'text-color-negative'}`}>
            {isPositive ? '+' : ''}{changePct.toFixed(2)}%
          </span>
        ) : (
          <span className="text-tiny text-color-text-0">—</span>
        )}
      </div>
    </button>
  );
}

// ─── MarketPage ───────────────────────────────────────────────────────────────

export function MarketPage() {
  const navigate  = useNavigate();
  const { data: pairs } = usePairs();
  const setSelectedPairId = useTradingStore((s) => s.setSelectedPairId);

  const [selectedPairId, setLocal] = useState<string>('');
  const [search, setSearch]        = useState('');

  const activePairs = useMemo(
    () => (pairs ?? []).filter((p) => p.active),
    [pairs],
  );

  // Auto-select first pair
  useEffect(() => {
    if (!selectedPairId && activePairs.length > 0) {
      setLocal(activePairs[0]!.pairId);
    }
  }, [activePairs, selectedPairId]);

  const filteredPairs = useMemo(() => {
    if (!search.trim()) return activePairs;
    const q = search.toLowerCase();
    return activePairs.filter(
      (p) =>
        p.baseSymbol.toLowerCase().includes(q) ||
        p.quoteSymbol.toLowerCase().includes(q),
    );
  }, [activePairs, search]);

  const selectedPair = activePairs.find((p) => p.pairId === selectedPairId);

  function handleSelect(pairId: string) {
    setLocal(pairId);
    setSelectedPairId(pairId);
  }

  const handleNavigate = useCallback((pairId: string) => {
    setSelectedPairId(pairId);
    navigate(`/trade/${pairIdToSlug(pairId)}`);
  }, [navigate, setSelectedPairId]);

  function goTrade() {
    if (!selectedPairId) return;
    navigate(`/trade/${pairIdToSlug(selectedPairId)}`);
  }

  return (
    <div className="flex h-full">

      {/* ── Left: pair list (full-width on mobile) ────────────────── */}
      <div className="w-full notMobile:w-[280px] flex-shrink-0 notMobile:border-r border-color-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-color-border">
          <span className="text-small font-semibold text-color-text-1">마켓</span>
          <span className="text-tiny text-color-text-0">{activePairs.length}개 페어</span>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-color-border">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-color-layer-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="var(--color-text-0)" strokeWidth={2} strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              placeholder="페어 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-tiny text-color-text-2 placeholder:text-color-text-0 outline-none"
            />
          </div>
        </div>

        {/* Column labels */}
        <div className="flex items-center px-4 py-1.5 text-tiny text-color-text-0 border-b border-color-border">
          <span className="w-[90px]">페어</span>
          <span className="w-20">차트</span>
          <span className="ml-auto">가격 / 등락</span>
        </div>

        {/* Pair rows */}
        <div className="flex-1 overflow-y-auto">
          {filteredPairs.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-tiny text-color-text-0">
              검색 결과 없음
            </div>
          ) : (
            filteredPairs.map((pair) => (
              <MarketPairRow
                key={pair.pairId}
                pair={pair}
                selected={pair.pairId === selectedPairId}
                onSelect={handleSelect}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right: chart panel (desktop only) ───────────────────── */}
      <div className="hidden notMobile:flex flex-1 flex-col min-w-0 overflow-hidden">
        {selectedPairId ? (
          <>
            {/* Ticker bar */}
            <TickerBar
              pairId={selectedPairId}
              baseSymbol={selectedPair?.baseSymbol}
              quoteSymbol={selectedPair?.quoteSymbol}
            />

            {/* Full candlestick chart */}
            <div className="flex-1 min-h-0">
              <ErrorBoundary label="MarketChart">
                <CandleChart pairId={selectedPairId} />
              </ErrorBoundary>
            </div>

            {/* Trade CTA bar */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-color-border bg-color-layer-1">
              <div className="flex flex-col">
                <span className="text-small font-semibold text-color-text-2">
                  {selectedPair?.baseSymbol}/{selectedPair?.quoteSymbol}
                </span>
                <span className="text-tiny text-color-text-0">
                  Tick {selectedPair ? formatKRW(selectedPair.tickSize, 0) : '—'}
                  &nbsp;·&nbsp;
                  Lot {selectedPair ? formatAmount(selectedPair.lotSize, 4) : '—'}
                </span>
              </div>
              <button
                onClick={goTrade}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-color-accent text-white text-small font-semibold hover:brightness-110 transition-all active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="17 1 21 5 17 9" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <polyline points="7 23 3 19 7 15" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                거래하기
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-color-text-0 text-small">
            마켓을 선택하세요
          </div>
        )}
      </div>
    </div>
  );
}
