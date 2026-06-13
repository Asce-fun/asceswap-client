import { ratioWad } from "../protocol/amounts";
import { type ClaimSide, WAD } from "../protocol/order";
import type { MarketDepthResponse } from "./schemas";

export type Quote = Readonly<{
  priceWad: bigint;
  claimAmount: bigint;
  collateralAmount?: bigint;
}>;

export type YesNoQuoteView = Readonly<{
  yesBid?: Quote;
  yesAsk?: Quote;
  noBid?: Quote;
  noAsk?: Quote;
}>;

export function getBestQuote(depth: MarketDepthResponse): Quote | undefined {
  const [level] = depth.levels;
  if (!level) return undefined;

  const claimAmount = BigInt(level.claim_amount);
  const collateralAmount = level.collateral_amount ? BigInt(level.collateral_amount) : undefined;
  const priceWad = parseDepthPrice(level.price, claimAmount, collateralAmount);

  return { priceWad, claimAmount, collateralAmount };
}

export function selectYesNoQuotes(depths: readonly MarketDepthResponse[]): YesNoQuoteView {
  const findDepth = (claim: ClaimSide, side: "buy" | "sell") =>
    depths.find((depth) => depth.claim === claim && depth.side === side);

  return {
    yesBid: maybeBest(findDepth("payoff", "buy")),
    yesAsk: maybeBest(findDepth("payoff", "sell")),
    noBid: maybeBest(findDepth("residual", "buy")),
    noAsk: maybeBest(findDepth("residual", "sell")),
  };
}

export function aggregateDepth(levels: readonly Quote[]) {
  let totalClaimAmount = 0n;
  let totalCollateralAmount = 0n;

  for (const level of levels) {
    totalClaimAmount += level.claimAmount;
    totalCollateralAmount += level.collateralAmount ?? (level.claimAmount * level.priceWad) / WAD;
  }

  return {
    totalClaimAmount,
    totalCollateralAmount,
    averagePriceWad: totalClaimAmount > 0n ? ratioWad(totalCollateralAmount, totalClaimAmount) : 0n,
  };
}

function maybeBest(depth: MarketDepthResponse | undefined) {
  return depth ? getBestQuote(depth) : undefined;
}

function parseDepthPrice(price: string, claimAmount: bigint, collateralAmount: bigint | undefined) {
  if (/^\d+$/.test(price)) {
    return BigInt(price);
  }

  if (price.endsWith("c")) {
    const cents = price.slice(0, -1);
    const [whole, fraction = ""] = cents.split(".");
    const paddedFraction = fraction.padEnd(18, "0").slice(0, 18);
    return (BigInt(whole || "0") * WAD + BigInt(paddedFraction || "0")) / 100n;
  }

  if (collateralAmount !== undefined && claimAmount > 0n) {
    return ratioWad(collateralAmount, claimAmount);
  }

  throw new Error(`Unsupported depth price: ${price}`);
}
