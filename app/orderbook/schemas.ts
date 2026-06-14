import {
  type Address,
  type ApiOrder,
  type ClaimSide,
  type Hex,
  type Side,
  isAddress,
  isBytes32,
  isHex,
} from "../protocol/order";

export type SignatureValidationState = "unchecked" | "valid" | "invalid";

export type SubmitOrderValidation = Readonly<{
  now: number;
  expected_order_hash?: Hex;
  filled_claim_amount: string;
  cancelled: boolean;
  maker_epoch: string;
  fee_rate_bps: number;
  signature: SignatureValidationState;
  require_signature: boolean;
}>;

export type SubmitOrderRequest = Readonly<{
  order: ApiOrder;
  validation: SubmitOrderValidation;
  signature_bytes: Hex;
  post_only: boolean;
  rest_on_no_match: boolean;
  reservation_ttl_secs: number;
}>;

export type SubmitOrderOptions = Readonly<{
  postOnly?: boolean;
  restOnNoMatch?: boolean;
  reservationTtlSecs?: number;
  expectedOrderHash?: Hex;
  filledClaimAmount?: string;
  cancelled?: boolean;
  makerEpoch?: string;
  feeRateBps?: number;
}>;

export type SubmitOrderOutcome =
  | Readonly<{ outcome: "rejected"; reason: string; order_hash?: Hex }>
  | Readonly<{ outcome: "rested"; order_hash: Hex; resting_claim_amount?: string }>
  | Readonly<{ outcome: "post_only_would_cross"; reason?: string; order_hash?: Hex }>
  | Readonly<{ outcome: "inactive"; order_hash?: Hex; reason?: string }>
  | Readonly<{
      outcome: "matched";
      order_hash?: Hex;
      reservation_id: string;
      match_kind?: string;
      maker_count: number;
      taker_claim_fill_amount: string;
      settlement?: SettlementPayload;
    }>;

export type DepthLevel = Readonly<{
  price: string;
  claim_amount: string;
  collateral_amount?: string;
  order_count?: number;
}>;

export type MarketRecord = Readonly<Record<string, unknown>>;

export type MarketDepthResponse = Readonly<{
  market_id: Hex;
  claim: ClaimSide;
  side: Side;
  sequence?: number;
  levels: readonly DepthLevel[];
}>;

export type MarketListResponse = Readonly<{
  markets: readonly MarketRecord[];
  sequence?: number;
}>;

export type OrderbookOrderStatus = "open" | "filled" | "cancelled" | "inactive" | "rejected" | "settled" | "unknown";

export type OrderbookOrder = Readonly<{
  order_hash?: Hex;
  status: OrderbookOrderStatus;
  order: ApiOrder;
  filled_claim_amount?: string;
  remaining_claim_amount?: string;
  resting_claim_amount?: string;
  reservation_id?: string;
  sequence?: number;
}>;

export type OrderListResponse = Readonly<{
  orders: readonly OrderbookOrder[];
  sequence?: number;
}>;

export type OrderStatusResponse = Readonly<{
  order_hash: Hex;
  status: OrderbookOrderStatus;
  order?: ApiOrder;
  filled_claim_amount?: string;
  remaining_claim_amount?: string;
  reservation_id?: string;
}>;

export type SettlementPayload = Readonly<{
  to?: Hex;
  data?: Hex;
  value?: string;
  taker_order?: ApiOrder;
  taker_signature?: Hex;
  maker_orders?: readonly ApiOrder[];
  maker_signatures?: readonly Hex[];
  taker_claim_fill_amount?: string;
  maker_claim_fill_amounts?: readonly string[];
}>;

export type ReservationRecord = Readonly<{
  reservation_id: string;
  status?: string;
  order_hash?: Hex;
  market_id?: Hex;
  tx_hash?: Hex;
  sequence?: number;
  payload?: unknown;
}>;

export type ReservationListResponse = Readonly<{
  reservations: readonly ReservationRecord[];
  sequence?: number;
}>;

export type ApiEvent = Readonly<{
  sequence: number;
  kind: string;
  /** Backward-compatible alias for older consumers that used `type`. */
  type: string;
  order_hash?: Hex;
  reservation_id?: string;
  market_id?: Hex;
  tx_hash?: Hex;
  payload?: unknown;
}>;

