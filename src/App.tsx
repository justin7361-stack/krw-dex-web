import { Navigate, Route, Routes } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';

import { AppShell } from '@/components/layout/AppShell';
import { TradingPage } from '@/pages/trade/TradingPage';
import { SwapPage } from '@/pages/swap/SwapPage';
import { PortfolioPage } from '@/pages/portfolio/PortfolioPage';
import { usePairs } from '@/hooks/api/usePairs';

// Redirect "/" to the first active pair, or a placeholder slug
function DefaultRedirect() {
  const { data: pairs } = usePairs();
  const first = pairs?.find((p) => p.active);
  if (first) {
    const slug = first.pairId.replace('/', '--');
    return <Navigate to={`/trade/${slug}`} replace />;
  }
  // Fallback until pairs load
  return <Navigate to="/trade/loading" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DefaultRedirect />} />
          <Route path="/trade/:pair" element={<TradingPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
