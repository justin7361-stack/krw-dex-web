import { useEffect, useRef, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
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

const VOLUME_POSITIVE = 'rgba(37, 194, 110, 0.5)';
const VOLUME_NEGATIVE = 'rgba(241, 75, 75, 0.5)';

/**
 * CandleChart — lightweight-charts v5.
 * - Main pane: OHLC candlesticks
 * - Volume series overlaid at bottom of main pane (priceScaleId: 'volume')
 * - Imperative chart updates via useRef — avoids React re-renders on every tick.
 * - BigInt → number conversion ONLY happens here (required by the chart library).
 */
export function CandleChart({ pairId }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const chartRef       = useRef<IChartApi | null>(null);
  const seriesRef      = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  const resolution    = useTradingStore((s) => s.chartResolution);
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

    // Candlestick series (main pane)
    const series = chart.addSeries(CandlestickSeries, {
      upColor:         'var(--color-positive)',
      downColor:       'var(--color-negative)',
      borderUpColor:   'var(--color-positive)',
      borderDownColor: 'var(--color-negative)',
      wickUpColor:     'var(--color-positive)',
      wickDownColor:   'var(--color-negative)',
    });

    // Volume histogram series — same pane, bottom 20%
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color:       VOLUME_POSITIVE,
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top:    0.8,   // volume occupies bottom 20% of the chart height
        bottom: 0,
      },
    });

    chartRef.current        = chart;
    seriesRef.current       = series;
    volumeSeriesRef.current = volumeSeries;

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
      chartRef.current        = null;
      seriesRef.current       = null;
      volumeSeriesRef.current = null;
    };
  }, []); // create once

  // ─── Clear series when pairId or resolution changes ───────────────────────
  useEffect(() => {
    seriesRef.current?.setData([]);
    volumeSeriesRef.current?.setData([]);
  }, [pairId, resolution]);

  // ─── Load historical candles + volume ─────────────────────────────────────
  useEffect(() => {
    const series       = seriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!series || !volumeSeries || !candles) return;

    // ⚠️ toNumber() — ONLY place BigInt → number conversion is allowed
    const candleData: CandlestickData[] = candles.map((c: Candle) => ({
      time:  c.time as unknown as CandlestickData['time'],
      open:  toNumber(c.open),
      high:  toNumber(c.high),
      low:   toNumber(c.low),
      close: toNumber(c.close),
    }));

    const volumeData: HistogramData[] = candles.map((c: Candle) => ({
      time:  c.time as unknown as HistogramData['time'],
      value: toNumber(c.volume),
      color: c.close >= c.open ? VOLUME_POSITIVE : VOLUME_NEGATIVE,
    }));

    series.setData(candleData);
    volumeSeries.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  // ─── WS: live price update from trades ────────────────────────────────────
  const handleWs = useCallback((msg: WsMessage) => {
    if (msg.type !== 'trades.recent') return;
    const trades = msg.data as Trade[];
    const latest = trades[0];
    if (!latest) return;

    const series = seriesRef.current;
    if (!series) return;

    const price = toNumber(latest.price);
    const time  = Math.floor(latest.timestamp / 1000) as unknown as CandlestickData['time'];

    series.update({ time, open: price, high: price, low: price, close: price });

    // Update volume bar for the current tick (approximate — full bar comes from REST)
    volumeSeriesRef.current?.update({
      time,
      value: toNumber(latest.amount),
      color: latest.side === 'buy' ? VOLUME_POSITIVE : VOLUME_NEGATIVE,
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
