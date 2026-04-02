// ─── TanStack Query Key Factory ───────────────────────────────────────────────
// Centralised query key definitions for cache management.

export const queryKeys = {
  // Pairs / markets
  pairs: () => ['pairs'] as const,

  // Orderbook
  orderbook: (pairId: string) => ['orderbook', pairId] as const,

  // Recent trades
  trades: (pairId: string) => ['trades', pairId] as const,

  // Candle data
  candles: (pairId: string, resolution: string) =>
    ['candles', pairId, resolution] as const,

  // Open orders for an address
  openOrders: (address: string) => ['openOrders', address] as const,

  // Filled orders for an address
  filledOrders: (address: string) => ['filledOrders', address] as const,

  // Positions for an address
  positions: (address: string) => ['positions', address] as const,

  // Funding rate for a pair
  fundingRate: (pairId: string) => ['fundingRate', pairId] as const,

  // Mark price for a pair
  markPrice: (pairId: string) => ['markPrice', pairId] as const,

  // Nonces for a user
  nonces: (address: string) => ['nonces', address] as const,
} as const;
