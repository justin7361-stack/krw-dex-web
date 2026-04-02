import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

/**
 * Root layout shell — top nav + page content.
 * React Router Outlet renders the matched child route.
 */
export function AppShell() {
  return (
    <div className="flex flex-col h-full bg-color-layer-0 text-color-text-2">
      <TopNav />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