export type EventListResponse = Readonly<{
  events: readonly ApiEvent[];
  sequence?: number;
}>;

export function buildSubmitOrderRequest(
  order: ApiOrder,
  signature: Hex,
  options: SubmitOrderOptions = {},
): SubmitOrderRequest {
  return {
    order,
    validation: {
      now: Math.floor(Date.now() / 1000),
      ...(options.expectedOrderHash ? { expected_order_hash: options.expectedOrderHash } : {}),
      filled_claim_amount: options.filledClaimAmount ?? "0",
      cancelled: options.cancelled ?? false,
      maker_epoch: options.makerEpoch ?? order.epoch,
      fee_rate_bps: options.feeRateBps ?? order.max_fee_rate_bps,
      signature: "unchecked",
      require_signature: true,
    },
    signature_bytes: signature,
    post_only: options.postOnly ?? false,
    rest_on_no_match: options.restOnNoMatch ?? true,
    reservation_ttl_secs: options.reservationTtlSecs ?? 300,
  };
}

export function parseSubmitOrderResponse(value: unknown): SubmitOrderOutcome {
  const record = requireRecord(value, "submit order response");
  const outcomeRecord = getOptionalRecord(record, "outcome") ?? record;
  const outcome = readOutcome(outcomeRecord);
  const orderHash = readOptionalHex(record, "order_hash") ?? readOptionalHex(outcomeRecord, "order_hash");

  if (outcome === "rejected") {
    return { outcome, reason: readOptionalString(outcomeRecord, "reason") ?? "Order rejected.", order_hash: orderHash };
  }

  if (outcome === "rested") {
    const hash = orderHash ?? readHex(outcomeRecord, "hash");
    return {
      outcome,
      order_hash: hash,
      resting_claim_amount: readOptionalString(outcomeRecord, "resting_claim_amount"),
    };
  }

  if (outcome === "post_only_would_cross") {
    return { outcome, reason: readOptionalString(outcomeRecord, "reason"), order_hash: orderHash };
  }

  if (outcome === "inactive") {
    return { outcome, reason: readOptionalString(outcomeRecord, "reason"), order_hash: orderHash };
  }

  return {
    outcome,
    order_hash: orderHash,
    reservation_id: readString(outcomeRecord, "reservation_id"),
    match_kind: readOptionalString(outcomeRecord, "match_kind"),
    maker_count: readOptionalNumber(outcomeRecord, "maker_count") ?? 0,
    taker_claim_fill_amount: readOptionalString(outcomeRecord, "taker_claim_fill_amount") ?? "0",
    settlement: parseOptionalSettlement(outcomeRecord.settlement),
  };
}

export function parseMarketDepthResponse(value: unknown): MarketDepthResponse {
  const record = requireRecord(value, "market depth response");
  const marketId = readHex(record, "market_id");
  const claim = readClaim(record, "claim");
  const side = readSide(record, "side");
  const levelsValue = Array.isArray(record.levels) ? record.levels : [];

  return {
    market_id: marketId,
    claim,
    side,
    sequence: readOptionalNumber(record, "sequence"),
    levels: levelsValue.map(parseDepthLevel),
  };
}

export function parseMarketListResponse(value: unknown): MarketListResponse {
  const record = Array.isArray(value) ? undefined : requireRecord(value, "market list response");
  const marketsValue = readListPayload(value, "market list response", ["markets", "items", "data"]);

  return {
    markets: marketsValue.map((item) => requireRecord(item, "market record")),
    sequence: record ? readOptionalNumber(record, "sequence") : undefined,
  };
}

export function parseOrderListResponse(value: unknown): OrderListResponse {
  const record = Array.isArray(value) ? undefined : requireRecord(value, "order list response");
  const ordersValue = readListPayload(value, "order list response", ["orders", "items", "data"]);

  return {
    orders: ordersValue.map(parseOrderbookOrder),
    sequence: record ? readOptionalNumber(record, "sequence") : undefined,
  };
}

