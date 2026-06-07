import { type Address, type Hex } from "../protocol/order";

export type IndexerClientConfig = Readonly<{
  baseUrl: string;
  fetcher?: typeof fetch;
}>;

export type IndexedMarket = Readonly<{
  market_id: Hex;
  title?: string;
  status?: string;
  metadata?: unknown;
}>;

export type IndexedOrder = Readonly<{
  order_hash: Hex;
  status: "open" | "filled" | "cancelled" | "inactive" | "unknown";
  filled_claim_amount?: string;
  remaining_claim_amount?: string;
  updated_at?: string;
}>;

export type IndexedFill = Readonly<{
  trade_id: string;
  order_hash?: Hex;
  market_id: Hex;
  claim_amount: string;
  collateral_amount: string;
  transaction_hash: Hex;
  block_number?: number;
  timestamp?: string;
}>;

export type IndexedBalance = Readonly<{
  owner: Address;
  asset: Hex;
  amount: string;
}>;

export class IndexerClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(config: IndexerClientConfig) {
    this.baseUrl = normalizeBaseUrl(config.baseUrl);
    this.fetcher = config.fetcher ?? fetch;
  }

  async getMarket(marketId: Hex): Promise<IndexedMarket> {
    return this.fetchJson<IndexedMarket>(`/markets/${encodeURIComponent(marketId)}`);
  }

  async getUserBalances(owner: Address): Promise<readonly IndexedBalance[]> {
    return this.fetchJson<readonly IndexedBalance[]>(`/users/${encodeURIComponent(owner)}/balances`);
  }

  async getUserOrders(owner: Address): Promise<readonly IndexedOrder[]> {
    return this.fetchJson<readonly IndexedOrder[]>(`/users/${encodeURIComponent(owner)}/orders`);
  }

  async getOrder(orderHash: Hex): Promise<IndexedOrder> {
    return this.fetchJson<IndexedOrder>(`/orders/${encodeURIComponent(orderHash)}`);
  }

  async getUserFills(owner: Address): Promise<readonly IndexedFill[]> {
    return this.fetchJson<readonly IndexedFill[]>(`/users/${encodeURIComponent(owner)}/fills`);
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}/${path.replace(/^\/+/, "")}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const detail = await readResponseText(response);
      throw new Error(`Indexer request failed (${response.status}): ${detail || response.statusText}`);
    }

    return await response.json() as T;
  }
}

export function createIndexerClient() {
  const baseUrl = process.env.NEXT_PUBLIC_ASCESWAP_INDEXER_URL;

  if (!baseUrl) {
    throw new Error("Set NEXT_PUBLIC_ASCESWAP_INDEXER_URL to read confirmed balances, orders, and fills.");
  }

  return new IndexerClient({ baseUrl });
}

function normalizeBaseUrl(baseUrl: string) {
  if (!/^https?:\/\//.test(baseUrl)) {
    throw new Error("Indexer URL must start with http:// or https://.");
  }

  return baseUrl.replace(/\/+$/, "");
}

async function readResponseText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}
