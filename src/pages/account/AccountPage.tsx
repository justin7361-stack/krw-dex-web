import { useState } from 'react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { Address } from 'viem';

import { usePositions } from '@/hooks/api/usePositions';
import { useAuthStore } from '@/store/authStore';
import { ApiKeyModal } from '@/components/modals/ApiKeyModal';
import { formatKRW, formatAmount, parseScaled } from '@/lib/bigint/format';
import { ERC20_ABI, MARGIN_REGISTRY_ABI } from '@/lib/wagmi/abis';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi/contracts';
import type { Pair } from '@/types/api';

// ─── Token balance card ────────────────────────────────────────────────────────

interface BalanceCardProps {
  label:    string;
  symbol:   string;
  address?: Address;
  decimals?: number;
  isKRW?:   boolean;
}

function BalanceCard({ label, symbol, address: tokenAddr, isKRW = false }: BalanceCardProps) {
  const { address } = useAccount();

  const { data: balance } = useReadContract({
    address: tokenAddr,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenAddr },
  });

  const bal: bigint = (balance as bigint | undefined) ?? 0n;

  return (
    <div className="flex items-center justify-between px-5 py-4 bg-color-layer-2 rounded-xl border border-color-border">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-color-layer-4 flex items-center justify-center text-small font-bold text-color-text-1">
          {symbol.slice(0, 1)}
        </div>
        <div>
          <div className="text-small font-semibold text-color-text-2">{symbol}</div>
          <div className="text-tiny text-color-text-0">{label}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-semibold tabular-nums text-color-text-2">
          {isKRW ? formatKRW(bal, 0) : formatAmount(bal, 6)}
        </div>
        {isKRW && (
          <div className="text-tiny text-color-text-0 tabular-nums">{formatAmount(bal, 2)} 단위</div>
        )}
      </div>
    </div>
  );
}

// ─── Deposit / Withdraw form ───────────────────────────────────────────────────

