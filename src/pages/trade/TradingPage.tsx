import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Orderbook }     from '@/components/trading/Orderbook';
import { CandleChart }   from '@/components/trading/CandleChart';
import { OrderForm }     from '@/components/trading/OrderForm';
import { PositionPanel } from '@/components/trading/PositionPanel';
import { BottomTabs }    from '@/components/trading/BottomTabs';
import { TickerBar }     from '@/components/trading/TickerBar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { slugToPairId }  from '@/lib/pair/pairId';
import { useTradingStore } from '@/store/tradingStore';
import { usePair }       from '@/hooks/api/usePairs';

// ─── Mobile panel types ────────────────────────────────────────────────────────
type MobilePanel = 'chart' | 'orderbook' | 'order' | 'info';

const MOBILE_TABS: { id: MobilePanel; label: string; icon: JSX.Element }[] = [
  {
    id: 'chart',
    label: '차트',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'orderbook',
    label: '호가창',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6"  x2="21" y2="6"  /><line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6"  x2="3.01" y2="6"  />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'order',
    label: '주문',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
    ),
  },
  {
    id: 'info',
    label: '정보',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

/**
 * Main trading page.
 *
 * Desktop (≥600px):  3-column fixed layout + BottomTabs
 * Mobile  (<600px):  TickerBar + 4-tab panel switcher (차트 | 호가창 | 주문 | 정보)
 */
export function TradingPage() {
  const { pair: pairSlug }  = useParams<{ pair: string }>();
  const setSelectedPairId   = useTradingStore((s) => s.setSelectedPairId);

  const pairId              = pairSlug ? slugToPairId(pairSlug) : '';
  const { data: pairInfo }  = usePair(pairId);

  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('chart');

  useEffect(() => {
    if (pairId) setSelectedPairId(pairId);
  }, [pairId, setSelectedPairId]);

  if (!pairId || pairId === 'loading/') {
    return (
      <div className="flex items-center justify-center h-full text-color-text-0 text-small">
        페어를 불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* TickerBar — always visible */}
      <TickerBar
        pairId={pairId}
        baseSymbol={pairInfo?.baseSymbol}
        quoteSymbol={pairInfo?.quoteSymbol}
      />

      {/* ── Mobile panel tabs ─────────────────────────────────────── */}
      <div className="flex border-b border-color-border bg-color-layer-1 shrink-0 notMobile:hidden">
        {MOBILE_TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setMobilePanel(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-tiny font-medium transition-colors border-b-2 ${
              mobilePanel === id
                ? 'text-color-accent border-color-accent'
                : 'text-color-text-0 border-transparent hover:text-color-text-1'
            }`}
          >
            {icon}
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Mobile: single active panel ───────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-0 notMobile:hidden overflow-hidden">
        {mobilePanel === 'chart' && (
          <ErrorBoundary label="Chart">
            <CandleChart pairId={pairId} />
          </ErrorBoundary>
        )}
        {mobilePanel === 'orderbook' && (
          <ErrorBoundary label="Orderbook">
            <Orderbook pairId={pairId} />
          </ErrorBoundary>
        )}
        {mobilePanel === 'order' && (
          <ErrorBoundary label="OrderForm">
            <OrderForm pairId={pairId} />
          </ErrorBoundary>
        )}
        {mobilePanel === 'info' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
            <ErrorBoundary label="PositionPanel">
              <PositionPanel pairId={pairId} />
            </ErrorBoundary>
            <div className="border-t border-color-border shrink-0" style={{ minHeight: 220 }}>
              <ErrorBoundary label="BottomTabs">
                <BottomTabs pairId={pairId} />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop: 3-column layout ──────────────────────────────── */}
      <div className="hidden notMobile:flex flex-1 min-h-0">

        {/* Left — Orderbook */}
        <div className="w-[280px] shrink-0 border-r border-color-border overflow-hidden">
          <ErrorBoundary label="Orderbook">
            <Orderbook pairId={pairId} />
          </ErrorBoundary>
        </div>

        {/* Center — Chart + OrderForm */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-[3] min-h-0 border-b border-color-border">
            <ErrorBoundary label="Chart">
              <CandleChart pairId={pairId} />
            </ErrorBoundary>
          </div>
          <div className="flex-[2] min-h-0 overflow-y-auto">
            <ErrorBoundary label="OrderForm">
              <OrderForm pairId={pairId} />
            </ErrorBoundary>
          </div>
        </div>

        {/* Right — Position Panel */}
        <div className="w-[320px] shrink-0 border-l border-color-border overflow-hidden">
          <ErrorBoundary label="PositionPanel">
            <PositionPanel pairId={pairId} />
          </ErrorBoundary>
        </div>
      </div>

      {/* ── Desktop: BottomTabs ───────────────────────────────────── */}
      <div className="h-[200px] shrink-0 border-t border-color-border hidden notMobile:block">
        <ErrorBoundary label="BottomTabs">
          <BottomTabs pairId={pairId} />
        </ErrorBoundary>
      </div>

    </div>
  );
}
