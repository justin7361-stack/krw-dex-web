import { describe, it, expect } from 'vitest';
import {
  pairIdToSlug,
  slugToPairId,
  encodePairId,
  parsePairId,
  buildPairId,
  pairLabel,
} from './pairId';

const BASE  = '0xc6e7DF5E7b4f2A278906862b61205850344D4e7d';
const QUOTE = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const PAIR_ID = `${BASE}/${QUOTE}`;
const SLUG    = `${BASE}--${QUOTE}`;

describe('pairIdToSlug', () => {
  it('converts slash to double-dash', () => {
    expect(pairIdToSlug(PAIR_ID)).toBe(SLUG);
  });

  it('is reversible with slugToPairId', () => {
    expect(slugToPairId(pairIdToSlug(PAIR_ID))).toBe(PAIR_ID);
  });
});

describe('slugToPairId', () => {
  it('converts double-dash back to slash', () => {
    expect(slugToPairId(SLUG)).toBe(PAIR_ID);
  });
});

describe('encodePairId', () => {
  it('percent-encodes the slash', () => {
    const encoded = encodePairId(PAIR_ID);
    expect(encoded).not.toContain('/');
    expect(encoded).toContain('%2F');
  });

  it('encoded form can be decoded back', () => {
    expect(decodeURIComponent(encodePairId(PAIR_ID))).toBe(PAIR_ID);
  });
});

describe('parsePairId', () => {
  it('extracts base and quote', () => {
    const { base, quote } = parsePairId(PAIR_ID);
    expect(base).toBe(BASE);
    expect(quote).toBe(QUOTE);
  });

  it('returns empty strings for malformed input', () => {
    const { base, quote } = parsePairId('');
    expect(base).toBe('');
    expect(quote).toBe('');
  });
});

describe('buildPairId', () => {
  it('builds pairId from base and quote', () => {
    expect(buildPairId(BASE, QUOTE)).toBe(PAIR_ID);
  });

  it('round-trips with parsePairId', () => {
    const { base, quote } = parsePairId(PAIR_ID);
    expect(buildPairId(base, quote)).toBe(PAIR_ID);
  });
});

describe('pairLabel', () => {
  it('shortens both addresses to 8 chars', () => {
    const label = pairLabel(PAIR_ID);
    expect(label).toBe(`${BASE.slice(0, 8)}/${QUOTE.slice(0, 8)}`);
  });

  it('contains a slash separator', () => {
    expect(pairLabel(PAIR_ID)).toContain('/');
  });
});