export function parseOrderStatusResponse(value: unknown): OrderStatusResponse {
  const record = requireRecord(value, "order status response");
  const status = readOptionalString(record, "state")
    ?? readOptionalString(record, "status")
    ?? "unknown";
  const orderHash = readOptionalHex(record, "order_hash") ?? readOptionalHex(record, "hash");

  if (!orderHash) {
    throw new Error("Missing order hash in order status response.");
  }

  return {
    order_hash: orderHash,
    status: isOrderStatus(status) ? status : "unknown",
    order: record.order ? parseApiOrder(record.order) : undefined,
    filled_claim_amount: readOptionalString(record, "filled_claim_amount"),
    remaining_claim_amount: readOptionalString(record, "remaining_claim_amount"),
    reservation_id: readOptionalString(record, "reservation_id"),
  };
}

export function parseSettlementPayload(value: unknown): SettlementPayload {
  const record = requireRecord(value, "settlement payload");
  return {
    to: readOptionalHex(record, "to"),
    data: readOptionalHex(record, "data"),
    value: readOptionalString(record, "value"),
    taker_order: record.taker_order ? parseApiOrder(record.taker_order) : undefined,
    taker_signature: readOptionalHex(record, "taker_signature"),
    maker_orders: readOptionalOrderArray(record, "maker_orders"),
    maker_signatures: readOptionalHexArray(record, "maker_signatures"),
    taker_claim_fill_amount: readOptionalString(record, "taker_claim_fill_amount"),
    maker_claim_fill_amounts: readOptionalStringArray(record, "maker_claim_fill_amounts"),
  };
}

export function parseReservationListResponse(value: unknown): ReservationListResponse {
  const record = Array.isArray(value) ? undefined : requireRecord(value, "reservation list response");
  const reservationsValue = readListPayload(value, "reservation list response", ["reservations", "items", "data"]);

  return {
    reservations: reservationsValue.map(parseReservationRecord),
    sequence: record ? readOptionalNumber(record, "sequence") : undefined,
  };
}

export function parseEventListResponse(value: unknown): EventListResponse {
  const record = Array.isArray(value) ? undefined : requireRecord(value, "event list response");
  const eventsValue = readListPayload(value, "event list response", ["events", "items", "data"]);

  return {
    events: eventsValue.map(parseApiEvent),
    sequence: record ? readOptionalNumber(record, "sequence") : undefined,
  };
}

export function parseApiEvent(value: unknown): ApiEvent {
  const record = requireRecord(value, "api event");
  const kind = readOptionalString(record, "kind") ?? readOptionalString(record, "type") ?? "unknown";

  return {
    sequence: readOptionalNumber(record, "sequence") ?? 0,
    kind,
    type: kind,
    order_hash: readOptionalHex(record, "order_hash"),
    reservation_id: readOptionalString(record, "reservation_id"),
    market_id: readOptionalHex(record, "market_id"),
    tx_hash: readOptionalHex(record, "tx_hash"),
    payload: record.payload,
  };
}

export function parseApiOrder(value: unknown): ApiOrder {
  const record = requireRecord(value, "api order");
  const maker = readString(record, "maker");
  const marketId = readString(record, "market_id");

  if (!isAddress(maker)) {
    throw new Error("Invalid address field: maker");
  }

  if (!isBytes32(marketId)) {
    throw new Error("Invalid bytes32 field: market_id");
  }

  return {
    salt: readString(record, "salt"),
    maker: maker as Address,
    market_id: marketId as Hex,
    claim: readClaim(record, "claim"),
    maker_amount: readString(record, "maker_amount"),
    taker_amount: readString(record, "taker_amount"),
    side: readSide(record, "side"),
    expiration: readString(record, "expiration"),
    epoch: readString(record, "epoch"),
    max_fee_rate_bps: readNumber(record, "max_fee_rate_bps"),
  };
}

function parseDepthLevel(value: unknown): DepthLevel {
  const record = requireRecord(value, "depth level");

  return {
    price: readString(record, "price"),
    claim_amount: readOptionalString(record, "claim_amount") ?? readOptionalString(record, "size") ?? "0",
    collateral_amount: readOptionalString(record, "collateral_amount"),
    order_count: readOptionalNumber(record, "order_count"),
  };
}

