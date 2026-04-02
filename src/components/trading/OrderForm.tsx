import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { useTradingStore } from '@/store/tradingStore';
import { useAuthStore } from '@/store/authStore';
import { usePair } from '@/hooks/api/usePairs';
import { useNextNonce } from '@/hooks/chain/useNonce';
import { useSubmitOrder } from '@/hooks/mutations/useSubmitOrder';
import { buildLimitOrder, buildMarketOrder } from '@/lib/eip712/buildOrder';
import { parseScaled, roundDown } from '@/lib/bigint/format';
import { ApiKeyModal } from '@/components/modals/ApiKeyModal';
import type { Address } from 'viem';

interface Props {
  pairId: string;
}

/**
 * OrderForm — reads state from tradingStore (no props for order fields).
 * Uses wagmi useSignTypedData via useSubmitOrder mutation.
 */
export function OrderForm({ pairId }: Props) {
  const { address, isConnected } = useAccount();
  const apiKey = useAuthStore((s) => s.apiKey);

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  const form            = useTradingStore((s) => s.form);
  const setFormField    = useTradingStore((s) => s.setFormField);
  const resetForm       = useTradingStore((s) => s.resetForm);

  const { data: pair }  = usePair(pairId);
  const { nextNonce }   = useNextNonce(isConnected ? address : undefined);
  const submitOrder     = useSubmitOrder();

  const [baseToken, quoteToken] = pairId.split('/');

  const handleSubmit = async () => {
    if (!address || !pair || nextNonce === undefined) return;
    if (!apiKey) {
      setApiKeyModalOpen(true);
      return;
    }

    const priceRaw  = parseScaled(form.priceInput);
    const amountRaw = parseScaled(form.amountInput);

    // Round to tick/lot size
    const price  = roundDown(priceRaw, pair.tickSize);
    const amount = roundDown(amountRaw, pair.lotSize);

    if (amount === 0n) {
      alert('수량을 입력하세요.');
      return;
    }

    const isBuy = form.side === 'buy';

    const orderMsg = form.orderType === 'market'
      ? buildMarketOrder({
          maker: address as Address,
          baseToken:  baseToken as Address,
          quoteToken: quoteToken as Address,
          amount,
          isBuy,
          nonce: nextNonce,
        })
      : buildLimitOrder({
          maker: address as Address,
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

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <p className="text-small text-color-text-1">지갑을 연결하여 거래하세요</p>
        <ConnectButton />
      </div>
    );
  }

  const isBuyForm = form.side === 'buy';

  return (
    <>
      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />
    <div className="flex flex-col h-full p-4 gap-4 overflow-y-auto">
      {/* API Key status */}
      {!apiKey && (
        <button
          onClick={() => setApiKeyModalOpen(true)}
          className="w-full py-2 rounded-lg border border-color-warning bg-color-warning/10 text-tiny text-color-warning hover:bg-color-warning/20 transition-colors"
        >
          ⚠ API 키 등록 필요 — 클릭하여 등록
        </button>
      )}
      {/* Side tabs */}
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

      {/* Leverage slider */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-tiny">
          <span className="text-color-text-0">레버리지</span>
          <span className="text-color-text-2 font-medium">{form.leverage}x</span>
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
        className={`w-full py-3 rounded-lg text-small font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isBuyForm
            ? 'bg-color-positive hover:brightness-110'
            : 'bg-color-negative hover:brightness-110'
        }`}
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
