import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Orderbook } from '@/components/trading/Orderbook';
import { CandleChart } from '@/components/trading/CandleChart';
import { OrderForm } from '@/components/trading/OrderForm';
import { PositionPanel } from '@/components/trading/PositionPanel';
import { BottomTabs } from '@/components/trading/BottomTabs';
import { slugToPairId } from '@/lib/pair/pairId';
import { useTradingStore } from '@/store/tradingStore';

/**
 * Main trading page layout:
 *
 * ┌──────────────┬────────────────────────────┬──────────────────┐
 * │              │  CandleChart (60%)          │                  │
 * │  Orderbook   ├────────────────────────────┤  PositionPanel   │
 * │  280px       │  OrderForm                 │  320px           │
 * ├──────────────┴────────────────────────────┴──────────────────┤
 * │  BottomTabs: 미체결 | 체결 | 포지션                            │
 * └─────────────────────────────────────────────────────────────-┘
 */
export function TradingPage() {
  const { pair: pairSlug } = useParams<{ pair: string }>();
  const setSelectedPairId = useTradingStore((s) => s.setSelectedPairId);

  const pairId = pairSlug ? slugToPairId(pairSlug) : '';

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
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left — Orderbook */}
        <div className="w-[280px] shrink-0 border-r border-color-border overflow-hidden">
          <Orderbook pairId={pairId} />
        </div>

        {/* Center — Chart + OrderForm */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Chart takes 60% height */}
          <div className="flex-[3] min-h-0 border-b border-color-border">
            <CandleChart pairId={pairId} />
          </div>
          {/* Order form takes remaining */}
          <div className="flex-[2] min-h-0 overflow-y-auto">
            <OrderForm pairId={pairId} />
          </div>
        </div>

        {/* Right — Position Panel */}
        <div className="w-[320px] shrink-0 border-l border-color-border overflow-hidden">
          <PositionPanel pairId={pairId} />
        </div>
      </div>

      {/* Bottom — Trade history / open orders / positions */}
      <div className="h-[200px] shrink-0 border-t border-color-border">
        <BottomTabs pairId={pairId} />
      </div>
    </div>
  );
}
