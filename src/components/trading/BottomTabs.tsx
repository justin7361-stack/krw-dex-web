import { useAccount } from 'wagmi';

import { useTradingStore } from '@/store/tradingStore';
import { useOpenOrders, useFilledOrders } from '@/hooks/api/useOpenOrders';
import { usePositions } from '@/hooks/api/usePositions';
import { useCancelOrder } from '@/hooks/mutations/useCancelOrder';
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
          <OpenOrdersTable orders={openOrders ?? []} onCancel={(id) => cancelOrder.mutate(id)} />
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

function OpenOrdersTable({
  orders,
  onCancel,
}: {
  orders: Order[];
  onCancel: (id: string) => void;
}) {
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
            <td className="px-3 py-2 text-tiny tabular-nums text-color-text-0">
              {formatAmount(order.filledAmount)}
            </td>
            <td className="px-3 py-2 text-tiny text-color-text-0">{order.status}</td>
            <td className="px-3 py-2">
              <button
                onClick={() => onCancel(order.orderId)}
                className="text-tiny text-color-error hover:underline"
              >
                취소
              </button>
            </td>
          </tr>
        ))}
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
  return (
    <div className="flex flex-col h-full">
      {/* Margin summary header */}
      {totalBalance !== undefined && (
        <div className="flex gap-6 px-4 py-2 border-b border-color-border bg-color-layer-2 text-tiny">
          <span className="text-color-text-0">
            총 잔고: <span className="text-color-text-2 tabular-nums">{formatKRW(totalBalance)}</span>
          </span>
          <span className="text-color-text-0">
            가용 마진: <span className="text-color-positive tabular-nums">{formatKRW(freeMargin ?? 0n)}</span>
          </span>
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
              {['페어', '방향', '크기', '마진', '마크가격', '미실현손익', '모드'].map((h) => (
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
                  <td className="px-3 py-2 text-tiny text-color-text-0">{pos.mode}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
