import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import type { ReactNode } from 'react';

import { wagmiConfig } from '@/lib/wagmi/config';

// ─── TanStack Query client ────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnMount: true,
    },
  },
});

// ─── RainbowKit dark theme matching HyperKRW palette ─────────────────────────
const rkTheme = darkTheme({
  accentColor:          '#6a4dff',
  accentColorForeground: '#ffffff',
  borderRadius:         'medium',
  fontStack:            'system',
  overlayBlur:          'small',
});

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Root provider tree.
 * Order matters — WagmiProvider must wrap RainbowKitProvider.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} locale="ko">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
