import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Auth Store ───────────────────────────────────────────────────────────────
// Persisted to localStorage.
// Stores the HyperKRW server API key for the connected wallet.

// P-4 fix: align with server ApiKeyRole ('read' | 'trade') from traderAuth.ts
// Previously used frontend-only enum values ('ADMIN'|'OPERATOR'|'READ_ONLY')
// that didn't match server responses, causing role checks to silently fail.
export type KeyRole = 'read' | 'trade';

interface AuthState {
  // Wallet-bound API key (X-Api-Key header)
  apiKey:  string | null;
  keyRole: KeyRole | null;
  // The wallet address this key belongs to
  keyOwner: string | null;

  // Actions
  setApiKey:   (key: string, role: KeyRole, owner: string) => void;
  clearApiKey: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey:   null,
      keyRole:  null,
      keyOwner: null,

      setApiKey: (key, role, owner) =>
        set({ apiKey: key, keyRole: role, keyOwner: owner }),

      clearApiKey: () =>
        set({ apiKey: null, keyRole: null, keyOwner: null }),
    }),
    {
      name: 'hyperkrw-auth',
      // Only persist non-sensitive shape — the key itself is persisted
      // because it must survive page refresh. Clearing on disconnect is
      // handled in the wallet disconnect handler.
    },
  ),
);
