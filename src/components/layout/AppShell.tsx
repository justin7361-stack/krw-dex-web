import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';

/**
 * Root layout shell.
 *
 * ┌──────────────────────┐
 * │  TopNav  (h-12)      │
 * ├──────────────────────┤
 * │  <Outlet />  (flex-1)│
 * ├──────────────────────┤
 * │  BottomNav (h-14)    │
 * └──────────────────────┘
 */
export function AppShell() {
  return (
    <div className="flex flex-col h-full bg-color-layer-0 text-color-text-2">
      <TopNav />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
