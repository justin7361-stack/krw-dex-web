import { useReadContracts } from 'wagmi';
import type { Address } from 'viem';

import { ORDER_SETTLEMENT_ABI } from '@/lib/wagmi/abis';
import { CONTRACT_ADDRESSES } from '@/lib/wagmi/contracts';

// Number of nonces to scan in one batch
const NONCE_BATCH_SIZE = 64;

/**
 * Scan the first 64 bitmap nonces and return the first unused one.
 * OrderSettlement uses a bitmap: nonce n is used if bit n is set.
 *
 * Returns { nextNonce: bigint | undefined, isLoading, isError }
 */
export function useNextNonce(address: Address | undefined) {
  const contracts = Array.from({ length: NONCE_BATCH_SIZE }, (_, i) => ({
    address:      CONTRACT_ADDRESSES.orderSettlement,
    abi:          ORDER_SETTLEMENT_ABI,
    functionName: 'isNonceUsed' as const,
    args:         [address ?? '0x0000000000000000000000000000000000000000', BigInt(i)] as const,
  }));

  const { data, isLoading, isError } = useReadContracts({
    contracts,
    query: {
      enabled: !!address,
      staleTime: 10_000,
    },
  });

  // Find first unused nonce
  let nextNonce: bigint | undefined;
  if (data) {
    for (let i = 0; i < data.length; i++) {
      const result = data[i];
      if (result?.status === 'success' && result.result === false) {
        nextNonce = BigInt(i);
        break;
      }
    }
  }

  return { nextNonce, isLoading, isError };
}
