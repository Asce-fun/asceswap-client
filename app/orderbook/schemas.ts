import {
  type ApiOrder,
  type ClaimSide,
  type Hex,
  type Side,
  isBytes32,
  isHex,
} from "../protocol/order";

export type SignatureValidationState = "unchecked" | "valid" | "invalid";

export type SubmitOrderValidation = Readonly<{
  now: number;
  expected_order_hash: Hex;
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

export type MarketDepthResponse = Readonly<{
  market_id: Hex;
  claim: ClaimSide;
  side: Side;
  sequence?: number;
  levels: readonly DepthLevel[];
}>;

export type OrderStatusResponse = Readonly<{
  order_hash: Hex;
  status: "open" | "filled" | "cancelled" | "inactive" | "unknown";
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

export type ApiEvent = Readonly<{
  sequence: number;
  type: string;
  order_hash?: Hex;
  reservation_id?: string;
  market_id?: Hex;
  payload?: unknown;
}>;

export const ZERO_BYTES32 = `0x${"0".repeat(64)}` as Hex;

export function buildSubmitOrderRequest(
  order: ApiOrder,
  signature: Hex,
  options: SubmitOrderOptions = {},
): SubmitOrderRequest {
  return {
    order,
    validation: {
      now: Math.floor(Date.now() / 1000),
      expected_order_hash: options.expectedOrderHash ?? ZERO_BYTES32,
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
    reservation_ttl_secs: options.reservationTtlSecs ?? 10,
  };
}

export function parseSubmitOrderResponse(value: unknown): SubmitOrderOutcome {
  const record = requireRecord(value, "submit order response");
  const outcome = readOutcome(record);
  const orderHash = readOptionalHex(record, "order_hash");

  if (outcome === "rejected") {
    return { outcome, reason: readOptionalString(record, "reason") ?? "Order rejected.", order_hash: orderHash };
  }

  if (outcome === "rested") {
    const hash = orderHash ?? readHex(record, "hash");
    return {
      outcome,
      order_hash: hash,
      resting_claim_amount: readOptionalString(record, "resting_claim_amount"),
    };
  }

  if (outcome === "post_only_would_cross") {
    return { outcome, reason: readOptionalString(record, "reason"), order_hash: orderHash };
  }

  if (outcome === "inactive") {
    return { outcome, reason: readOptionalString(record, "reason"), order_hash: orderHash };
  }

  return {
    outcome,
    order_hash: orderHash,
    reservation_id: readString(record, "reservation_id"),
    match_kind: readOptionalString(record, "match_kind"),
    maker_count: readOptionalNumber(record, "maker_count") ?? 0,
    taker_claim_fill_amount: readOptionalString(record, "taker_claim_fill_amount") ?? "0",
    settlement: parseOptionalSettlement(record.settlement),
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

export function parseOrderStatusResponse(value: unknown): OrderStatusResponse {
  const record = requireRecord(value, "order status response");
  const status = readOptionalString(record, "status") ?? "unknown";

  return {
    order_hash: readHex(record, "order_hash"),
    status: isOrderStatus(status) ? status : "unknown",
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
    taker_claim_fill_amount: readOptionalString(record, "taker_claim_fill_amount"),
    maker_claim_fill_amounts: readOptionalStringArray(record, "maker_claim_fill_amounts"),
  };
}

export function parseApiEvent(value: unknown): ApiEvent {
  const record = requireRecord(value, "api event");

  return {
    sequence: readOptionalNumber(record, "sequence") ?? 0,
    type: readOptionalString(record, "type") ?? "unknown",
    order_hash: readOptionalHex(record, "order_hash"),
    reservation_id: readOptionalString(record, "reservation_id"),
    market_id: readOptionalHex(record, "market_id"),
    payload: record.payload,
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

function parseOptionalSettlement(value: unknown) {
  if (value === undefined || value === null) return undefined;
  return parseSettlementPayload(value);
}

function readOutcome(record: Record<string, unknown>): SubmitOrderOutcome["outcome"] {
  const rawOutcome = readOptionalString(record, "outcome")
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
  return value === "open" || value === "filled" || value === "cancelled" || value === "inactive" || value === "unknown";
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid ${label}.`);
  }

  return value as Record<string, unknown>;
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing string field: ${key}`);
  }

  return value;
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
