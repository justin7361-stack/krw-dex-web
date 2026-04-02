import { describe, it, expect } from 'vitest';
import { formatKRW, formatAmount, formatPercent, parseScaled, roundDown } from './format';

const SCALE = 10n ** 18n;

describe('formatKRW', () => {
  it('formats zero', () => {
    expect(formatKRW(0n)).toBe('₩0');
  });

  it('formats 1 KRW (1e18 scaled)', () => {
    expect(formatKRW(SCALE)).toBe('₩1');
  });

  it('formats 65,000,000 KRW', () => {
    const val = 65_000_000n * SCALE;
    expect(formatKRW(val)).toBe('₩65,000,000');
  });

  it('truncates sub-1 KRW to ₩0 at default decimals=0', () => {
    const val = SCALE / 2n; // 0.5 KRW
    expect(formatKRW(val)).toBe('₩0');
  });

  it('shows fractional KRW when decimals=2', () => {
    const val = SCALE / 2n; // 0.5 KRW
    expect(formatKRW(val, 2)).toMatch(/0\.50/);
  });

  it('formats negative value', () => {
    const val = -1000n * SCALE;
    expect(formatKRW(val)).toMatch(/-/);
  });
});

describe('formatAmount', () => {
  it('formats zero amount', () => {
    expect(formatAmount(0n)).toBe('0');
  });

  it('formats 1 whole unit (1e18 scaled)', () => {
    expect(formatAmount(SCALE)).toBe('1');
  });

  it('formats 0.01 BTC', () => {
    const val = SCALE / 100n; // 0.01
    expect(formatAmount(val)).toMatch(/0\.01/);
  });

  it('formats large amount', () => {
    const val = 100n * SCALE;
    expect(formatAmount(val)).toBe('100');
  });
});

describe('formatPercent', () => {
  it('formats zero', () => {
    expect(formatPercent(0n)).toBe('0.0000%');
  });

  it('formats 0.01% (1e14 bigint)', () => {
    const val = SCALE / 10_000n; // 0.0001 * 1e18 = 1e14
    expect(formatPercent(val)).toBe('0.0100%');
  });

  it('formats 1% (1e16 bigint)', () => {
    const val = SCALE / 100n; // 0.01 * 1e18 = 1e16
    expect(formatPercent(val)).toBe('1.0000%');
  });

  it('formats negative rate', () => {
    const val = -(SCALE / 10_000n);
    expect(formatPercent(val)).toMatch(/-/);
  });
});

describe('parseScaled', () => {
  it('parses integer string to scaled bigint', () => {
    expect(parseScaled('1')).toBe(SCALE);
  });

  it('parses decimal string', () => {
    expect(parseScaled('0.5')).toBe(SCALE / 2n);
  });

  it('parses zero', () => {
    expect(parseScaled('0')).toBe(0n);
  });

  it('parses large number', () => {
    expect(parseScaled('65000000')).toBe(65_000_000n * SCALE);
  });

  it('returns 0n for empty string', () => {
    expect(parseScaled('')).toBe(0n);
  });

  it('throws for non-numeric input (invalid BigInt string)', () => {
    // parseScaled does not catch invalid input — caller must validate
    expect(() => parseScaled('abc')).toThrow();
  });

  it('truncates excess decimal places (> 18)', () => {
    // should not throw
    expect(() => parseScaled('1.1234567890123456789')).not.toThrow();
  });
});

describe('roundDown', () => {
  it('rounds down to nearest step', () => {
    expect(roundDown(15n, 10n)).toBe(10n);
  });

  it('returns value when already aligned', () => {
    expect(roundDown(20n, 10n)).toBe(20n);
  });

  it('handles step=0 (returns value unchanged)', () => {
    expect(roundDown(17n, 0n)).toBe(17n);
  });

  it('rounds down to tickSize', () => {
    // price 65,000,500 KRW with tickSize 1,000 KRW → 65,000,000
    const tick = 1_000n * SCALE;
    const price = 65_000_500n * SCALE;
    expect(roundDown(price, tick)).toBe(65_000_000n * SCALE);
  });
});
