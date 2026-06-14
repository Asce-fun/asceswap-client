import { type Address, type ClaimSide, type Hex, type Side } from "../protocol/order";
import {
  type EventListResponse,
  type MarketListResponse,
  type MarketDepthResponse,
  type OrderListResponse,
  type OrderStatusResponse,
  type ReservationListResponse,
  type SettlementPayload,
  type SubmitOrderOptions,
  buildSubmitOrderRequest,
  parseEventListResponse,
  parseMarketListResponse,
  parseMarketDepthResponse,
  parseOrderListResponse,
  parseOrderStatusResponse,
  parseReservationListResponse,
  parseSettlementPayload,
  parseSubmitOrderResponse,
} from "./schemas";
import type { ApiOrder } from "../protocol/order";
import type { SubmitOrderOutcome } from "./schemas";

export type OrderbookClientConfig = Readonly<{
  baseUrl: string;
  fetcher?: typeof fetch;
}>;

export type CancelOrderRequest = Readonly<{
  order_hash: Hex;
  maker?: Hex;
  signature_bytes?: Hex;
}>;

export type GetOrdersOptions = Readonly<{
  maker?: Address;
  resting?: boolean;
}>;

export type GetMarketOrdersOptions = Readonly<{
  resting?: boolean;
}>;

export type GetEventsOptions = Readonly<{
  fromSequence?: number;
  limit?: number;
}>;

export type GetReservationsOptions = Readonly<{
  orderHash?: Hex;
  status?: string;
  limit?: number;
}>;

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const DEFAULT_ORDERBOOK_BASE_URL = "https://asceswap-orderbook-production.up.railway.app";
export const ORDERBOOK_PROXY_BASE_PATH = "/api/orderbook";

export class OrderbookClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(config: OrderbookClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.fetcher = config.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  async healthz() {
    return this.fetchJson<unknown>("/healthz");
  }

  async getMarkets(): Promise<MarketListResponse> {
    const response = await this.fetchJson<unknown>("/markets");
    return parseMarketListResponse(response);
  }

  async getMarketDepth(marketId: Hex, claim: ClaimSide, side: Side): Promise<MarketDepthResponse> {
    const response = await this.fetchJson<unknown>(`/markets/${encodeURIComponent(marketId)}/depth`, {
      claim,
      side,
    });
    return parseMarketDepthResponse(response);
  }

  async getMarketOrders(marketId: Hex, options: GetMarketOrdersOptions = {}): Promise<OrderListResponse> {
    const response = await this.fetchJson<unknown>(`/markets/${encodeURIComponent(marketId)}/orders`, {
      resting: options.resting,
    });
    return parseOrderListResponse(response);
  }

  async submitSignedOrder(
    order: ApiOrder,
    signature: Hex,
    options: SubmitOrderOptions = {},
  ): Promise<SubmitOrderOutcome> {
    const response = await this.fetchJson<unknown>("/orders", undefined, {
      method: "POST",
      body: JSON.stringify(buildSubmitOrderRequest(order, signature, options)),
    });
    return parseSubmitOrderResponse(response);
  }

  async getOrders(options: GetOrdersOptions = {}): Promise<OrderListResponse> {
    const response = await this.fetchJson<unknown>("/orders", {
      maker: options.maker,
      resting: options.resting,
    });
    return parseOrderListResponse(response);
  }

  async getOrder(orderHash: Hex): Promise<OrderStatusResponse> {
    const response = await this.fetchJson<unknown>(`/orders/${encodeURIComponent(orderHash)}`);
    return parseOrderStatusResponse(response);
  }

  async cancelOrder(request: CancelOrderRequest) {
    return this.fetchJson<unknown>("/orders/cancel", undefined, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getEvents(options: GetEventsOptions = {}): Promise<EventListResponse> {
    const response = await this.fetchJson<unknown>("/events", {
      from_sequence: options.fromSequence,
      limit: options.limit,
    });
    return parseEventListResponse(response);
  }

  async getReservations(options: GetReservationsOptions = {}): Promise<ReservationListResponse> {
    const response = await this.fetchJson<unknown>("/reservations", {
      order_hash: options.orderHash,
      status: options.status,
      limit: options.limit,
    });
    return parseReservationListResponse(response);
  }

  async getReservationSettlement(reservationId: string): Promise<SettlementPayload> {
    const response = await this.fetchJson<unknown>(`/reservations/${encodeURIComponent(reservationId)}/settlement`);
    return parseSettlementPayload(response);
  }

  getWebSocketUrl() {
    const baseUrl = isAbsoluteUrl(this.baseUrl)
      ? this.baseUrl
      : `${window.location.origin}${this.baseUrl}`;
    const url = new URL(baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = joinPath(url.pathname, "/ws");
    url.search = "";
    return url.toString();
  }

  private async fetchJson<T>(path: string, search?: QueryParams, init: RequestInit = {}): Promise<T> {
    const url = buildRequestUrl(this.baseUrl, path);
    for (const [key, value] of Object.entries(search ?? {})) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }

    const response = await this.fetcher(url, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });

    if (!response.ok) {
      const detail = await readResponseText(response);
      throw new Error(`Orderbook request failed (${response.status}): ${detail || response.statusText}`);
    }

    return await response.json() as T;
  }
}

export function createOrderbookClient() {
  return new OrderbookClient({ baseUrl: ORDERBOOK_PROXY_BASE_PATH });
}

function normalizeBaseUrl(baseUrl: string) {
  if (!isAbsoluteUrl(baseUrl) && !baseUrl.startsWith("/")) {
    throw new Error("Orderbook URL must start with http:// or https://.");
  }

  return baseUrl.replace(/\/+$/, "");
}

function buildRequestUrl(baseUrl: string, path: string) {
  if (isAbsoluteUrl(baseUrl)) {
    return new URL(joinPath(baseUrl, path));
  }

  if (typeof window === "undefined") {
    throw new Error("Relative orderbook URLs require a browser origin.");
  }

  return new URL(joinPath(baseUrl, path), window.location.origin);
}

function isAbsoluteUrl(value: string) {
  return /^https?:\/\//.test(value);
}

function joinPath(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

async function readResponseText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
