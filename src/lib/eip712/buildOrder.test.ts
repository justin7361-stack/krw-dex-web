import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildLimitOrder, buildMarketOrder } from './buildOrder';

const MAKER:       `0x${string}` = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const BASE_TOKEN:  `0x${string}` = '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d';
const QUOTE_TOKEN: `0x${string}` = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const ZERO_ADDR:   `0x${string}` = '0x0000000000000000000000000000000000000000';

const PRICE  = 65_000_000n * (10n ** 18n);
const AMOUNT = 1n           * (10n ** 16n);  // 0.01 BTC
const NONCE  = 12345n;

// Fix Date.now so expiry is deterministic
const FIXED_TIME_MS = 1_000_000_000_000;
const FIXED_TIME_S  = BigInt(Math.floor(FIXED_TIME_MS / 1000));

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(FIXED_TIME_MS);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildLimitOrder', () => {
  it('returns an order with all 9 required EIP-712 fields', () => {
    const order = buildLimitOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, price: PRICE, amount: AMOUNT, isBuy: true, nonce: NONCE });
    expect(order).toHaveProperty('maker');
    expect(order).toHaveProperty('taker');
    expect(order).toHaveProperty('baseToken');
    expect(order).toHaveProperty('quoteToken');
    expect(order).toHaveProperty('price');
    expect(order).toHaveProperty('amount');
    expect(order).toHaveProperty('isBuy');
    expect(order).toHaveProperty('nonce');
    expect(order).toHaveProperty('expiry');
    // No extra fields (esp. NOT isLiquidation)
    expect(Object.keys(order)).toHaveLength(9);
  });

  it('sets taker to zero address (open order)', () => {
    const order = buildLimitOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, price: PRICE, amount: AMOUNT, isBuy: true, nonce: NONCE });
    expect(order.taker).toBe(ZERO_ADDR);
  });

  it('sets correct maker, baseToken, quoteToken', () => {
    const order = buildLimitOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, price: PRICE, amount: AMOUNT, isBuy: true, nonce: NONCE });
    expect(order.maker).toBe(MAKER);
    expect(order.baseToken).toBe(BASE_TOKEN);
    expect(order.quoteToken).toBe(QUOTE_TOKEN);
  });

  it('preserves price and amount as bigint', () => {
    const order = buildLimitOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, price: PRICE, amount: AMOUNT, isBuy: true, nonce: NONCE });
    expect(typeof order.price).toBe('bigint');
    expect(typeof order.amount).toBe('bigint');
    expect(order.price).toBe(PRICE);
    expect(order.amount).toBe(AMOUNT);
  });

  it('defaults expiry to 7 days from now', () => {
    const order = buildLimitOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, price: PRICE, amount: AMOUNT, isBuy: true, nonce: NONCE });
    const expected = FIXED_TIME_S + 7n * 86400n;
    expect(order.expiry).toBe(expected);
  });

  it('respects custom expiryDays', () => {
    const order = buildLimitOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, price: PRICE, amount: AMOUNT, isBuy: true, nonce: NONCE, expiryDays: 1n });
    const expected = FIXED_TIME_S + 86400n;
    expect(order.expiry).toBe(expected);
  });

  it('builds a sell order correctly', () => {
    const order = buildLimitOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, price: PRICE, amount: AMOUNT, isBuy: false, nonce: NONCE });
    expect(order.isBuy).toBe(false);
  });
});

describe('buildMarketOrder', () => {
  it('sets price to 0n (market order)', () => {
    const order = buildMarketOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, amount: AMOUNT, isBuy: true, nonce: NONCE });
    expect(order.price).toBe(0n);
  });

  it('sets expiry to 30 seconds (IOC behavior)', () => {
    const order = buildMarketOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, amount: AMOUNT, isBuy: true, nonce: NONCE });
    const expected = FIXED_TIME_S + 30n;
    expect(order.expiry).toBe(expected);
  });

  it('has exactly 9 fields (no isLiquidation)', () => {
    const order = buildMarketOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, amount: AMOUNT, isBuy: true, nonce: NONCE });
    expect(Object.keys(order)).toHaveLength(9);
  });

  it('taker is zero address', () => {
    const order = buildMarketOrder({ maker: MAKER, baseToken: BASE_TOKEN, quoteToken: QUOTE_TOKEN, amount: AMOUNT, isBuy: true, nonce: NONCE });
    expect(order.taker).toBe(ZERO_ADDR);
  });
});
