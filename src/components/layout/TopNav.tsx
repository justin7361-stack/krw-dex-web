import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { usePairs } from '@/hooks/api/usePairs';
import { useTrades } from '@/hooks/api/useTrades';
import { useFundingRate } from '@/hooks/api/useFundingRate';
import { slugToPairId, pairIdToSlug } from '@/lib/pair/pairId';
import { formatKRW } from '@/lib/bigint/format';

// ─── PairDropdown ─────────────────────────────────────────────────────────────

interface PairDropdownProps {
  currentPairId: string | null;
}

function PairDropdown({ currentPairId }: PairDropdownProps) {
  const { data: pairs } = usePairs();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activePairs = (pairs ?? []).filter((p) => p.active);
  const current = activePairs.find((p) => p.pairId === currentPairId) ?? activePairs[0];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!activePairs.length) {
    return (
      <span className="text-small font-semibold text-color-text-0 px-2">
        페어 로딩 중…
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-color-layer-3 transition-colors"
      >
        <span className="text-medium font-semibold text-color-text-2">
          {current ? `${current.baseSymbol}/${current.quoteSymbol}` : '페어 선택'}
        </span>
        <svg
          className={`w-3 h-3 text-color-text-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-[160px] bg-color-layer-2 border border-color-border rounded-lg shadow-xl z-50 py-1">
          {activePairs.map((pair) => (
            <button
              key={pair.pairId}
              onClick={() => {
                navigate(`/trade/${pairIdToSlug(pair.pairId)}`);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-small transition-colors flex items-center justify-between gap-4 ${
                pair.pairId === currentPairId
                  ? 'text-color-accent bg-color-layer-3'
                  : 'text-color-text-1 hover:bg-color-layer-3'
              }`}
            >
              <span className="font-medium">{pair.baseSymbol}/{pair.quoteSymbol}</span>
              {pair.pairId === currentPairId && (
                <svg className="w-3 h-3 text-color-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PriceTicker ──────────────────────────────────────────────────────────────

function PriceTicker({ pairId }: { pairId: string }) {
  const { data: trades }  = useTrades(pairId);
  const { data: funding } = useFundingRate(pairId);

  // Last price: most recent trade, fallback to mark price from funding
  const lastPrice = trades?.[0]?.price ?? funding?.markPrice ?? 0n;

  if (!lastPrice) return null;

  return (
    <span className="text-small font-medium tabular-nums text-color-text-2">
      {formatKRW(lastPrice)}
    </span>
  );
}

// ─── TopNav ───────────────────────────────────────────────────────────────────

export function TopNav() {
  const { pair: pairSlug } = useParams<{ pair: string }>();
  const currentPairId = pairSlug ? slugToPairId(pairSlug) : null;

  return (
    <nav className="flex items-center h-12 px-4 gap-4 border-b border-color-border bg-color-layer-1 shrink-0 z-10">
      {/* Logo */}
      <Link to="/" className="font-semibold text-medium text-color-text-2 tracking-tight whitespace-nowrap">
        HyperKRW
      </Link>

      {/* Pair dropdown */}
      <PairDropdown currentPairId={currentPairId} />

      {/* Last price ticker (only on trade pages) */}
      {currentPairId && (
        <PriceTicker pairId={currentPairId} />
      )}

      {/* Navigation links */}
      <div className="flex items-center gap-1">
        {currentPairId && (
          <Link
            to={`/trade/${pairIdToSlug(currentPairId)}`}
            className="px-3 py-1.5 rounded-md text-small font-medium text-color-text-2 hover:bg-color-layer-3 transition-colors"
          >
            거래
          </Link>
        )}
        <Link
          to="/swap"
          className="px-3 py-1.5 rounded-md text-small font-medium text-color-text-1 hover:text-color-text-2 hover:bg-color-layer-3 transition-colors"
        >
          스왑
        </Link>
        <Link
          to="/portfolio"
          className="px-3 py-1.5 rounded-md text-small font-medium text-color-text-1 hover:text-color-text-2 hover:bg-color-layer-3 transition-colors"
        >
          포트폴리오
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Wallet connect */}
      <ConnectButton
        showBalance={false}
        chainStatus="icon"
        accountStatus="address"
      />
    </nav>
  );
}
