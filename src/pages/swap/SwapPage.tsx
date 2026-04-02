import { useState, useCallback } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { Address } from 'viem';

import { HYBRID_POOL_ABI, ERC20_ABI } from '@/lib/wagmi/abis';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi/contracts';
import { parseScaled, formatKRW, formatAmount } from '@/lib/bigint/format';

type SlippageOption = '0.1' | '0.5' | '1.0';

export function SwapPage() {
  const { address, isConnected } = useAccount();
  const [amountIn, setAmountIn]   = useState('');
  const [slippage, setSlippage]   = useState<SlippageOption>('0.5');
  const [customSlippage, setCustomSlippage] = useState('');

  const poolAddr = CONTRACT_ADDRESSES.hybridPool;

  // Fetch token addresses from pool
  const { data: token0 } = useReadContract({
    address: poolAddr,
    abi: HYBRID_POOL_ABI,
    functionName: 'tokens',
    args: [0n],
  });
  const { data: token1 } = useReadContract({
    address: poolAddr,
    abi: HYBRID_POOL_ABI,
    functionName: 'tokens',
    args: [1n],
  });

  const [tokenIn, setTokenIn] = useState<0 | 1>(0);
  const tokenInAddr  = tokenIn === 0 ? token0 : token1;
  const tokenOutAddr = tokenIn === 0 ? token1 : token0;

  const amountInScaled = parseScaled(amountIn);

  // Read expected output from pool (view call)
  const { data: amountOut } = useReadContract({
    address: poolAddr,
    abi: HYBRID_POOL_ABI,
    functionName: 'getAmountOut',
    args: tokenInAddr ? [tokenInAddr as Address, amountInScaled] : undefined,
    query: { enabled: !!tokenInAddr && amountInScaled > 0n },
  });

  const expectedOut: bigint = (amountOut as bigint | undefined) ?? 0n;

  // Slippage
  const slippagePct = customSlippage ? parseFloat(customSlippage) : parseFloat(slippage);
  const slippageBps = BigInt(Math.floor(slippagePct * 100));
  const minAmountOut = expectedOut > 0n
    ? expectedOut - (expectedOut * slippageBps) / 10000n
    : 0n;

  // Price impact
  const priceImpact = expectedOut > 0n && amountInScaled > 0n
    ? Number((amountInScaled - expectedOut) * 10000n / amountInScaled) / 100
    : 0;

  // Check allowance
  const { data: allowance } = useReadContract({
    address: tokenInAddr as Address | undefined,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && poolAddr ? [address, poolAddr] : undefined,
    query: { enabled: !!address && !!tokenInAddr },
  });

  const needsApproval = (allowance ?? 0n) < amountInScaled && amountInScaled > 0n;

  // Write contracts
  const { writeContract: approve, isPending: isApproving } = useWriteContract();
  const { writeContract: swap,    isPending: isSwapping  } = useWriteContract();

  const handleApprove = useCallback(() => {
    if (!tokenInAddr || !poolAddr) return;
    approve({
      address: tokenInAddr as Address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [poolAddr, amountInScaled],
    });
  }, [tokenInAddr, poolAddr, amountInScaled, approve]);

  const handleSwap = useCallback(() => {
    if (!tokenInAddr || !address) return;
    swap({
      address: poolAddr,
      abi: HYBRID_POOL_ABI,
      functionName: 'swap',
      args: [tokenInAddr as Address, amountInScaled, minAmountOut, address],
    });
  }, [tokenInAddr, address, poolAddr, amountInScaled, minAmountOut, swap]);

  const impactClass =
    priceImpact >= 5   ? 'text-color-error' :
    priceImpact >= 1   ? 'text-color-warning' :
    'text-color-positive';

  return (
    <div className="flex items-start justify-center h-full pt-16 px-4">
      <div className="w-full max-w-md bg-color-layer-1 rounded-xl border border-color-border p-6 flex flex-col gap-5">
        <h1 className="text-large font-semibold text-color-text-2">스왑</h1>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-tiny text-color-text-0">
            <span>입력</span>
            <button
              onClick={() => setTokenIn(tokenIn === 0 ? 1 : 0)}
              className="text-color-accent hover:underline"
            >
              전환 ↕
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="flex-1 px-3 py-3 rounded-lg bg-color-layer-3 text-medium tabular-nums text-color-text-2 placeholder:text-color-text-0 focus:outline-none focus:ring-1 focus:ring-color-accent"
            />
            <div className="px-3 py-3 rounded-lg bg-color-layer-3 text-small text-color-text-1 whitespace-nowrap">
              {tokenIn === 0 ? 'KRW' : 'USDC'}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col gap-2">
          <span className="text-tiny text-color-text-0">출력 (예상)</span>
          <div className="px-3 py-3 rounded-lg bg-color-layer-2 text-medium tabular-nums text-color-text-2 border border-color-border">
            {expectedOut > 0n ? formatAmount(expectedOut, 6) : '0.0'}
            <span className="text-small text-color-text-0 ml-2">
              {tokenIn === 0 ? 'USDC' : 'KRW'}
            </span>
          </div>
        </div>

        {/* Price impact + slippage */}
        {expectedOut > 0n && (
          <div className="flex flex-col gap-2 text-tiny">
            <div className="spacedRow">
              <span className="text-color-text-0">가격 임팩트</span>
              <span className={impactClass}>{priceImpact.toFixed(2)}%</span>
            </div>
            <div className="spacedRow">
              <span className="text-color-text-0">최소 수령량</span>
              <span className="text-color-text-1 tabular-nums">{formatAmount(minAmountOut, 6)}</span>
            </div>
          </div>
        )}

        {/* Slippage settings */}
        <div className="flex flex-col gap-2">
          <span className="text-tiny text-color-text-0">허용 슬리피지</span>
          <div className="flex gap-2">
            {(['0.1', '0.5', '1.0'] as SlippageOption[]).map((s) => (
              <button
                key={s}
                onClick={() => { setSlippage(s); setCustomSlippage(''); }}
                className={`flex-1 py-1.5 rounded text-tiny font-medium transition-colors ${
                  slippage === s && !customSlippage
                    ? 'bg-color-accent text-white'
                    : 'bg-color-layer-3 text-color-text-1 hover:bg-color-layer-4'
                }`}
              >
                {s}%
              </button>
            ))}
            <input
              type="text"
              placeholder="직접입력"
              value={customSlippage}
              onChange={(e) => setCustomSlippage(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded bg-color-layer-3 text-tiny text-color-text-2 text-center placeholder:text-color-text-0 focus:outline-none focus:ring-1 focus:ring-color-accent"
            />
          </div>
        </div>

        {/* Action buttons */}
        {!isConnected ? (
          <ConnectButton />
        ) : needsApproval ? (
          <button
            onClick={handleApprove}
            disabled={isApproving}
            className="w-full py-3 rounded-lg bg-color-accent text-white text-small font-semibold disabled:opacity-50"
          >
            {isApproving ? '승인 중...' : '승인'}
          </button>
        ) : (
          <button
            onClick={handleSwap}
            disabled={isSwapping || amountInScaled === 0n || expectedOut === 0n}
            className="w-full py-3 rounded-lg bg-color-accent text-white text-small font-semibold disabled:opacity-50"
          >
            {isSwapping ? '스왑 중...' : '스왑'}
          </button>
        )}
      </div>
    </div>
  );
}
