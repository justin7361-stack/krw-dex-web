import { useAccount, useReadContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { Address } from 'viem';

import { ERC20_ABI } from '@/lib/wagmi/abis';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi/contracts';
import { HYBRID_POOL_ABI } from '@/lib/wagmi/abis';
import { formatKRW, formatAmount } from '@/lib/bigint/format';
import { useFundingRate } from '@/hooks/api/useFundingRate';
import { usePairs } from '@/hooks/api/usePairs';

export function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const { data: pairs } = usePairs();

  // Fetch token addresses from HybridPool
  const { data: token0Addr } = useReadContract({
    address: CONTRACT_ADDRESSES.hybridPool,
    abi: HYBRID_POOL_ABI,
    functionName: 'tokens',
    args: [0n],
  });
  const { data: token1Addr } = useReadContract({
    address: CONTRACT_ADDRESSES.hybridPool,
    abi: HYBRID_POOL_ABI,
    functionName: 'tokens',
    args: [1n],
  });

  // Balances
  const { data: balance0 } = useReadContract({
    address: token0Addr as Address | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!token0Addr },
  });
  const { data: balance1 } = useReadContract({
    address: token1Addr as Address | undefined,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!token1Addr },
  });

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-color-text-1">포트폴리오를 보려면 지갑을 연결하세요</p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto flex flex-col gap-6">
      <h1 className="text-large font-semibold text-color-text-2">포트폴리오</h1>

      {/* Asset balances */}
      <div className="bg-color-layer-1 rounded-xl border border-color-border p-5">
        <h2 className="text-medium font-medium text-color-text-1 mb-4">자산 현황</h2>
        <div className="grid grid-cols-2 gap-4">
          <AssetCard
            symbol="KRW"
            balance={balance0 as bigint | undefined}
            isKrw
          />
          <AssetCard
            symbol="USDC"
            balance={balance1 as bigint | undefined}
            isKrw={false}
          />
        </div>
      </div>

      {/* Funding rates for active pairs */}
      {pairs && pairs.filter((p) => p.active).length > 0 && (
        <div className="bg-color-layer-1 rounded-xl border border-color-border p-5">
          <h2 className="text-medium font-medium text-color-text-1 mb-4">펀딩 레이트</h2>
          <div className="flex flex-col gap-2">
            {pairs.filter((p) => p.active).map((pair) => (
              <FundingRow key={pair.pairId} pairId={pair.pairId} label={`${pair.baseSymbol}/${pair.quoteSymbol}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AssetCard({ symbol, balance, isKrw }: { symbol: string; balance: bigint | undefined; isKrw: boolean }) {
  return (
    <div className="bg-color-layer-2 rounded-lg p-4 flex flex-col gap-1">
      <span className="text-small text-color-text-0">{symbol}</span>
      <span className="text-large font-semibold tabular-nums text-color-text-2">
        {balance !== undefined
          ? (isKrw ? formatKRW(balance) : formatAmount(balance, 2))
          : '—'
        }
      </span>
    </div>
  );
}

function FundingRow({ pairId, label }: { pairId: string; label: string }) {
  const { data: funding } = useFundingRate(pairId);
  if (!funding) return null;

  const isPositive = funding.rate >= 0n;

  return (
    <div className="spacedRow py-2 border-b border-color-border last:border-0">
      <span className="text-small text-color-text-1">{label}</span>
      <div className="flex items-center gap-4 text-small tabular-nums">
        <span className="text-color-text-0">{formatKRW(funding.markPrice)} (마크)</span>
        <span className={isPositive ? 'text-color-positive' : 'text-color-negative'}>
          {isPositive ? '+' : ''}{Number(funding.rate) / 1e18 * 100}% (8h)
        </span>
      </div>
    </div>
  );
}
