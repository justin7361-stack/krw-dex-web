// ─── JSON BigInt Reviver ──────────────────────────────────────────────────────
// Server serializes all numeric fields as strings (JSON cannot represent bigint).
// Use this reviver in ALL JSON.parse calls that receive server data.
//
// Usage:
//   const data = JSON.parse(responseText, bigintReviver) as MyType;

const BIGINT_KEYS = new Set([
  'price',
  'amount',
  'nonce',
  'expiry',
  'triggerPrice',
  'goodTillTime',
  'leverage',
  'filledAmount',
  'open',
  'high',
  'low',
  'close',
  'volume',
  'markPrice',
  'indexPrice',
  'tickSize',
  'lotSize',
  'minOrderSize',
  'maxOrderSize',
  'margin',
  'size',
  'entryPrice',
  'liquidationPrice',
  'unrealizedPnl',
  'fundingRate',
  'balance',
  'totalBalance',
  'freeMargin',
]);

/**
 * JSON.parse reviver that converts numeric string fields to bigint.
 * Numeric fields in the HyperKRW server API are scaled by 1e18 and
 * serialized as strings to avoid JavaScript number precision loss.
 */
export function bigintReviver(key: string, value: unknown): unknown {
  if (typeof value === 'string' && BIGINT_KEYS.has(key)) {
    try {
      return BigInt(value);
    } catch {
      // Not a valid BigInt string — return as-is
      return value;
    }
  }
  return value;
}
