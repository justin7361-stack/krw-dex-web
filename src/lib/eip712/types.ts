// ─── EIP-712 Order Type ───────────────────────────────────────────────────────
// ⚠️  CRITICAL: This must exactly match EIP712Verifier.ts in krw-dex-server.
// The typehash is: keccak256("Order(address maker,address taker,address baseToken,
//   address quoteToken,uint256 price,uint256 amount,bool isBuy,uint256 nonce,uint256 expiry)")
//
// DO NOT add isLiquidation — it is NOT part of the signed typehash.
// Adding it will cause signature verification failure on the server.

export const ORDER_TYPES = {
  Order: [
    { name: 'maker',      type: 'address' },
    { name: 'taker',      type: 'address' },
    { name: 'baseToken',  type: 'address' },
    { name: 'quoteToken', type: 'address' },
    { name: 'price',      type: 'uint256' },
    { name: 'amount',     type: 'uint256' },
    { name: 'isBuy',      type: 'bool'    },
    { name: 'nonce',      type: 'uint256' },
    { name: 'expiry',     type: 'uint256' },
  ],
} as const;

export type OrderMessage = {
  maker:      `0x${string}`;
  taker:      `0x${string}`;
  baseToken:  `0x${string}`;
  quoteToken: `0x${string}`;
  price:      bigint;
  amount:     bigint;
  isBuy:      boolean;
  nonce:      bigint;
  expiry:     bigint;
};
