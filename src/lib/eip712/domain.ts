import type { Address } from 'viem';

import { CONTRACT_ADDRESSES } from '../wagmi/contracts';
import { activeChain } from '../wagmi/config';

// ─── EIP-712 Domain ───────────────────────────────────────────────────────────
// Must exactly match the domain defined in OrderSettlement.sol
// Any change here will cause signature verification to fail.

export function getOrderDomain() {
  return {
    name: 'HyperKRW',
    version: '1',
    chainId: activeChain.id,
    verifyingContract: CONTRACT_ADDRESSES.orderSettlement as Address,
  } as const;
}