function parseOrderbookOrder(value: unknown): OrderbookOrder {
  const record = requireRecord(value, "order record");
  const status = readOptionalString(record, "state")
    ?? readOptionalString(record, "status")
    ?? "unknown";

  return {
    order_hash: readOptionalHex(record, "order_hash") ?? readOptionalHex(record, "hash"),
    status: isOrderStatus(status) ? status : "unknown",
    order: parseApiOrder(record.order ?? record),
    filled_claim_amount: readOptionalString(record, "filled_claim_amount"),
    remaining_claim_amount: readOptionalString(record, "remaining_claim_amount"),
    resting_claim_amount: readOptionalString(record, "resting_claim_amount"),
    reservation_id: readOptionalString(record, "reservation_id"),
    sequence: readOptionalNumber(record, "sequence"),
  };
}

function parseReservationRecord(value: unknown): ReservationRecord {
  const record = requireRecord(value, "reservation record");
  const reservationId = readOptionalString(record, "reservation_id") ?? readOptionalString(record, "id");

  if (!reservationId) {
    throw new Error("Missing reservation id.");
  }

  return {
    reservation_id: reservationId,
    status: readOptionalString(record, "status"),
    order_hash: readOptionalHex(record, "order_hash"),
    market_id: readOptionalHex(record, "market_id"),
    tx_hash: readOptionalHex(record, "tx_hash"),
    sequence: readOptionalNumber(record, "sequence"),
    payload: record.payload,
  };
}

function parseOptionalSettlement(value: unknown) {
  if (value === undefined || value === null) return undefined;
  return parseSettlementPayload(value);
}

function readOutcome(record: Record<string, unknown>): SubmitOrderOutcome["outcome"] {
  const rawOutcome = readOptionalString(record, "type")
    ?? readOptionalString(record, "outcome")
    ?? readOptionalString(record, "status")
    ?? readOptionalString(record, "result");

  if (
    rawOutcome === "rejected"
    || rawOutcome === "rested"
    || rawOutcome === "post_only_would_cross"
    || rawOutcome === "inactive"
    || rawOutcome === "matched"
  ) {
    return rawOutcome;
  }

  throw new Error(`Unsupported orderbook outcome: ${String(rawOutcome)}`);
}

function readClaim(record: Record<string, unknown>, key: string): ClaimSide {
  const value = readString(record, key);
  if (value === "payoff" || value === "residual") return value;
  throw new Error(`Invalid claim side: ${value}`);
}

function readSide(record: Record<string, unknown>, key: string): Side {
  const value = readString(record, key);
  if (value === "buy" || value === "sell") return value;
  throw new Error(`Invalid side: ${value}`);
}

function isOrderStatus(value: string): value is OrderStatusResponse["status"] {
  return value === "open"
    || value === "filled"
    || value === "cancelled"
    || value === "inactive"
    || value === "rejected"
    || value === "settled"
    || value === "unknown";
}

function readListPayload(value: unknown, label: string, keys: readonly string[]) {
  if (Array.isArray(value)) return value;

  const record = requireRecord(value, label);
  for (const key of keys) {
    const item = record[key];
    if (Array.isArray(item)) return item;
  }

  throw new Error(`Missing list field in ${label}.`);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid ${label}.`);
  }

  return value as Record<string, unknown>;
}

function getOptionalRecord(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing string field: ${key}`);
  }

  return value;
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  throw new Error(`Missing number field: ${key}`);
}

function readOptionalString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" && value ? value : undefined;
}

function readHex(record: Record<string, unknown>, key: string): Hex {
  const value = readString(record, key);
  if (!isHex(value)) {
    throw new Error(`Invalid hex field: ${key}`);
  }

  return value;
}

function readOptionalHex(record: Record<string, unknown>, key: string): Hex | undefined {
  const value = readOptionalString(record, key);
  if (!value) return undefined;

  if (!isHex(value)) {
    throw new Error(`Invalid hex field: ${key}`);
  }

  if (key.endsWith("hash") && !isBytes32(value)) {
    throw new Error(`Invalid bytes32 field: ${key}`);
  }

  return value;
}

function readOptionalNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readOptionalStringArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;

  return value.filter((item): item is string => typeof item === "string");
}

function readOptionalHexArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;

  return value.filter((item): item is Hex => typeof item === "string" && isHex(item));
}

function readOptionalOrderArray(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;

  return value.map(parseApiOrder);
}
