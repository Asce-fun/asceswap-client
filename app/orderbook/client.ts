import { type ClaimSide, type Hex, type Side } from "../protocol/order";
import {
  type MarketDepthResponse,
  type OrderStatusResponse,
  type SettlementPayload,
  type SubmitOrderOptions,
  buildSubmitOrderRequest,
  parseMarketDepthResponse,
  parseOrderStatusResponse,
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

export class OrderbookClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(config: OrderbookClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.fetcher = config.fetcher ?? fetch;
  }

  async healthz() {
    return this.fetchJson<unknown>("/healthz");
  }

  async getMarketDepth(marketId: Hex, claim: ClaimSide, side: Side): Promise<MarketDepthResponse> {
    const response = await this.fetchJson<unknown>(`/markets/${encodeURIComponent(marketId)}/depth`, {
      claim,
      side,
    });
    return parseMarketDepthResponse(response);
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

  async getReservationSettlement(reservationId: string): Promise<SettlementPayload> {
    const response = await this.fetchJson<unknown>(`/reservations/${encodeURIComponent(reservationId)}/settlement`);
    return parseSettlementPayload(response);
  }

  getWebSocketUrl() {
    const url = new URL(this.baseUrl);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.pathname = joinPath(url.pathname, "/ws");
    url.search = "";
    return url.toString();
  }

  private async fetchJson<T>(path: string, search?: Record<string, string>, init: RequestInit = {}): Promise<T> {
    const url = new URL(joinPath(this.baseUrl, path));
    for (const [key, value] of Object.entries(search ?? {})) {
      url.searchParams.set(key, value);
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
  const baseUrl = process.env.NEXT_PUBLIC_ASCESWAP_ORDERBOOK_URL;

  if (!baseUrl) {
    throw new Error("Set NEXT_PUBLIC_ASCESWAP_ORDERBOOK_URL to submit orders or read live depth.");
  }

  return new OrderbookClient({ baseUrl });
}

function normalizeBaseUrl(baseUrl: string) {
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error("Orderbook URL must start with http:// or https://.");
  }

  return baseUrl.replace(/\/+$/, "");
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
