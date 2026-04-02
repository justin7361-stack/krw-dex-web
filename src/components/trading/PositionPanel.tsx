import { useAccount } from 'wagmi';

import { useFundingRate } from '@/hooks/api/useFundingRate';
import { formatKRW, formatPercent, formatAmount } from '@/lib/bigint/format';

interface Props {
  pairId: string;
}

export function PositionPanel({ pairId }: Props) {
  const { isConnected } = useAccount();
  const { data: funding } = useFundingRate(pairId);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-color-border">
        <span className="text-tiny font-medium text-color-text-1">마켓 정보</span>
      </div>

      {/* Funding rate */}
      {funding && (
        <div className="px-3 py-3 border-b border-color-border flex flex-col gap-2">
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
              {formatKRW(funding.markPrice)}
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

      {/* Positions placeholder */}
      <div className="px-3 py-2 border-b border-color-border">
        <span className="text-tiny font-medium text-color-text-1">내 포지션</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        {isConnected ? (
          <p className="text-tiny text-color-text-0">포지션 없음</p>
        ) : (
          <p className="text-tiny text-color-text-0">지갑 연결 필요</p>
        )}
      </div>
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
