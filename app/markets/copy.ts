export function formatUsd(value: number): string {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatContracts(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export interface DealInput {
  side: "buy" | "sell";
  /** Per-market settlement condition, e.g. "borrow APR finishes above 12%". */
  condition: string;
  /** User input: USDC for buys, contracts for sells. */
  amount: number;
  priceLabel: string;
  /** Entry price in dollars per contract, e.g. 0.34 for "34c". */
  entryPrice: number;
}

export function dealSentence({ side, condition, amount, priceLabel, entryPrice }: DealInput): string {
  if (!Number.isFinite(amount) || amount <= 0 || entryPrice <= 0) return "";

  if (side === "buy") {
    const payout = amount / entryPrice;
    return `Pay ${formatUsd(amount)} now. If ${condition}, you collect ${formatUsd(payout)}.`;
  }

  const proceeds = amount * entryPrice;
  return `Sell ${formatContracts(amount)} contracts at ${priceLabel} — you receive ${formatUsd(proceeds)} now.`;
}
