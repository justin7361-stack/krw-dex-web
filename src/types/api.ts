// ─── Server API Response Types ────────────────────────────────────────────────
// These types mirror krw-dex-server/src/types/order.ts
// All numeric fields are bigint (converted from string by bigintReviver)

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market' | 'stop_limit';
export type OrderStatus = 'open' | 'filled' | 'cancelled' | 'partially_filled' | 'expired';
export type TimeInForce = 'GTC' | 'IOC' | 'FOK' | 'GTT';
export type StpMode = 'EXPIRE_TAKER' | 'EXPIRE_MAKER' | 'EXPIRE_BOTH';
export type MarginMode = 'cross' | 'isolated';

// ─── Order types ─────────────────────────────────────────────────────────────

export interface Order {
  orderId:       string;
  maker:         string;
  pairId:        string;
  side:          OrderSide;
  type:          OrderType;
  price:         bigint;
  amount:        bigint;
  filledAmount:  bigint;
  status:        OrderStatus;
  timeInForce:   TimeInForce;
  nonce:         bigint;
  expiry:        bigint;
  leverage:      bigint;
  marginMode:    MarginMode;
  stpMode:       StpMode;
  createdAt:     number;
  updatedAt:     number;
}

export interface SubmitOrderRequest {
  maker:      string;
  taker:      string;
  baseToken:  string;
  quoteToken: string;
  price:      string;   // bigint as string
  amount:     string;   // bigint as string
  isBuy:      boolean;
  nonce:      string;   // bigint as string
  expiry:     string;   // bigint as string
  signature:  string;
  // Optional metadata
  leverage?:    string;
  marginMode?:  MarginMode;
  timeInForce?: TimeInForce;
  stpMode?:     StpMode;
}

export interface SubmitOrderResponse {
  orderId: string;
  status:  OrderStatus;
}

// ─── Orderbook types ──────────────────────────────────────────────────────────

export interface PriceLevel {
  price:    bigint;
  amount:   bigint;
  total:    bigint;   // cumulative, for depth display
}

export interface OrderbookSnapshot {
  pairId: string;
  bids:   PriceLevel[];
  asks:   PriceLevel[];
  ts:     number;
}

// ─── Trade types ──────────────────────────────────────────────────────────────

export interface Trade {
  tradeId:   string;
  pairId:    string;
  price:     bigint;
  amount:    bigint;
  side:      OrderSide;
  timestamp: number;
}

// ─── Candle types ─────────────────────────────────────────────────────────────

export type CandleResolution = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export interface Candle {
  time:   number;   // Unix timestamp (seconds)
  open:   bigint;
  high:   bigint;
  low:    bigint;
  close:  bigint;
  volume: bigint;
}

// ─── Position types ───────────────────────────────────────────────────────────

export interface Position {
  maker:            string;
  pairId:           string;
  size:             bigint;  // positive = long, negative = short
  margin:           bigint;
  entryPrice:       bigint;
  liquidationPrice: bigint;
  unrealizedPnl:    bigint;
  marginMode:       MarginMode;
  leverage:         bigint;
}

// ─── Funding rate types ───────────────────────────────────────────────────────

export interface FundingRate {
  pairId:      string;
  rate:        bigint;   // scaled by 1e18
  markPrice:   bigint;
  indexPrice:  bigint;
  nextFundingAt: number;
}

// ─── Pair types ───────────────────────────────────────────────────────────────

export interface Pair {
  pairId:       string;
  baseToken:    string;
  quoteToken:   string;
  baseSymbol:   string;
  quoteSymbol:  string;
  active:       boolean;
  tickSize:     bigint;
  lotSize:      bigint;
  minOrderSize: bigint;
  maxOrderSize: bigint;
}

// ─── WebSocket message types ──────────────────────────────────────────────────

export type WsMessageType =
  | 'orderbook.snapshot'
  | 'orderbook.update'
  | 'trades.recent'
  | 'order.status'
  | 'markprice.update'
  | 'funding.update'
  | 'ping'
  | 'pong';

export interface WsMessage<T = unknown> {
  type:   WsMessageType;
  pairId?: string;
  data:   T;
  ts:     number;
}

export type WsOrderbookSnapshot = WsMessage<OrderbookSnapshot>;
export type WsTradesUpdate      = WsMessage<Trade[]>;
export type WsOrderStatus       = WsMessage<{ orderId: string; status: OrderStatus }>;

// ─── Mark price & funding WS payload types ────────────────────────────────────
// Note: markPrice/indexPrice/rate fields are strings on the wire but are
// converted to bigint by bigintReviver in JSON.parse (useWebSocket.ts).
// The string type here documents the wire format; handlers cast as needed.

export interface WsMarkPriceData {
  pairId:     string;
  markPrice:  string;   // bigint as string (converted by reviver at runtime)
  indexPrice: string;   // bigint as string (converted by reviver at runtime)
  ts:         number;
}

export interface WsFundingData {
  pairId:        string;
  rate:          string;   // bigint as string, scaled 1e18 (converted by reviver)
  markPrice:     string;   // bigint as string (converted by reviver at runtime)
  indexPrice:    string;   // bigint as string (converted by reviver at runtime)
  nextFundingAt: number;
  ts:            number;
}

export type WsMarkPriceUpdate = WsMessage<WsMarkPriceData>;
export type WsFundingUpdate   = WsMessage<WsFundingData>;
