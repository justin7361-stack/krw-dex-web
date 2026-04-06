import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { usePairs } from '@/hooks/api/usePairs';

// Lazy-loaded pages — loaded on demand, not in the initial bundle
const TradingPage  = lazy(() => import('@/pages/trade/TradingPage').then(m => ({ default: m.TradingPage })));
const MarketPage   = lazy(() => import('@/pages/market/MarketPage').then(m => ({ default: m.MarketPage })));
const AccountPage  = lazy(() => import('@/pages/account/AccountPage').then(m => ({ default: m.AccountPage })));
const SwapPage     = lazy(() => import('@/pages/swap/SwapPage').then(m => ({ default: m.SwapPage })));

// Simple loading fallback — keep it minimal (no heavy component)
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ color: '#888', fontSize: '14px' }}>Loading...</div>
    </div>
  );
}

// Redirect "/trade" (no pair) → first active pair
function TradeRedirect() {
  const { data: pairs } = usePairs();
  const first = pairs?.find((p) => p.active);
  if (first) {
    const slug = first.pairId.replace('/', '--');
    return <Navigate to={`/trade/${slug}`} replace />;
  }
  return null; // wait for pairs to load
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route element={<AppShell />}>
              {/* Default → market */}
              <Route index element={<Navigate to="/market" replace />} />

              {/* Market overview */}
              <Route path="/market" element={<MarketPage />} />

              {/* Trading */}
              <Route path="/trade" element={<TradeRedirect />} />
              <Route path="/trade/:pair" element={<TradingPage />} />

              {/* Account */}
              <Route path="/account" element={<AccountPage />} />

              {/* Legacy redirects */}
              <Route path="/swap"      element={<Navigate to="/account" replace />} />
              <Route path="/portfolio" element={<Navigate to="/account" replace />} />

              {/* Swap kept at its own route (accessible from account) */}
              <Route path="/swap/page" element={<SwapPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
