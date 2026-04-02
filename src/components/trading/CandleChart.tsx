import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';

import { useCandles } from '@/hooks/api/useCandles';
import { useWsStream } from '@/hooks/ws/useWebSocket';
import { toNumber } from '@/lib/bigint/format';
import { useTradingStore } from '@/store/tradingStore';
import type { CandleResolution, Candle, WsMessage, Trade } from '@/types/api';

interface Props {
  pairId: string;
}

const RESOLUTIONS: CandleResolution[] = ['1m', '5m', '15m', '1h', '4h', '1d'];
const RESOLUTION_LABELS: Record<CandleResolution, string> = {
  '1m': '1분', '5m': '5분', '15m': '15분',
  '1h': '1시간', '4h': '4시간', '1d': '일',
};

/**
 * CandleChart — lightweight-charts v5.
 * Imperative chart updates via useRef — avoids React re-renders on every tick.
 * BigInt → number conversion ONLY happens here (required by the chart library).
 */
export function CandleChart({ pairId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);

  const resolution = useTradingStore((s) => s.chartResolution);
  const setResolution = useTradingStore((s) => s.setChartResolution);

  const { data: candles } = useCandles(pairId, resolution);

  // ─── Create chart on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background:  { type: ColorType.Solid, color: 'var(--color-layer-2)' },
        textColor:   'rgba(255,255,255,0.45)',
      },
      grid: {
        vertLines:   { color: 'rgba(255,255,255,0.04)' },
        horzLines:   { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      timeScale: {
        borderColor:    'rgba(255,255,255,0.1)',
        timeVisible:    true,
        secondsVisible: false,
      },
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    // lightweight-charts v5: use addSeries(CandlestickSeries, options)
    const series = chart.addSeries(CandlestickSeries, {
      upColor:         'var(--color-positive)',
      downColor:       'var(--color-negative)',
      borderUpColor:   'var(--color-positive)',
      borderDownColor: 'var(--color-negative)',
      wickUpColor:     'var(--color-positive)',
      wickDownColor:   'var(--color-negative)',
    });

    chartRef.current  = chart;
    seriesRef.current = series;

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current  = null;
      seriesRef.current = null;
    };
  }, []); // create once

  // ─── Re-create series when pairId or resolution changes ───────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    series.setData([]);
  }, [pairId, resolution]);

  // ─── Load historical candles ───────────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || !candles) return;

    // ⚠️ toNumber() — ONLY place BigInt → number conversion is allowed
    const data: CandlestickData[] = candles.map((c: Candle) => ({
      time:  c.time as unknown as CandlestickData['time'],
      open:  toNumber(c.open),
      high:  toNumber(c.high),
      low:   toNumber(c.low),
      close: toNumber(c.close),
    }));

    series.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // ─── WS: append new candle from trade ─────────────────────────────────────
  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type !== 'trades.recent') return;
    const trades = msg.data as Trade[];
    const latest = trades[0];
    if (!latest) return;

    const series = seriesRef.current;
    if (!series) return;

    const price = toNumber(latest.price);
    // Approximate the current candle update — real OHLC comes from REST candles
    // This provides a "last price" visual tick on the chart
    series.update({
      time:  Math.floor(latest.timestamp / 1000) as unknown as CandlestickData['time'],
      open:  price,
      high:  price,
      low:   price,
      close: price,
    });
  }, []);

  useWsStream(pairId, handleWs);

  return (
    <div className="flex flex-col h-full bg-color-layer-2">
      {/* Resolution selector */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-color-border">
        {RESOLUTIONS.map((r) => (
          <button
            key={r}
            onClick={() => setResolution(r)}
            className={`px-2 py-1 rounded text-tiny font-medium transition-colors ${
              r === resolution
                ? 'bg-color-accent text-white'
                : 'text-color-text-0 hover:text-color-text-1 hover:bg-color-layer-3'
            }`}
          >
            {RESOLUTION_LABELS[r]}
          </button>
        ))}
      </div>

      {/* Chart container — imperative, not managed by React */}
      <div ref={containerRef} className="flex-1 min-h-0" />
    </div>
  );
}
