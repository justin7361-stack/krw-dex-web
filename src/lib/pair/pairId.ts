// ─── PairId Utilities ─────────────────────────────────────────────────────────
// Server pairId format: "0xBASE/0xQUOTE"   (slash separator)
// URL slug format:      "0xBASE--0xQUOTE"  (double-dash separator)

/**
 * Convert a server pairId to a URL-safe slug.
 * "0xBASE/0xQUOTE" → "0xBASE--0xQUOTE"
 */
export function pairIdToSlug(pairId: string): string {
  return pairId.replace('/', '--');
}

/**
 * Convert a URL slug back to a server pairId.
 * "0xBASE--0xQUOTE" → "0xBASE/0xQUOTE"
 */
export function slugToPairId(slug: string): string {
  return slug.replace('--', '/');
}

/**
 * Encode a pairId for use in a REST query parameter.
 * "0xBASE/0xQUOTE" → "0xBASE%2F0xQUOTE"
 *
 * ALWAYS use this before passing a pairId to a fetch URL.
 */
export function encodePairId(pairId: string): string {
  return encodeURIComponent(pairId);
}

/**
 * Extract base and quote token addresses from a pairId.
 * "0xBASE/0xQUOTE" → { base: "0xBASE", quote: "0xQUOTE" }
 */
export function parsePairId(pairId: string): { base: string; quote: string } {
  const [base = '', quote = ''] = pairId.split('/');
  return { base, quote };
}

/**
 * Build a pairId from base and quote addresses.
 */
export function buildPairId(base: string, quote: string): string {
  return `${base}/${quote}`;
}

/**
 * Build a human-readable label from a pairId.
 * Shortens addresses to first 6 chars.
 * "0xABCDEF1234.../0xGHIJKL5678..." → "0xABCDEF/0xGHIJKL"
 */
export function pairLabel(pairId: string): string {
  const { base, quote } = parsePairId(pairId);
  return `${base.slice(0, 8)}/${quote.slice(0, 8)}`;
}
