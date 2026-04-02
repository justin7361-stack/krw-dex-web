// ─── Contract ABIs ────────────────────────────────────────────────────────────
// Sourced from krw-dex-contracts/src/*.sol

export const PAIR_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'getAllPairIds',
    inputs: [],
    outputs: [{ type: 'bytes32[]' }],
    stateMutability: 'view',
  },
  {
    // Pair struct field order in PairRegistry.sol:
    // baseToken, quoteToken, tickSize, lotSize, minOrderSize, maxOrderSize, active
    type: 'function',
    name: 'pairs',
    inputs: [{ name: 'pairId', type: 'bytes32' }],
    outputs: [
      { name: 'baseToken',    type: 'address' },
      { name: 'quoteToken',   type: 'address' },
      { name: 'tickSize',     type: 'uint256' },
      { name: 'lotSize',      type: 'uint256' },
      { name: 'minOrderSize', type: 'uint256' },
      { name: 'maxOrderSize', type: 'uint256' },
      { name: 'active',       type: 'bool'    },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPairId',
    inputs: [
      { name: 'baseToken',  type: 'address' },
      { name: 'quoteToken', type: 'address' },
    ],
    outputs: [{ type: 'bytes32' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    name: 'isWhitelisted',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

export const ORDER_SETTLEMENT_ABI = [
  {
    type: 'function',
    name: 'isNonceUsed',
    inputs: [
      { name: 'user',  type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'settleOrder',
    inputs: [
      {
        name: 'makerOrder',
        type: 'tuple',
        components: [
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
      },
      { name: 'makerSig', type: 'bytes' },
      {
        name: 'takerOrder',
        type: 'tuple',
        components: [
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
      },
      { name: 'takerSig', type: 'bytes' },
      { name: 'fillAmount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const;

export const HYBRID_POOL_ABI = [
  {
    type: 'function',
    name: 'tokens',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getAmountOut',
    inputs: [
      { name: 'tokenIn',  type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'swap',
    inputs: [
      { name: 'tokenIn',    type: 'address' },
      { name: 'amountIn',   type: 'uint256' },
      { name: 'minAmountOut', type: 'uint256' },
      { name: 'recipient',  type: 'address' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balances',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'symbol',
    inputs: [],
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
] as const;

export const MARGIN_REGISTRY_ABI = [
  {
    type: 'function',
    name: 'depositMargin',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdrawMargin',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getAccount',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalBalance', type: 'uint256' },
      { name: 'freeMargin',   type: 'uint256' },
      { name: 'usedMargin',   type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;
