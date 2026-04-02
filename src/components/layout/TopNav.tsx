import { Link, useParams, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { usePairs } from '@/hooks/api/usePairs';
import { slugToPairId } from '@/lib/pair/pairId';

// ─── TopNav ───────────────────────────────────────────────────────────────────
/**
 * Simplified TopNav — logo + context title + wallet connect.
 * Navigation is handled by BottomNav (Market / Trade / Account tabs).
 */
export function TopNav() {
  const location = useLocation();
  const { pair: pairSlug } = useParams<{ pair: string }>();

  const currentPairId = pairSlug ? slugToPairId(pairSlug) : null;
  const { data: pairs } = usePairs();
  const currentPair = currentPairId
    ? pairs?.find((p) => p.pairId === currentPairId)
    : null;

  // Derive page title
  let title: string;
  if (location.pathname.startsWith('/trade') && currentPair) {
    title = `${currentPair.baseSymbol}/${currentPair.quoteSymbol}`;
  } else if (location.pathname.startsWith('/trade')) {
    title = '거래';
  } else if (location.pathname.startsWith('/account')) {
    title = '계정';
  } else {
    title = '마켓';
  }

  return (
    <nav className="flex items-center h-12 px-4 gap-3 border-b border-color-border bg-color-layer-1 shrink-0 z-10">

      {/* Logo */}
      <Link to="/market" className="flex items-center gap-1.5 mr-1">
        {/* Mini logo mark */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="3"  y="8"  width="4" height="10" rx="1" fill="var(--color-accent)" />
          <rect x="10" y="4"  width="4" height="14" rx="1" fill="var(--color-accent)" opacity="0.8" />
          <rect x="17" y="6"  width="4" height="12" rx="1" fill="var(--color-accent)" opacity="0.6" />
        </svg>
        <span className="font-bold text-medium text-color-text-2 tracking-tight">
          HyperKRW
        </span>
      </Link>

      {/* Divider */}
      <div className="w-px h-5 bg-color-border" />

      {/* Page context */}
      <span className="text-small font-semibold text-color-text-1">{title}</span>

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