function MarginForm() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [tab, setTab]       = useState<'deposit' | 'withdraw'>('deposit');

  const marginAddr = CONTRACT_ADDRESSES.marginRegistry;

  const amountScaled = amount ? parseScaled(amount) : 0n;

  // Check KRW allowance for deposit
  const { data: allowance } = useReadContract({
    address: CONTRACT_ADDRESSES.marginRegistry,  // assuming MarginRegistry has KRW addr
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && marginAddr ? [address, marginAddr] : undefined,
    query: { enabled: !!address },
  });

  const needsApproval = tab === 'deposit'
    && (allowance as bigint | undefined ?? 0n) < amountScaled
    && amountScaled > 0n;

  const { writeContract: approveWrite, isPending: isApproving } = useWriteContract();
  const { writeContract: marginWrite,  isPending: isMarginPending } = useWriteContract();

  const handleDeposit = () => {
    if (!address || amountScaled === 0n) return;
    marginWrite({
      address:      marginAddr,
      abi:          MARGIN_REGISTRY_ABI,
      functionName: 'depositMargin',
      args:         [amountScaled],
    });
    setAmount('');
  };

  const handleWithdraw = () => {
    if (!address || amountScaled === 0n) return;
    marginWrite({
      address:      marginAddr,
      abi:          MARGIN_REGISTRY_ABI,
      functionName: 'withdrawMargin',
      args:         [amountScaled],
    });
    setAmount('');
  };

  if (!isConnected) return null;

  return (
    <div className="bg-color-layer-2 rounded-xl border border-color-border overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-color-border">
        {(['deposit', 'withdraw'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-small font-semibold transition-colors ${
              tab === t
                ? 'text-color-text-2 border-b-2 border-color-accent bg-color-layer-3'
                : 'text-color-text-0 hover:text-color-text-1'
            }`}
          >
            {t === 'deposit' ? '입금' : '출금'}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-tiny text-color-text-0">금액 (KRW)</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-lg bg-color-layer-3 text-small tabular-nums text-color-text-2 placeholder:text-color-text-0 focus:outline-none focus:ring-1 focus:ring-color-accent"
            />
            <span className="flex items-center px-3 rounded-lg bg-color-layer-3 text-small text-color-text-1 font-medium">
              KRW
            </span>
          </div>
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2">
          {['100,000', '500,000', '1,000,000'].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v.replace(/,/g, ''))}
              className="flex-1 py-1 rounded text-tiny bg-color-layer-3 text-color-text-0 hover:bg-color-layer-4 hover:text-color-text-1 transition-colors"
            >
              ₩{v}
            </button>
          ))}
        </div>

        {tab === 'deposit' ? (
          needsApproval ? (
            <button
              onClick={() => {}}
              disabled={isApproving}
              className="w-full py-2.5 rounded-lg bg-color-warning text-black text-small font-semibold disabled:opacity-50"
            >
              {isApproving ? '승인 중...' : 'KRW 사용 승인'}
            </button>
          ) : (
            <button
              onClick={handleDeposit}
              disabled={isMarginPending || amountScaled === 0n}
              className="w-full py-2.5 rounded-lg bg-color-positive text-white text-small font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {isMarginPending ? '처리 중...' : '증거금 입금'}
            </button>
          )
        ) : (
          <button
            onClick={handleWithdraw}
            disabled={isMarginPending || amountScaled === 0n}
            className="w-full py-2.5 rounded-lg bg-color-negative text-white text-small font-semibold disabled:opacity-50 hover:brightness-110 transition-all"
          >
            {isMarginPending ? '처리 중...' : '증거금 출금'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Positions summary ─────────────────────────────────────────────────────────

function PositionsSummary({ address }: { address: string }) {
  const { data: posData, isLoading } = usePositions(address);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-color-layer-3 animate-pulse" />
        ))}
      </div>
    );
  }

  const positions = posData?.positions ?? [];

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-tiny text-color-text-0 gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-0)" strokeWidth={1.5} strokeLinecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="9" y1="9" x2="15" y2="9" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="15" x2="12" y2="15" />
        </svg>
        <span>오픈 포지션이 없습니다</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {positions.map((pos) => {
        const isLong    = pos.size > 0n;
        const absSize   = pos.size < 0n ? -pos.size : pos.size;
        const roiBps    = pos.margin > 0n
          ? Number((pos.unrealizedPnl * 10000n) / pos.margin) : 0;
        const isProfit  = roiBps >= 0;

        return (
          <div
            key={`${pos.maker}-${pos.pairId}`}
            className="px-4 py-3 bg-color-layer-2 rounded-xl border border-color-border flex items-center gap-4"
          >
            <div className={`text-tiny font-bold px-2 py-1 rounded ${
              isLong ? 'bg-color-positive-faded text-color-positive' : 'bg-color-negative-faded text-color-negative'
            }`}>
              {isLong ? '롱' : '숏'}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-small font-medium text-color-text-2 truncate">
                {pos.pairId.split('/')[0]?.slice(0, 10)}
              </span>
              <span className="text-tiny text-color-text-0 tabular-nums">
                크기 {formatAmount(absSize, 4)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className={`text-small font-semibold tabular-nums ${isProfit ? 'text-color-positive' : 'text-color-negative'}`}>
                {pos.unrealizedPnl !== 0n ? formatKRW(pos.unrealizedPnl, 0) : '₩0'}
              </span>
              <span className={`text-tiny tabular-nums ${isProfit ? 'text-color-positive' : 'text-color-negative'}`}>
                {isProfit ? '+' : ''}{(roiBps / 100).toFixed(2)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── AccountPage ───────────────────────────────────────────────────────────────

export function AccountPage() {
  const { address, isConnected } = useAccount();
  const { data: posData } = usePositions(address ?? '');
  const apiKey  = useAuthStore((s) => s.apiKey);
  const clearApiKey = useAuthStore((s) => s.clearApiKey);

  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="var(--color-text-0)" strokeWidth={1.5} strokeLinecap="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <p className="text-small text-color-text-1 text-center">
          계정을 관리하려면 지갑을 연결하세요
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <>
      <ApiKeyModal isOpen={apiKeyModalOpen} onClose={() => setApiKeyModalOpen(false)} />

      <div className="h-full overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

          {/* ── Section: 계좌 요약 ────────── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-medium font-semibold text-color-text-2">계좌 요약</h2>

            {/* Margin summary card */}
            {posData && (
              <div className="px-5 py-4 bg-color-layer-2 rounded-xl border border-color-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-small font-semibold text-color-text-1">증거금 계좌</span>
                  <span className="text-tiny text-color-text-0 tabular-nums truncate max-w-[140px]">
                    {address?.slice(0, 6)}…{address?.slice(-4)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-tiny text-color-text-0">총 잔액</span>
                    <span className="text-base font-bold tabular-nums text-color-text-2">
                      {formatKRW(posData.totalBalance, 0)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-tiny text-color-text-0">가용 증거금</span>
                    <span className="text-base font-bold tabular-nums text-color-positive">
                      {formatKRW(posData.freeMargin, 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Token balances */}
            <BalanceCard
              label="Korean Won (testnet)"
              symbol="KRW"
              address={CONTRACT_ADDRESSES.marginRegistry as Address}
              isKRW
            />
          </section>

          {/* ── Section: 입출금 ───────────── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-medium font-semibold text-color-text-2">입출금</h2>
            <MarginForm />
          </section>

          {/* ── Section: 오픈 포지션 ──────── */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-medium font-semibold text-color-text-2">오픈 포지션</h2>
              <span className="text-tiny text-color-text-0">
                {posData?.positions.length ?? 0}개
              </span>
            </div>
            <PositionsSummary address={address ?? ''} />
          </section>

          {/* ── Section: API 키 ───────────── */}
          <section className="flex flex-col gap-3">
            <h2 className="text-medium font-semibold text-color-text-2">API 키</h2>
            <div className="px-4 py-4 bg-color-layer-2 rounded-xl border border-color-border flex flex-col gap-3">
              {apiKey ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-color-positive" />
                      <span className="text-small text-color-text-1 font-medium">등록됨</span>
                    </div>
                    <span className="text-tiny text-color-text-0 font-mono">
                      {apiKey.slice(0, 8)}…
                    </span>
                  </div>
                  <button
                    onClick={() => clearApiKey()}
                    className="w-full py-2 rounded-lg text-tiny font-medium bg-color-negative-faded text-color-negative hover:bg-color-layer-4 transition-colors"
                  >
                    API 키 삭제
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-color-warning animate-pulse" />
                    <span className="text-small text-color-text-1">API 키 없음 — 주문 불가</span>
                  </div>
                  <button
                    onClick={() => setApiKeyModalOpen(true)}
                    className="w-full py-2 rounded-lg text-tiny font-medium bg-color-accent text-white hover:brightness-110 transition-all"
                  >
                    API 키 등록
                  </button>
                </>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
