import { useAccount } from 'wagmi';

import { useFundingRate } from '@/hooks/api/useFundingRate';
import { useMarkPrice } from '@/hooks/ws/useMarkPrice';
import { usePositions, type PositionEntry } from '@/hooks/api/usePositions';
import { formatKRW, formatPercent, formatAmount } from '@/lib/bigint/format';

interface Props {
  pairId: string;
}

export function PositionPanel({ pairId }: Props) {
  const { address, isConnected } = useAccount();
  const { data: funding } = useFundingRate(pairId);
  const { markPrice: wsMarkPrice } = useMarkPrice(pairId);
  const { data: posData } = usePositions(address ?? '');

  // Prefer real-time WS mark price (5s updates); fall back to REST funding data
  const effectiveMarkPrice = wsMarkPrice || funding?.markPrice;

  // Filter positions relevant to the current base token
  const baseToken = pairId.split('/')[0] ?? '';
  const positions = (posData?.positions ?? []).filter((p) =>
    p.pairId.startsWith(baseToken),
  );

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="px-3 py-2 border-b border-color-border">
        <span className="text-tiny font-medium text-color-text-1">마켓 정보</span>
      </div>

      {/* Funding rate block */}
      {funding && (
        <div className="px-3 py-3 border-b border-color-border flex flex-col gap-1.5">
          <div className="spacedRow">
            <span className="text-tiny text-color-text-0">펀딩 레이트</span>
            <span className={`text-tiny font-medium tabular-nums ${
              funding.rate >= 0n ? 'text-color-positive' : 'text-color-negative'
            }`}>
              {formatPercent(funding.rate)}
            </span>
          </div>
          <div className="spacedRow">
            <span className="text-tiny text-color-text-0">마크 가격</span>
            <span className="text-tiny tabular-nums text-color-text-2">
              {effectiveMarkPrice ? formatKRW(effectiveMarkPrice) : '—'}
            </span>
          </div>
          <div className="spacedRow">
            <span className="text-tiny text-color-text-0">인덱스 가격</span>
            <span className="text-tiny tabular-nums text-color-text-2">
              {formatKRW(funding.indexPrice)}
            </span>
          </div>
          <div className="spacedRow">
            <span className="text-tiny text-color-text-0">다음 펀딩</span>
            <span className="text-tiny text-color-text-1">
              {formatNextFunding(funding.nextFundingAt)}
            </span>
          </div>
        </div>
      )}

      {/* Positions header */}
      <div className="px-3 py-2 border-b border-color-border flex items-center justify-between">
        <span className="text-tiny font-medium text-color-text-1">내 포지션</span>
        {posData && (
          <span className="text-tiny text-color-text-0 tabular-nums">
            가용 <span className="text-color-positive">{formatKRW(posData.freeMargin, 0)}</span>
          </span>
        )}
      </div>

      {/* Positions list */}
      <div className="flex-1 overflow-y-auto">
        {!isConnected ? (
          <EmptyState label="지갑 연결 필요" />
        ) : positions.length === 0 ? (
          <EmptyState label="포지션 없음" />
        ) : (
          <div className="flex flex-col">
            {positions.map((pos) => (
              <PositionCard
                key={`${pos.maker}-${pos.pairId}`}
                pos={pos}
                markPrice={effectiveMarkPrice}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PositionCard ─────────────────────────────────────────────────────────────

interface PositionCardProps {
  pos:        PositionEntry;
  markPrice?: bigint;
}

function PositionCard({ pos, markPrice }: PositionCardProps) {
  const isLong = pos.size > 0n;
  const absSize = pos.size < 0n ? -pos.size : pos.size;

  // ROI% = unrealizedPnl / margin * 100  (both in same scale, scale cancels)
  const roiBps = pos.margin > 0n
    ? Number((pos.unrealizedPnl * 10000n) / pos.margin)
    : 0;
  const roiPct = roiBps / 100;
  const roiPositive = roiBps >= 0;

  // Near-liquidation warning: markPrice within 10% of liquidationPrice
  const nearLiq = markPrice !== undefined
    && pos.liquidationPrice > 0n
    && (() => {
        const diff = markPrice > pos.liquidationPrice
          ? markPrice - pos.liquidationPrice
          : pos.liquidationPrice - markPrice;
        return Number((diff * 100n) / pos.liquidationPrice) < 10;
      })();

  const leverageNum = Number(pos.leverage);

  return (
    <div className={`px-3 py-3 border-b border-color-border ${nearLiq ? 'bg-color-negative-faded' : ''}`}>

      {/* Row 1: Long/Short badge + leverage + margin mode */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-tiny font-bold px-1.5 py-0.5 rounded ${
          isLong
            ? 'bg-color-positive-faded text-color-positive'
            : 'bg-color-negative-faded text-color-negative'
        }`}>
          {isLong ? '롱' : '숏'}
        </span>
        <span className="text-tiny px-1.5 py-0.5 rounded bg-color-layer-4 text-color-text-1 font-medium">
          {leverageNum > 0 ? `${leverageNum}x` : '—'}
        </span>
        <span className="text-tiny text-color-text-0">
          {pos.mode === 'cross' ? '크로스' : '아이솔레이티드'}
        </span>
        {nearLiq && (
          <span className="ml-auto text-tiny text-color-negative font-semibold animate-pulse">
            ⚠ 청산 근접
          </span>
        )}
      </div>

      {/* Row 2: size + unrealizedPnl */}
      <div className="spacedRow mb-1">
        <span className="text-tiny text-color-text-0">크기</span>
        <span className="text-tiny tabular-nums text-color-text-2">
          {formatAmount(absSize, 4)}
        </span>
      </div>

      {/* Row 3: entry price */}
      {pos.entryPrice > 0n && (
        <div className="spacedRow mb-1">
          <span className="text-tiny text-color-text-0">진입 가격</span>
          <span className="text-tiny tabular-nums text-color-text-2">
            {formatKRW(pos.entryPrice, 0)}
          </span>
        </div>
      )}

      {/* Row 4: liquidation price */}
      {pos.liquidationPrice > 0n && (
        <div className="spacedRow mb-1">
          <span className="text-tiny text-color-text-0">청산 가격</span>
          <span className={`text-tiny tabular-nums ${nearLiq ? 'text-color-negative font-semibold' : 'text-color-text-1'}`}>
            {formatKRW(pos.liquidationPrice, 0)}
          </span>
        </div>
      )}

      {/* Row 5: unrealized PnL + ROI% */}
      <div className="spacedRow">
        <span className="text-tiny text-color-text-0">미실현손익</span>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-tiny tabular-nums font-medium ${
            roiPositive ? 'text-color-positive' : 'text-color-negative'
          }`}>
            {pos.unrealizedPnl !== 0n ? formatKRW(pos.unrealizedPnl, 0) : '—'}
          </span>
          {pos.margin > 0n && (
            <span className={`text-tiny tabular-nums ${
              roiPositive ? 'text-color-positive' : 'text-color-negative'
            }`}>
              ({roiPositive ? '+' : ''}{roiPct.toFixed(2)}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-tiny text-color-text-0">{label}</p>
    </div>
  );
}

function formatNextFunding(ts: number): string {
  const diff = ts - Math.floor(Date.now() / 1000);
  if (diff <= 0) return '곧';
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}
