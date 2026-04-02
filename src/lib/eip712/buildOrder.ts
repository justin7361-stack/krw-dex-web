import type { Address } from 'viem';
import type { OrderMessage } from './types';

// Zero address — used as taker for limit orders (anyone can fill)
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// Expiry constants
const SECONDS_IN_DAY = 86400n;
const MARKET_ORDER_EXPIRY_SECONDS = 30n; // 30s — effectively IOC

interface BuildLimitOrderParams {
  maker:      Address;
  baseToken:  Address;
  quoteToken: Address;
  price:      bigint;  // scaled by 1e18
  amount:     bigint;  // scaled by 1e18
  isBuy:      boolean;
  nonce:      bigint;
  expiryDays?: bigint; // default: 7 days
}

interface BuildMarketOrderParams {
  maker:      Address;
  baseToken:  Address;
  quoteToken: Address;
  amount:     bigint;  // scaled by 1e18
  isBuy:      boolean;
  nonce:      bigint;
}

/**
 * Build an EIP-712 OrderMessage for a limit order.
 * Price must be rounded to the pair's tickSize before calling.
 * Amount must be rounded to the pair's lotSize before calling.
 */
export function buildLimitOrder(params: BuildLimitOrderParams): OrderMessage {
  const {
    maker, baseToken, quoteToken,
    price, amount, isBuy, nonce,
    expiryDays = 7n,
  } = params;

  const expiry = BigInt(Math.floor(Date.now() / 1000)) + expiryDays * SECONDS_IN_DAY;

  return {
    maker,
    taker:      ZERO_ADDRESS,
    baseToken,
    quoteToken,
    price,
    amount,
    isBuy,
    nonce,
    expiry,
  };
}

/**
 * Build an EIP-712 OrderMessage for a market order.
 * Market orders: price = 0n, very short expiry (IOC behaviour).
 */
export function buildMarketOrder(params: BuildMarketOrderParams): OrderMessage {
  const { maker, baseToken, quoteToken, amount, isBuy, nonce } = params;
  const expiry = BigInt(Math.floor(Date.now() / 1000)) + MARKET_ORDER_EXPIRY_SECONDS;

  return {
    maker,
    taker:      ZERO_ADDRESS,
    baseToken,
    quoteToken,
    price:  0n,
    amount,
    isBuy,
    nonce,
    expiry,
  };
}
