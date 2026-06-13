import type { Address, ClaimSide, Hex, Side } from "../protocol/order";

export const queryKeys = {
  market: (marketId: Hex) => ["market", marketId] as const,
  depth: (marketId: Hex, claim: ClaimSide, side: Side) => ["depth", marketId, claim, side] as const,
  yesNoQuotes: (marketId: Hex) => ["yes-no-quotes", marketId] as const,
  orderbookOrder: (orderHash: Hex) => ["orderbook-order", orderHash] as const,
  indexedOrder: (orderHash: Hex) => ["indexed-order", orderHash] as const,
  userOrders: (owner: Address) => ["user-orders", owner] as const,
  userBalances: (owner: Address) => ["user-balances", owner] as const,
  userFills: (owner: Address) => ["user-fills", owner] as const,
  reservationSettlement: (reservationId: string) => ["reservation-settlement", reservationId] as const,
};
