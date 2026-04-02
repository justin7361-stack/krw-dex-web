import { useState } from 'react';
import { useAccount } from 'wagmi';

import { useTradingStore } from '@/store/tradingStore';
import { useOpenOrders, useFilledOrders } from '@/hooks/api/useOpenOrders';
import { usePositions } from '@/hooks/api/usePositions';
import { useCancelOrder } from '@/hooks/mutations/useCancelOrder';
import { useAmendOrder } from '@/hooks/mutations/useAmendOrder';
import { formatKRW, formatAmount } from '@/lib/bigint/format';
import type { Order } from '@/types/api';
import type { PositionEntry } from '@/hooks/api/usePositions';

interface Props {
  pairId: string;
}

export function BottomTabs({ pairId }: Props) {
  const { address, isConnected } = useAccount();
  const bottomTab    = useTradingStore((s) => s.bottomTab);
  const setBottomTab = useTradingStore((s) => s.setBottomTab);

  const { data: openOrders   } = useOpenOrders(address ?? '', pairId);
  const { data: filledOrders } = useFilledOrders(address ?? '');
  const { data: posData      } = usePositions(address ?? '');
  const cancelOrder = useCancelOrder();
  const amendOrder  = useAmendOrder();

  const openCount = openOrders?.length ?? 0;
  const positions = posData?.positions ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-color-border">
        {(
          [
            { key: 'openOrders', label: `미체결 주문${openCount > 0 ? ` (${openCount})` : ''}` },
            { key: 'filled',     label: `체결 내역${(filledOrders?.length ?? 0) > 0 ? ` (${filledOrders?.length})` : ''}` },
            { key: 'positions',  label: `포지션${positions.length > 0 ? ` (${positions.length})` : ''}` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setBottomTab(key)}
            className={`px-4 py-2 text-small font-medium transition-colors border-b-2 ${
              bottomTab === key
                ? 'border-color-accent text-color-text-2'
                : 'border-transparent text-color-text-0 hover:text-color-text-1'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {!isConnected ? (
          <div className="flex items-center justify-center h-full text-tiny text-color-text-0">
            지갑을 연결하세요
          </div>
        ) : bottomTab === 'openOrders' ? (
          <OpenOrdersTable
            orders={openOrders ?? []}
            onCancel={(id) => cancelOrder.mutate(id)}
            onAmend={(req) => amendOrder.mutate(req)}
            isAmending={amendOrder.isPending}
          />
        ) : bottomTab === 'filled' ? (
          <FilledOrdersTable orders={filledOrders ?? []} />
        ) : (
          <PositionsTable positions={positions} totalBalance={posData?.totalBalance} freeMargin={posData?.freeMargin} />
        )}
      </div>
    </div>
  );
}

// ─── Open Orders ─────────────────────────────────────────────────────────────

interface AmendState {
  priceInput:  string;
  amountInput: string;
}

function OpenOrdersTable({
  orders,
  onCancel,
  onAmend,
  isAmending,
}: {
  orders:     Order[];
  onCancel:   (id: string) => void;
  onAmend:    (req: { orderId: string; price?: string; amount?: string }) => void;
  isAmending: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [amendState, setAmendState] = useState<AmendState>({ priceInput: '', amountInput: '' });

  function startEdit(order: Order) {
    setEditingId(order.orderId);
    setAmendState({
      priceInput:  order.price > 0n ? order.price.toString() : '',
      amountInput: order.amount.toString(),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setAmendState({ priceInput: '', amountInput: '' });
  }

  function submitAmend(orderId: string) {
    const req: { orderId: string; price?: string; amount?: string } = { orderId };
    if (amendState.priceInput.trim())  req.price  = amendState.priceInput.trim();
    if (amendState.amountInput.trim()) req.amount = amendState.amountInput.trim();
    onAmend(req);
    cancelEdit();
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-tiny text-color-text-0">
        미체결 주문 없음
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-color-border">
          {['방향', '가격', '수량', '체결', '상태', ''].map((h) => (
            <th key={h} className="px-3 py-2 text-tiny text-color-text-0 font-normal">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const isEditing = editingId === order.orderId;
          const isLimitOrder = order.price > 0n;

          return (
            <tr key={order.orderId} className="border-b border-color-border hover:bg-color-layer-2">
              <td className={`px-3 py-2 text-tiny font-medium ${
                order.side === 'buy' ? 'text-color-positive' : 'text-color-negative'
              }`}>
                {order.side === 'buy' ? '매수' : '매도'}
              </td>

              {/* Price cell — inline edit when editing */}
              <td className="px-3 py-2 text-tiny tabular-nums text-color-text-2">
                {isEditing && isLimitOrder ? (
                  <input
                    type="number"
                    value={amendState.priceInput}
                    onChange={(e) => setAmendState((s) => ({ ...s, priceInput: e.target.value }))}
                    className="w-24 px-1.5 py-0.5 rounded bg-color-layer-3 border border-color-border text-tiny text-color-text-2 tabular-nums outline-none focus:border-color-accent"
                    placeholder="가격"
                    min="0"
                  />
                ) : (
                  isLimitOrder ? formatKRW(order.price) : '시장가'
                )}
              </td>

              {/* Amount cell — inline edit when editing */}
              <td className="px-3 py-2 text-tiny tabular-nums text-color-text-1">
                {isEditing ? (
                  <input
                    type="number"
                    value={amendState.amountInput}
                    onChange={(e) => setAmendState((s) => ({ ...s, amountInput: e.target.value }))}
                    className="w-24 px-1.5 py-0.5 rounded bg-color-layer-3 border border-color-border text-tiny text-color-text-1 tabular-nums outline-none focus:border-color-accent"
                    placeholder="수량"
                    min="0"
                  />
                ) : (
                  formatAmount(order.amount)
                )}
              </td>

              <td className="px-3 py-2 text-tiny tabular-nums text-color-text-0">
                {formatAmount(order.filledAmount)}
              </td>
              <td className="px-3 py-2 text-tiny text-color-text-0">{order.status}</td>

              {/* Action buttons */}
              <td className="px-3 py-2">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => submitAmend(order.orderId)}
                      disabled={isAmending}
                      className="text-tiny text-color-accent hover:underline disabled:opacity-50"
                    >
                      확인
                    </button>
                    <span className="text-color-border">|</span>
                    <button
                      onClick={cancelEdit}
                      className="text-tiny text-color-text-0 hover:underline"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isLimitOrder && (
                      <>
                        <button
                          onClick={() => startEdit(order)}
                          className="text-tiny text-color-accent hover:underline"
                        >
                          수정
                        </button>
                        <span className="text-color-border">|</span>
                      </>
                    )}
                    <button
                      onClick={() => onCancel(order.orderId)}
                      className="text-tiny text-color-error hover:underline"
                    >
                      취소
                    </button>
                  </div>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ─── Filled Orders ────────────────────────────────────────────────────────────

function FilledOrdersTable({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-tiny text-color-text-0">
        체결 내역 없음
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left border-b border-color-border">
          {['방향', '가격', '수량', '체결량', '상태'].map((h) => (
            <th key={h} className="px-3 py-2 text-tiny text-color-text-0 font-normal">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <tr key={order.orderId} className="border-b border-color-border hover:bg-color-layer-2">
            <td className={`px-3 py-2 text-tiny font-medium ${
              order.side === 'buy' ? 'text-color-positive' : 'text-color-negative'
            }`}>
              {order.side === 'buy' ? '매수' : '매도'}
            </td>
            <td className="px-3 py-2 text-tiny tabular-nums text-color-text-2">
              {order.price > 0n ? formatKRW(order.price) : '시장가'}
            </td>
            <td className="px-3 py-2 text-tiny tabular-nums text-color-text-1">
              {formatAmount(order.amount)}
            </td>
            <td className="px-3 py-2 text-tiny tabular-nums text-color-positive">
              {formatAmount(order.filledAmount)}
            </td>
            <td className="px-3 py-2 text-tiny text-color-text-0">{order.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Liquidation Risk Bar ────────────────────────────────────────────────────

/**
 * Visual bar showing how far current mark price is from liquidation.
 * Green → yellow → red as distance shrinks (≤30% → ≤10% → ≤5%).
 */
function LiqRiskBar({ markPrice, liquidationPrice }: { markPrice: bigint; liquidationPrice: bigint }) {
  if (liquidationPrice === 0n || markPrice === 0n) return null;

  const diff     = markPrice > liquidationPrice ? markPrice - liquidationPrice : liquidationPrice - markPrice;
  const distPct  = Number((diff * 10000n) / liquidationPrice) / 100; // e.g. 8.5

  // Fill: higher distance = more green fill; clamp 0-100
  const fillPct  = Math.min(100, Math.max(0, distPct));
  const barColor =
    distPct <= 5  ? 'bg-color-negative' :
    distPct <= 10 ? 'bg-yellow-500' :
    distPct <= 30 ? 'bg-yellow-400' :
    'bg-color-positive';

  const textColor =
    distPct <= 5  ? 'text-color-negative' :
    distPct <= 10 ? 'text-yellow-500' :
    distPct <= 30 ? 'text-yellow-400' :
    'text-color-positive';

  return (
    <div className="flex items-center gap-1.5 min-w-[100px]">
      {/* Progress bar */}
      <div className="flex-1 h-1 rounded-full bg-color-layer-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(fillPct, 100)}%` }}
        />
      </div>
      <span className={`text-tiny tabular-nums ${textColor}`}>
        {distPct.toFixed(1)}%
      </span>
    </div>
  );
}

// ─── Positions ────────────────────────────────────────────────────────────────

function PositionsTable({
  positions,
  totalBalance,
  freeMargin,
}: {
  positions: PositionEntry[];
  totalBalance?: bigint;
  freeMargin?:   bigint;
}) {
  // Margin ratio (used / total) for the header risk indicator
  const usedMargin   = totalBalance !== undefined && freeMargin !== undefined
    ? totalBalance - freeMargin
    : 0n;
  const marginRatioPct = totalBalance !== undefined && totalBalance > 0n
    ? Number((usedMargin * 10000n) / totalBalance) / 100
    : 0;
  const marginBarColor =
    marginRatioPct >= 80 ? 'bg-color-negative' :
    marginRatioPct >= 50 ? 'bg-yellow-500'     :
    'bg-color-positive';

  return (
    <div className="flex flex-col h-full">
      {/* Margin summary header + ratio bar */}
      {totalBalance !== undefined && (
        <div className="flex flex-col gap-1.5 px-4 py-2.5 border-b border-color-border bg-color-layer-2">
          <div className="flex gap-6 text-tiny">
            <span className="text-color-text-0">
              총 잔고: <span className="text-color-text-2 tabular-nums">{formatKRW(totalBalance)}</span>
            </span>
            <span className="text-color-text-0">
              가용 마진: <span className="text-color-positive tabular-nums">{formatKRW(freeMargin ?? 0n)}</span>
            </span>
            <span className="text-color-text-0">
              사용 마진: <span className="text-color-text-1 tabular-nums">{formatKRW(usedMargin)}</span>
            </span>
          </div>
          {/* Margin usage bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-color-layer-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${marginBarColor}`}
                style={{ width: `${Math.min(marginRatioPct, 100)}%` }}
              />
            </div>
            <span className={`text-tiny tabular-nums ${
              marginRatioPct >= 80 ? 'text-color-negative' :
              marginRatioPct >= 50 ? 'text-yellow-500' :
              'text-color-text-0'
            }`}>
              {marginRatioPct.toFixed(1)}% 사용
            </span>
          </div>
        </div>
      )}

      {positions.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-tiny text-color-text-0">
          열린 포지션 없음
        </div>
      ) : (
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-color-border">
              {['페어', '방향', '크기', '마진', '마크가격', '미실현손익', '청산거리'].map((h) => (
                <th key={h} className="px-3 py-2 text-tiny text-color-text-0 font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const isLong = pos.size > 0n;
              return (
                <tr key={`${pos.maker}-${pos.pairId}`} className="border-b border-color-border hover:bg-color-layer-2">
                  <td className="px-3 py-2 text-tiny text-color-text-1">
                    {pos.pairId.split('/').map(a => a.slice(0, 6)).join('/')}
                  </td>
                  <td className={`px-3 py-2 text-tiny font-medium ${isLong ? 'text-color-positive' : 'text-color-negative'}`}>
                    {isLong ? '롱' : '숏'}
                  </td>
                  <td className="px-3 py-2 text-tiny tabular-nums text-color-text-2">
                    {formatAmount(pos.size < 0n ? -pos.size : pos.size)}
                  </td>
                  <td className="px-3 py-2 text-tiny tabular-nums text-color-text-1">
                    {formatKRW(pos.margin)}
                  </td>
                  <td className="px-3 py-2 text-tiny tabular-nums text-color-text-1">
                    {pos.markPrice > 0n ? formatKRW(pos.markPrice) : '—'}
                  </td>
                  <td className={`px-3 py-2 text-tiny tabular-nums ${
                    pos.unrealizedPnl > 0n ? 'text-color-positive' :
                    pos.unrealizedPnl < 0n ? 'text-color-negative' : 'text-color-text-0'
                  }`}>
                    {pos.unrealizedPnl !== 0n ? formatKRW(pos.unrealizedPnl) : '—'}
                  </td>
                  {/* Liquidation distance bar */}
                  <td className="px-3 py-2">
                    {pos.markPrice > 0n && pos.liquidationPrice > 0n ? (
                      <LiqRiskBar markPrice={pos.markPrice} liquidationPrice={pos.liquidationPrice} />
                    ) : (
                      <span className="text-tiny text-color-text-0">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
