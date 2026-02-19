/**
 * Client-side LP preview utilities.
 */

export function previewDeposit(
  amount: number,
  sharePrice: number
): { sharesReceived: number; newPoolShare: number } {
  const sharesReceived = sharePrice > 0 ? amount / sharePrice : 0;
  return { sharesReceived, newPoolShare: 0 };
}

export function previewWithdraw(
  shares: number,
  sharePrice: number
): { amountReceived: number } {
  return { amountReceived: shares * sharePrice };
}

export function estimateAPY(
  swapFeePct: number,
  utilization: number,
  termDays: number
): number {
  const swapFeeBps = swapFeePct * 100;
  const utilizationFraction = utilization / 100;
  return (swapFeeBps * utilizationFraction * (365 / termDays)) / 10000;
}

export function exchangeRateClient(
  totalCollateral: number,
  totalShares: number
): number {
  if (totalShares <= 0) return 1.0;
  return totalCollateral / totalShares;
}
