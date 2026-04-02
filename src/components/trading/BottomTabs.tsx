import { useAccount } from 'wagmi';

import { useTradingStore } from '@/store/tradingStore';
import { useOpenOrders } from '@/hooks/api/useOpenOrders';
import { useCancelOrder } from '@/hooks/mutations/useCancelOrder';
import { formatKRW, formatAmount } from '@/lib/bigint/format';
import type { Order } from '@/types/api';

interface Props {
  pairId: string;
}

export function BottomTabs({ pairId }: Props) {
  const { address, isConnected } = useAccount();
  const bottomTab    = useTradingStore((s) => s.bottomTab);
  const setBottomTab = useTradingStore((s) => s.setBottomTab);

  const { data: openOrders } = useOpenOrders(address ?? '', pairId);
  const cancelOrder = useCancelOrder();

  const openCount = openOrders?.length ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-color-border">
        {(
          [
            { key: 'openOrders', label: `미체결 주문 ${openCount > 0 ? `(${openCount})` : ''}` },
            { key: 'filled',     label: '체결 내역' },
            { key: 'positions',  label: '포지션' },
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
        ) : (
          <div className="flex items-center justify-center h-full text-tiny text-color-text-0">
            내역 없음
          </div>
        )}
      </div>
    </div>
  );
}

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
            <td className="px-3 py-2 text-tiny text-color-text-0">
              {order.status}
            </td>
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
