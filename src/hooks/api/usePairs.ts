import { useReadContract, useReadContracts } from 'wagmi';

import { PAIR_REGISTRY_ABI, ERC20_ABI } from '@/lib/wagmi/abis';
import type { Address } from 'viem';
import type { Pair } from '@/types/api';

const PAIR_REGISTRY = import.meta.env['VITE_PAIR_REGISTRY_ADDRESS'] as Address | undefined;

// ─── usePairs ─────────────────────────────────────────────────────────────────
// Reads all trading pairs from PairRegistry contract.
// Steps: getAllPairIds() → pairs(bytes32) for each → symbol() for each token
export function usePairs() {
  // Step 1: get all on-chain pair IDs (bytes32[])
  const { data: pairIds, isLoading: idsLoading } = useReadContract({
    address: PAIR_REGISTRY,
    abi:     PAIR_REGISTRY_ABI,
    functionName: 'getAllPairIds',
    query: { enabled: !!PAIR_REGISTRY, staleTime: 60_000 },
  });

  const ids = (pairIds ?? []) as `0x${string}`[];

  // Step 2: batch-read each Pair struct
  const { data: pairStructs, isLoading: pairsLoading } = useReadContracts({
    contracts: ids.map((pid) => ({
      address:      PAIR_REGISTRY as Address,
      abi:          PAIR_REGISTRY_ABI,
      functionName: 'pairs' as const,
      args:         [pid] as const,
    })),
    query: { enabled: ids.length > 0, staleTime: 60_000 },
  });

  // Collect unique token addresses for symbol lookup
  const tokenAddrs = new Set<string>();
  (pairStructs ?? []).forEach((r) => {
    if (r.status === 'success' && r.result) {
      const res = r.result as unknown as [Address, Address, ...unknown[]];
      const [base, quote] = res;
      tokenAddrs.add(base.toLowerCase());
      tokenAddrs.add(quote.toLowerCase());
    }
  });
  const uniqueTokens = Array.from(tokenAddrs) as Address[];

  // Step 3: batch-read ERC20 symbols
  const { data: symbols, isLoading: symbolsLoading } = useReadContracts({
    contracts: uniqueTokens.map((addr) => ({
      address:      addr,
      abi:          ERC20_ABI,
      functionName: 'symbol' as const,
    })),
    query: { enabled: uniqueTokens.length > 0, staleTime: 300_000 },
  });

  // Build symbol map: address → symbol
  const symbolMap = new Map<string, string>();
  uniqueTokens.forEach((addr, i) => {
    const result = symbols?.[i];
    if (result?.status === 'success') {
      symbolMap.set(addr.toLowerCase(), result.result as string);
    }
  });

  // Step 4: assemble Pair[]
  const pairs: Pair[] = ids.flatMap((pid, i) => {
    const r = pairStructs?.[i];
    if (!r || r.status !== 'success' || !r.result) return [];

    const [baseToken, quoteToken, tickSize, lotSize, minOrderSize, maxOrderSize, active] =
      r.result as unknown as [Address, Address, bigint, bigint, bigint, bigint, boolean];

    const pairId    = `${baseToken}/${quoteToken}`;
    const baseSymbol  = symbolMap.get(baseToken.toLowerCase()) ?? baseToken.slice(0, 6);
    const quoteSymbol = symbolMap.get(quoteToken.toLowerCase()) ?? quoteToken.slice(0, 6);

    return [{
      pairId,
      baseToken,
      quoteToken,
      baseSymbol,
      quoteSymbol,
      active,
      tickSize,
      lotSize,
      minOrderSize,
      maxOrderSize,
    } satisfies Pair];
  });

  return {
    data:      pairs,
    isLoading: idsLoading || pairsLoading || symbolsLoading,
    error:     null,
  };
}

/** Get a single pair by pairId from the cached pairs list. */
export function usePair(pairId: string) {
  const { data: pairs, ...rest } = usePairs();
  const pair = pairs?.find((p) => p.pairId === pairId) ?? null;
  return { data: pair, ...rest };
}
