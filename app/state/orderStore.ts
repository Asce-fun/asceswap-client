import { type ApiOrder, type Hex } from "../protocol/order";
import type { SubmitOrderOutcome } from "../orderbook/schemas";

export type PendingOrderRecord = Readonly<{
  localId: string;
  order: ApiOrder;
  signature: Hex;
  orderHash?: Hex;
  reservationId?: string;
  outcome?: SubmitOrderOutcome["outcome"];
  createdAt: number;
  updatedAt: number;
}>;

const STORAGE_KEY = "asceswap.pendingOrders.v1";

export function readPendingOrders(): readonly PendingOrderRecord[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isPendingOrderRecord) : [];
  } catch {
    return [];
  }
}

export function upsertPendingOrder(record: PendingOrderRecord) {
  if (typeof window === "undefined") return;

  const records = readPendingOrders();
  const nextRecords = [
    record,
    ...records.filter((item) => item.localId !== record.localId),
  ];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextRecords.slice(0, 100)));
}

export function removePendingOrder(localId: string) {
  if (typeof window === "undefined") return;

  const records = readPendingOrders().filter((record) => record.localId !== localId);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function pendingRecordFromSubmission(input: Readonly<{
  order: ApiOrder;
  signature: Hex;
  response?: SubmitOrderOutcome;
}>): PendingOrderRecord {
  const now = Date.now();
  const response = input.response;

  return {
    localId: input.order.salt,
    order: input.order,
    signature: input.signature,
    orderHash: response && "order_hash" in response ? response.order_hash : undefined,
    reservationId: response?.outcome === "matched" ? response.reservation_id : undefined,
    outcome: response?.outcome,
    createdAt: now,
    updatedAt: now,
  };
}

function isPendingOrderRecord(value: unknown): value is PendingOrderRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.localId === "string"
    && typeof record.order === "object"
    && typeof record.signature === "string"
    && typeof record.createdAt === "number"
    && typeof record.updatedAt === "number";
}
