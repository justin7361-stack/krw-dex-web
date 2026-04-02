import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { useTradingStore } from '@/store/tradingStore';
import { useAuthStore } from '@/store/authStore';
import { usePair } from '@/hooks/api/usePairs';
import { useFundingRate } from '@/hooks/api/useFundingRate';
import { usePositions } from '@/hooks/api/usePositions';
import { useNextNonce } from '@/hooks/chain/useNonce';
import { useSubmitOrder } from '@/hooks/mutations/useSubmitOrder';
import { buildLimitOrder, buildMarketOrder } from '@/lib/eip712/buildOrder';
import { parseScaled, roundDown, formatKRW, formatAmount } from '@/lib/bigint/format';
import { ApiKeyModal } from '@/components/modals/ApiKeyModal';
import type { Address } from 'viem';

interface Props {
  pairId: string;
}

const PCT_STEPS = [25, 50, 75, 100] as const;

/**
 * OrderForm — reads state from tradingStore (no props for order fields).
 * Enhancements:
 *  - 25 / 50 / 75 / MAX percentage buttons (based on freeMargin / price)
 *  - Estimated order cost display
 *  - Leverage numeric input alongside slider
 */
export function OrderForm({ pairId }: Props) {
  const { address, isConnected } = useAccount();
  const apiKey = useAuthStore((s) => s.apiKey);

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  const form          = useTradingStore((s) => s.form);
  const setFormField  = useTradingStore((s) => s.setFormField);
  const resetForm     = useTradingStore((s) => s.resetForm);

  const { data: pair }    = usePair(pairId);
  const { data: funding } = useFundingRate(pairId);
  const { data: posData } = usePositions(isConnected ? (address ?? '') : '');
  const { nextNonce }     = useNextNonce(isConnected ? address : undefined);
  const submitOrder       = useSubmitOrder();

  const [baseToken, quoteToken] = pairId.split('/');

  // ─── Derived: estimated cost ───────────────────────────────────────────────
  const estimatedCost = useMemo(() => {
    const amount = form.amountInput ? parseScaled(form.amountInput) : 0n;
    if (amount === 0n) return null;

    let priceScaled: bigint;
    if (form.orderType === 'market') {
      priceScaled = funding?.markPrice ?? 0n;
    } else {
      priceScaled = form.priceInput ? parseScaled(form.priceInput) : 0n;
    }
    if (priceScaled === 0n) return null;

    // cost (KRW, scaled) = price * amount / 1e18
    const SCALE = 10n ** 18n;
    return (priceScaled * amount) / SCALE;
  }, [form.amountInput, form.priceInput, form.orderType, funding?.markPrice]);

  // ─── Percentage buttons ────────────────────────────────────────────────────
  const handlePctClick = (pct: number) => {
    const freeMargin = posData?.freeMargin ?? 0n;
    if (freeMargin === 0n) return;

    // Determine effective price
    let priceScaled: bigint;
    if (form.orderType === 'market') {
      priceScaled = funding?.markPrice ?? 0n;
    } else {
      priceScaled = form.priceInput ? parseScaled(form.priceInput) : 0n;
    }
    if (priceScaled === 0n) return;

    const leverageBn = BigInt(form.leverage);
    const SCALE      = 10n ** 18n;

    // amount (base) = freeMargin * pct/100 * leverage / price
    // All terms are 1e18-scaled except pct/leverage (dimensionless)
    const amountRaw = (freeMargin * BigInt(pct) * leverageBn * SCALE) / (100n * priceScaled * SCALE);
    // Actually: freeMargin (1e18 KRW/unit) * pct/100 * leverage / price (1e18 KRW/base)
    //         = freeMargin * pct * leverage / (100 * price)  ← 1e18 cancels
    const amountScaled = (freeMargin * BigInt(pct) * leverageBn) / (100n * priceScaled);

    // Round to lot size
    const rounded = pair ? roundDown(amountScaled, pair.lotSize) : amountScaled;

    // Format as human-readable decimal string (6 decimal places)
    const amountStr = formatAmount(rounded, 6);
    setFormField('amountInput', amountStr);
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!address || !pair || nextNonce === undefined) return;
    if (!apiKey) {
      setApiKeyModalOpen(true);
      return;
    }

    let priceRaw: bigint;
    let amountRaw: bigint;

    try {
      priceRaw  = form.priceInput  ? parseScaled(form.priceInput)  : 0n;
      amountRaw = form.amountInput ? parseScaled(form.amountInput) : 0n;
    } catch {
      alert('입력값을 확인해주세요.');
      return;
    }

    const price  = roundDown(priceRaw, pair.tickSize);
    const amount = roundDown(amountRaw, pair.lotSize);

    if (amount === 0n) {
      alert('수량을 입력하세요.');
      return;
    }

    const isBuy = form.side === 'buy';

    const orderMsg = form.orderType === 'market'
      ? buildMarketOrder({
          maker:      address as Address,
          baseToken:  baseToken as Address,
          quoteToken: quoteToken as Address,
          amount,
          isBuy,
          nonce: nextNonce,
        })
      : buildLimitOrder({
          maker:      address as Address,
          baseToken:  baseToken as Address,
          quoteToken: quoteToken as Address,
          price,
          amount,
          isBuy,
          nonce: nextNonce,
        });

    try {
      await submitOrder.mutateAsync({
        order:       orderMsg,
        leverage:    BigInt(form.leverage),
        marginMode:  form.marginMode,
        timeInForce: form.timeInForce,
      });
      resetForm();
    } catch (err) {
      console.error('주문 실패:', err);
      alert('주문 제출에 실패했습니다. 콘솔을 확인하세요.');
    }
  };

  // ─── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-small text-color-text-1">지갑을 연결하여 거래하세요</p>
        <ConnectButton />
      </div>
    );
  }

  const isBuyForm = form.side === 'buy';
  const accentBg  = isBuyForm ? 'bg-color-positive' : 'bg-color-negative';

  return (
    <>
      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />

      <div className="flex flex-col h-full p-4 gap-3 overflow-y-auto">

        {/* API Key warning */}
        {!apiKey && (
          <button
            onClick={() => setApiKeyModalOpen(true)}
            className="w-full py-1.5 rounded-lg border border-color-warning bg-color-warning/10 text-tiny text-color-warning hover:bg-color-warning/20 transition-colors"
          >
            ⚠ API 키 등록 필요 — 클릭하여 등록
          </button>
        )}

        {/* Buy / Sell tabs */}
        <div className="flex rounded-lg bg-color-layer-3 p-0.5">
          <button
            onClick={() => setFormField('side', 'buy')}
            className={`flex-1 py-2 rounded-md text-small font-semibold transition-colors ${
              isBuyForm
                ? 'bg-color-positive text-white shadow'
                : 'text-color-text-0 hover:text-color-text-1'
            }`}
          >
            매수
          </button>
          <button
            onClick={() => setFormField('side', 'sell')}
            className={`flex-1 py-2 rounded-md text-small font-semibold transition-colors ${
              !isBuyForm
                ? 'bg-color-negative text-white shadow'
                : 'text-color-text-0 hover:text-color-text-1'
            }`}
          >
            매도
          </button>
        </div>

        {/* Order type tabs */}
        <div className="flex gap-2 text-tiny">
          {(['limit', 'market'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFormField('orderType', t)}
              className={`px-3 py-1 rounded transition-colors ${
                form.orderType === t
                  ? 'bg-color-layer-4 text-color-text-2 font-medium'
                  : 'text-color-text-0 hover:text-color-text-1'
              }`}
            >
              {t === 'limit' ? '지정가' : '시장가'}
            </button>
          ))}
        </div>

        {/* Price input (limit only) */}
        {form.orderType === 'limit' && (
          <div className="flex flex-col gap-1">
            <label className="text-tiny text-color-text-0">가격 (KRW)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={form.priceInput}
              onChange={(e) => setFormField('priceInput', e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-color-layer-3 text-small text-color-text-2 tabular-nums placeholder:text-color-text-0 focus:outline-none focus:ring-1 focus:ring-color-accent"
            />
          </div>
        )}

        {/* Market price display */}
        {form.orderType === 'market' && funding && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-color-layer-3 text-tiny">
            <span className="text-color-text-0">마크 가격</span>
            <span className="tabular-nums text-color-text-1">{formatKRW(funding.markPrice, 0)}</span>
          </div>
        )}

        {/* Amount input */}
        <div className="flex flex-col gap-1">
          <label className="text-tiny text-color-text-0">수량</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0"
            value={form.amountInput}
            onChange={(e) => setFormField('amountInput', e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-color-layer-3 text-small text-color-text-2 tabular-nums placeholder:text-color-text-0 focus:outline-none focus:ring-1 focus:ring-color-accent"
          />
        </div>

        {/* Percentage buttons */}
        <div className="flex gap-1">
          {PCT_STEPS.map((pct) => (
            <button
              key={pct}
              onClick={() => handlePctClick(pct)}
              className="flex-1 py-1 rounded text-tiny font-medium bg-color-layer-3 text-color-text-0 hover:bg-color-layer-4 hover:text-color-text-1 transition-colors"
            >
              {pct === 100 ? 'MAX' : `${pct}%`}
            </button>
          ))}
        </div>

        {/* Estimated cost */}
        {estimatedCost !== null && (
          <div className="flex items-center justify-between text-tiny px-1">
            <span className="text-color-text-0">예상 주문금액</span>
            <span className="tabular-nums text-color-text-1">{formatKRW(estimatedCost, 0)}</span>
          </div>
        )}

        {/* Available margin */}
        {posData && (
          <div className="flex items-center justify-between text-tiny px-1">
            <span className="text-color-text-0">가용 증거금</span>
            <span className="tabular-nums text-color-positive">{formatKRW(posData.freeMargin, 0)}</span>
          </div>
        )}

        {/* Leverage row: slider + numeric input */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center text-tiny">
            <span className="text-color-text-0">레버리지</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={20}
                value={form.leverage}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(20, Number(e.target.value)));
                  setFormField('leverage', isNaN(v) ? 1 : v);
                }}
                className="w-10 px-1 py-0.5 text-tiny tabular-nums text-right rounded bg-color-layer-3 text-color-text-2 focus:outline-none focus:ring-1 focus:ring-color-accent"
              />
              <span className="text-color-text-1 font-medium">x</span>
            </div>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={form.leverage}
            onChange={(e) => setFormField('leverage', Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
          <div className="flex justify-between text-tiny text-color-text-0">
            <span>1x</span>
            <span>5x</span>
            <span>10x</span>
            <span>20x</span>
          </div>
        </div>

        {/* Margin mode */}
        <div className="flex items-center gap-2 text-tiny">
          <span className="text-color-text-0">마진 모드:</span>
          {(['cross', 'isolated'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFormField('marginMode', m)}
              className={`px-2 py-0.5 rounded transition-colors ${
                form.marginMode === m
                  ? 'bg-color-accent text-white'
                  : 'text-color-text-0 hover:text-color-text-1 bg-color-layer-3'
              }`}
            >
              {m === 'cross' ? '크로스' : '아이솔레이티드'}
            </button>
          ))}
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={submitOrder.isPending || nextNonce === undefined}
          className={`w-full py-3 rounded-lg text-small font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99] ${accentBg}`}
        >
          {submitOrder.isPending
            ? '서명 중...'
            : isBuyForm ? '매수 주문' : '매도 주문'}
        </button>

        {/* Nonce warning */}
        {nextNonce === undefined && (
          <p className="text-tiny text-color-warning text-center">
            사용 가능한 Nonce 로딩 중...
          </p>
        )}
      </div>
    </>
  );
}
