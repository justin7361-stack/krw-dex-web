import { describe, it, expect } from 'vitest';
import { bigintReviver } from './reviver';

describe('bigintReviver', () => {
  // Helper: parse JSON with reviver
  function parse(json: string) {
    return JSON.parse(json, bigintReviver);
  }

  it('converts price string to bigint', () => {
    const result = parse('{"price":"65000000000000000000000000"}');
    expect(typeof result.price).toBe('bigint');
    expect(result.price).toBe(65_000_000n * (10n ** 18n));
  });

  it('converts amount string to bigint', () => {
    const result = parse('{"amount":"10000000000000000"}');
    expect(typeof result.amount).toBe('bigint');
    expect(result.amount).toBe(10n ** 16n);
  });

  it('converts markPrice to bigint', () => {
    const result = parse('{"markPrice":"1000000000000000000"}');
    expect(typeof result.markPrice).toBe('bigint');
  });

  it('converts indexPrice to bigint', () => {
    const result = parse('{"indexPrice":"2000000000000000000"}');
    expect(typeof result.indexPrice).toBe('bigint');
  });

  it('converts funding rate to bigint', () => {
    const result = parse('{"rate":"100000000000000"}');
    expect(typeof result.rate).toBe('bigint');
    expect(result.rate).toBe(100_000_000_000_000n);
  });

  it('converts totalBalance and freeMargin to bigint', () => {
    const result = parse('{"totalBalance":"10000000000000000000000000","freeMargin":"9000000000000000000000000"}');
    expect(typeof result.totalBalance).toBe('bigint');
    expect(typeof result.freeMargin).toBe('bigint');
  });

  it('converts size and margin to bigint', () => {
    const result = parse('{"size":"1000000000000000000","margin":"100000000000000000000"}');
    expect(typeof result.size).toBe('bigint');
    expect(typeof result.margin).toBe('bigint');
  });

  it('converts unrealizedPnl to bigint', () => {
    const result = parse('{"unrealizedPnl":"500000000000000000000"}');
    expect(typeof result.unrealizedPnl).toBe('bigint');
  });

  it('does NOT convert non-numeric fields', () => {
    const result = parse('{"orderId":"abc-123","status":"open","pairId":"0xAA/0xBB"}');
    expect(typeof result.orderId).toBe('string');
    expect(typeof result.status).toBe('string');
    expect(typeof result.pairId).toBe('string');
  });

  it('does NOT convert number fields (only string → bigint)', () => {
    // timestamp is a number, not a string — should remain number
    const result = parse('{"timestamp":1234567890}');
    expect(typeof result.timestamp).toBe('number');
  });

  it('handles "0" correctly', () => {
    const result = parse('{"price":"0"}');
    expect(result.price).toBe(0n);
  });

  it('returns original value for invalid BigInt strings in known keys', () => {
    // "null" is not a valid BigInt — should return as-is (string)
    const result = parse('{"price":"null"}');
    expect(result.price).toBe('null');
  });

  it('converts all OHLC candle fields', () => {
    const result = parse('{"open":"1000","high":"2000","low":"900","close":"1500","volume":"5000"}');
    expect(typeof result.open).toBe('bigint');
    expect(typeof result.high).toBe('bigint');
    expect(typeof result.low).toBe('bigint');
    expect(typeof result.close).toBe('bigint');
    expect(typeof result.volume).toBe('bigint');
  });
});
