// ─── Contract address helpers ─────────────────────────────────────────────────
// All addresses come from environment variables set at deploy time.

import type { Address } from 'viem';

function requireAddress(key: string): Address {
  const val = import.meta.env[key] as string | undefined;
  if (!val || val === '0x') {
    // In development: return zero address so the app doesn't crash
    if (import.meta.env.DEV) {
      return '0x0000000000000000000000000000000000000000';
    }
    throw new Error(`Missing env variable: ${key}`);
  }
  return val as Address;
}

export const CONTRACT_ADDRESSES = {
  orderSettlement: requireAddress('VITE_ORDER_SETTLEMENT_ADDRESS'),
  pairRegistry:    requireAddress('VITE_PAIR_REGISTRY_ADDRESS'),
  marginRegistry:  requireAddress('VITE_MARGIN_REGISTRY_ADDRESS'),
  hybridPool:      requireAddress('VITE_HYBRID_POOL_ADDRESS'),
} as const;
