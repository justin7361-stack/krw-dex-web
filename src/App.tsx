import { Navigate, Route, Routes } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { MarketPage } from '@/pages/market/MarketPage';
import { TradingPage } from '@/pages/trade/TradingPage';
import { SwapPage } from '@/pages/swap/SwapPage';
import { AccountPage } from '@/pages/account/AccountPage';
import { usePairs } from '@/hooks/api/usePairs';

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
    </BrowserRouter>
  );
}
