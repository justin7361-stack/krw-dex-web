import { useNavigate, useLocation } from 'react-router-dom';
import { useTradingStore } from '@/store/tradingStore';
import { usePairs } from '@/hooks/api/usePairs';
import { pairIdToSlug } from '@/lib/pair/pairId';

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconMarket({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--color-accent)' : 'var(--color-text-0)'}
      strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round"
    >
      {/* Candlestick chart icon */}
      <rect x="3"  y="6"  width="4" height="10" rx="0.5" />
      <line x1="5" y1="3"  x2="5" y2="6" />
      <line x1="5" y1="16" x2="5" y2="19" />
      <rect x="10" y="4"  width="4" height="8"  rx="0.5" />
      <line x1="12" y1="2"  x2="12" y2="4" />
      <line x1="12" y1="12" x2="12" y2="15" />
      <rect x="17" y="8"  width="4" height="9"  rx="0.5" />
      <line x1="19" y1="5"  x2="19" y2="8" />
      <line x1="19" y1="17" x2="19" y2="20" />
    </svg>
  );
}

function IconTrade({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--color-accent)' : 'var(--color-text-0)'}
      strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round"
    >
      {/* Orderbook / exchange arrows icon */}
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconAccount({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? 'var(--color-accent)' : 'var(--color-text-0)'}
      strokeWidth={active ? 2 : 1.7} strokeLinecap="round" strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'market',  label: '마켓',  path: '/market'  },
  { id: 'trade',   label: '거래',  path: null       }, // dynamic
  { id: 'account', label: '계정',  path: '/account' },
] as const;

type TabId = typeof TABS[number]['id'];

export function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { data: pairs } = usePairs();
  const selectedPairId  = useTradingStore((s) => s.selectedPairId);

  const pathname = location.pathname;

  function getActive(): TabId {
    if (pathname.startsWith('/trade')) return 'trade';
    if (pathname.startsWith('/account') || pathname.startsWith('/portfolio') || pathname.startsWith('/swap')) return 'account';
    return 'market';
  }
  const active = getActive();

  function handleTab(id: TabId) {
    if (id === 'market') {
      navigate('/market');
      return;
    }
    if (id === 'trade') {
      // Navigate to last selected pair, or first active pair
      const pairId = selectedPairId
        || pairs?.find((p) => p.active)?.pairId
        || '';
      if (pairId) navigate(`/trade/${pairIdToSlug(pairId)}`);
      return;
    }
    if (id === 'account') {
      navigate('/account');
    }
  }

  return (
    <nav className="flex items-stretch h-14 border-t border-color-border bg-color-layer-1 shrink-0 z-20">
      {TABS.map(({ id, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => handleTab(id)}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors ${
              isActive ? 'text-color-accent' : 'text-color-text-0 hover:text-color-text-1'
            }`}
          >
            {id === 'market'  && <IconMarket  active={isActive} />}
            {id === 'trade'   && <IconTrade   active={isActive} />}
            {id === 'account' && <IconAccount active={isActive} />}
            <span className={`text-tiny font-medium ${isActive ? 'text-color-accent' : ''}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
