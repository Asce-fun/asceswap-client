import {
  type Address,
  type ApiOrder,
  type Bytes32,
  type Outcome,
  type Side,
  deriveBuyClaimAmount,
  deriveOrderAmounts,
  freezeOrder,
  isBytes32,
  makeUint256Salt,
  marketIdToBytes32,
  outcomeToClaimSide,
} from "../protocol/order";

export type BuildOrderInput = Readonly<{
  maker: Address;
  marketId: string;
  outcome: Outcome;
  side: Side;
  priceWad: bigint;
  claimAmount: bigint;
  expiration: bigint;
  epoch: bigint;
  maxFeeRateBps: number;
  salt?: bigint | string;
}>;

export type BuildBuyOrderFromCollateralInput = Omit<BuildOrderInput, "claimAmount" | "side"> & Readonly<{
  collateralAmount: bigint;
}>;

export function buildOrder(input: BuildOrderInput): ApiOrder {
  const amounts = deriveOrderAmounts(input.side, input.priceWad, input.claimAmount);

  return freezeOrder({
    salt: input.salt?.toString() ?? makeUint256Salt(),
    maker: input.maker,
    market_id: normalizeMarketId(input.marketId),
    claim: outcomeToClaimSide[input.outcome],
    maker_amount: amounts.makerAmount.toString(),
    taker_amount: amounts.takerAmount.toString(),
    side: input.side,
    expiration: input.expiration.toString(),
    epoch: input.epoch.toString(),
    max_fee_rate_bps: input.maxFeeRateBps,
  });
}

export function buildBuyOrderFromCollateral(input: BuildBuyOrderFromCollateralInput): ApiOrder {
  const claimAmount = deriveBuyClaimAmount(input.collateralAmount, input.priceWad);

  return buildOrder({
    ...input,
    side: "buy",
    claimAmount,
  });
}

export function getOrderClaimAmount(order: ApiOrder) {
  return BigInt(order.side === "buy" ? order.taker_amount : order.maker_amount);
}

export function getOrderCollateralAmount(order: ApiOrder) {
  return BigInt(order.side === "buy" ? order.maker_amount : order.taker_amount);
}

function normalizeMarketId(marketId: string): Bytes32 {
  return isBytes32(marketId) ? marketId : marketIdToBytes32(marketId);
}
