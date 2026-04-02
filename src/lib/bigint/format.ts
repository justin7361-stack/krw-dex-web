// ─── BigInt Display Formatters ────────────────────────────────────────────────
// Number() conversions are ONLY allowed here (display layer) and in chart data.
// All internal calculations must stay in bigint.

const SCALE = 10n ** 18n;

/**
 * Format a scaled bigint (1e18) as a Korean Won string.
 * e.g. 1_350_000_000_000_000_000_000n → "₩1,350"
 *
 * @param value - value scaled by 1e18
 * @param decimals - decimal places to show (default: 0 for KRW)
 */
export function formatKRW(value: bigint, decimals = 0): string {
  const whole = value / SCALE;
  const frac  = value % SCALE;

  if (decimals === 0) {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(Number(whole));
  }

  // With fractional part
  const divisor = 10n ** BigInt(decimals);
  const fracPart = (frac * divisor) / SCALE;
  const numValue = Number(whole) + Number(fracPart) / Number(divisor);

  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue);
}

/**
 * Format a scaled bigint as a plain number string.
 * e.g. 1_500_000_000_000_000_000n → "1.5"
 *
 * @param value   - value scaled by 1e18
 * @param decimals - decimal places (default: 4)
 */
export function formatAmount(value: bigint, decimals = 4): string {
  const whole = value / SCALE;
  const frac  = value % SCALE;
  const divisor = 10n ** BigInt(decimals);
  const fracDigits = (frac * divisor) / SCALE;

  const fracStr = fracDigits.toString().padStart(decimals, '0');
  const display = decimals > 0 ? `${whole}.${fracStr}` : whole.toString();

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(parseFloat(display));
}

/**
 * Format a basis-points rate (scaled by 1e18) as a percentage string.
 * e.g. 100_000_000_000_000_000n (0.1 * 1e18) → "0.01%"  (for 1 bps)
 */
export function formatPercent(value: bigint, decimals = 4): string {
  const pct = Number(value) / Number(SCALE) * 100;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Convert a scaled bigint to a plain JavaScript number.
 * ⚠️ Only use for lightweight-charts or Intl formatters — NOT for calculations.
 */
export function toNumber(value: bigint, decimals = 18): number {
  const divisor = 10 ** decimals;
  return Number(value) / divisor;
}

/**
 * Round a bigint value down to the nearest multiple of `step`.
 * Used for tickSize (price) and lotSize (amount) rounding.
 */
export function roundDown(value: bigint, step: bigint): bigint {
  if (step === 0n) return value;
  return (value / step) * step;
}

/**
 * Parse a user-entered decimal string into a scaled bigint (1e18).
 * e.g. "1350" → 1_350_000_000_000_000_000_000n
 * e.g. "1.5"  → 1_500_000_000_000_000_000n
 */
export function parseScaled(input: string): bigint {
  const trimmed = input.trim();
  if (!trimmed || trimmed === '.') return 0n;

  const [whole = '0', frac = ''] = trimmed.split('.');
  const fracPadded = frac.slice(0, 18).padEnd(18, '0');

  const wholeVal = BigInt(whole.replace(/,/g, '') || '0');
  const fracVal  = BigInt(fracPadded);

  return wholeVal * SCALE + fracVal;
}
