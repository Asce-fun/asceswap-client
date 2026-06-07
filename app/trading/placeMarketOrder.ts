import { applySlippage, ratioWad } from "../protocol/amounts";
import { type Outcome, type Side, WAD, marketIdToBytes32, isBytes32 } from "../protocol/order";
import type { OrderbookClient } from "../orderbook/client";
import { getBestQuote, type Quote } from "../orderbook/depth";
import type { SubmitOrderOptions } from "../orderbook/schemas";
import type { AsceSwapTypedDataDomain } from "../protocol/eip712";
import type { BuildOrderInput } from "./buildOrder";
import { placeLimitOrder, type OrderSubmission, type TypedDataSigner } from "./placeLimitOrder";

export type MarketOrderSimulation = Readonly<{
  filledClaimAmount: bigint;
  collateralAmount: bigint;
  averagePriceWad: bigint;
  worstAcceptablePriceWad: bigint;
  fullyFilled: boolean;
  priceImpactBps: bigint;
}>;

export function simulateMarketOrder(input: Readonly<{
  levels: readonly Quote[];
  side: Side;
  claimAmount: bigint;
  slippageBps: bigint;
}>): MarketOrderSimulation {
  let remaining = input.claimAmount;
  let filledClaimAmount = 0n;
  let collateralAmount = 0n;
  const topPrice = input.levels[0]?.priceWad ?? 0n;

  for (const level of input.levels) {
    if (remaining <= 0n) break;

    const fillClaimAmount = level.claimAmount < remaining ? level.claimAmount : remaining;
    const fillCollateralAmount = input.side === "buy"
      ? roundUpDiv(fillClaimAmount * level.priceWad, WAD)
      : (fillClaimAmount * level.priceWad) / WAD;

    filledClaimAmount += fillClaimAmount;
    collateralAmount += fillCollateralAmount;
    remaining -= fillClaimAmount;
  }

  const averagePriceWad = filledClaimAmount > 0n ? ratioWad(collateralAmount, filledClaimAmount) : 0n;
  const priceImpactBps = topPrice > 0n && averagePriceWad > 0n
    ? ((absoluteDiff(averagePriceWad, topPrice) * 10_000n) / topPrice)
    : 0n;

  return {
    filledClaimAmount,
    collateralAmount,
    averagePriceWad,
    worstAcceptablePriceWad: applySlippage(
      averagePriceWad,
      input.slippageBps,
      input.side === "buy" ? "up" : "down",
    ),
    fullyFilled: remaining === 0n,
    priceImpactBps,
  };
}

export async function placeMarketOrder(input: Readonly<{
  baseOrderInput: Omit<BuildOrderInput, "priceWad" | "outcome">;
  outcome: Outcome;
  domain: AsceSwapTypedDataDomain;
  signer: TypedDataSigner;
  orderbookClient: OrderbookClient;
  slippageBps: bigint;
  submitOptions?: SubmitOrderOptions;
}>): Promise<OrderSubmission & Readonly<{ simulation: MarketOrderSimulation }>> {
  const depthSide = input.baseOrderInput.side === "buy" ? "sell" : "buy";
  const marketId = isBytes32(input.baseOrderInput.marketId)
    ? input.baseOrderInput.marketId
    : marketIdToBytes32(input.baseOrderInput.marketId);
  const depth = await input.orderbookClient.getMarketDepth(
    marketId,
    input.outcome === "yes" ? "payoff" : "residual",
    depthSide,
  );
  const levels = depth.levels.map((level) => getBestQuote({ ...depth, levels: [level] })).filter(isQuote);
  const simulation = simulateMarketOrder({
    levels,
    side: input.baseOrderInput.side,
    claimAmount: input.baseOrderInput.claimAmount,
    slippageBps: input.slippageBps,
  });

  if (!simulation.fullyFilled) {
    throw new Error("Insufficient orderbook liquidity for the requested market order.");
  }

  const submission = await placeLimitOrder({
    orderInput: {
      ...input.baseOrderInput,
      outcome: input.outcome,
      priceWad: simulation.worstAcceptablePriceWad,
    },
    domain: input.domain,
    signer: input.signer,
    orderbookClient: input.orderbookClient,
    submitOptions: {
      ...input.submitOptions,
      restOnNoMatch: false,
    },
  });

  return { ...submission, simulation };
}

function isQuote(value: Quote | undefined): value is Quote {
  return Boolean(value);
}

function roundUpDiv(numerator: bigint, denominator: bigint) {
  return (numerator + denominator - 1n) / denominator;
}

function absoluteDiff(left: bigint, right: bigint) {
  return left > right ? left - right : right - left;
}
