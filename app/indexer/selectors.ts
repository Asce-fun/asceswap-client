import type { IndexedBalance, IndexedFill, IndexedOrder } from "./client";

export function selectOpenOrders(orders: readonly IndexedOrder[]) {
  return orders.filter((order) => order.status === "open");
}

export function selectConfirmedActivity(fills: readonly IndexedFill[]) {
  return [...fills].sort((a, b) => Number(b.block_number ?? 0) - Number(a.block_number ?? 0));
}

export function indexBalancesByAsset(balances: readonly IndexedBalance[]) {
  return new Map(balances.map((balance) => [balance.asset.toLowerCase(), balance]));
}
