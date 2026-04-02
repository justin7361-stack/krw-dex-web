import { Link, useParams } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

import { usePairs } from '@/hooks/api/usePairs';
import { slugToPairId, pairIdToSlug } from '@/lib/pair/pairId';

export function TopNav() {
  const { pair: pairSlug } = useParams<{ pair: string }>();
  const currentPairId = pairSlug ? slugToPairId(pairSlug) : null;
  const { data: pairs } = usePairs();

  return (
    <nav className="flex items-center h-12 px-4 gap-6 border-b border-color-border bg-color-layer-1 shrink-0 z-10">
      {/* Logo */}
      <Link to="/" className="font-semibold text-medium text-color-text-2 tracking-tight whitespace-nowrap">
        HyperKRW
      </Link>

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

      {/* Pair selector */}
      {pairs && pairs.length > 0 && (
        <div className="flex items-center gap-1 ml-2">
          {pairs.filter((p) => p.active).slice(0, 5).map((pair) => (
            <Link
              key={pair.pairId}
              to={`/trade/${pairIdToSlug(pair.pairId)}`}
              className={`px-2 py-1 rounded text-tiny font-medium transition-colors ${
                pair.pairId === currentPairId
                  ? 'bg-color-accent text-white'
                  : 'text-color-text-0 hover:text-color-text-1 hover:bg-color-layer-3'
              }`}
            >
              {pair.baseSymbol}/{pair.quoteSymbol}
            </Link>
          ))}
        </div>
      )}

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
