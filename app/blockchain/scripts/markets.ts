import { uint256 } from "starknet";
import { SwapSide, u256ToBigInt } from "../utils/utils";
import { asceSwap } from "./asceswapContract";

export async function getMarket(pairId: string) {
  return await asceSwap.get_market(pairId);
}

export async function getPoolAnalytics(pairId: string) {
  return await asceSwap.get_pool_analytics(pairId);
}

/** Protocol-level risk params */
export async function getProtocolConfig() {
  return await asceSwap.get_protocol_config();
}

export async function getSwapQuote(
  pairId: string,
  side: keyof typeof SwapSide,
  notional: bigint
) {
  return await asceSwap.get_swap_quote(
    pairId,
    SwapSide[side],
    uint256.bnToUint256(notional)
  );
}

/** Full swap struct */
export async function getSwap(swapId: bigint) {
  return await asceSwap.get_swap(
    uint256.bnToUint256(swapId)
  );
}

/** Health / liquidation info */
export async function getSwapHealth(swapId: bigint) {
  return await asceSwap.get_health_status(
    uint256.bnToUint256(swapId)
  );
}

/** Current TWA rate for live PnL preview */
export async function getCurrentTWA(swapId: bigint): Promise<bigint> {
  return u256ToBigInt(
    await asceSwap.get_current_twa(
      uint256.bnToUint256(swapId)
    )
  );
}

/** Market page bundle */
export async function getMarketDashboard(pairId: string) {
  const [market, analytics] = await Promise.all([
    getMarket(pairId),
    getPoolAnalytics(pairId),
  ]);

  return {
    market,
    analytics,
  };
}

/** Trade preview bundle */
export async function getTradePreview(
  pairId: string,
  side: keyof typeof SwapSide,
  notional: bigint
) {
  const [market, quote] = await Promise.all([
    getMarket(pairId),
    getSwapQuote(pairId, side, notional),
  ]);

  return {
    oracleRateBps: quote.base_rate_bps,
    finalRateBps: quote.final_rate_bps,
    imbalanceAdjustmentBps: quote.imbalance_adjustment_bps,
    collateralRequired: u256ToBigInt(quote.required_collateral),
    lpCollateralLocked: u256ToBigInt(quote.lp_collateral_to_lock),
    utilizationCapBps: market.params.max_utilization_bps,
  };
}

/** Swap position dashboard */
export async function getSwapDashboard(swapId: bigint) {
  const [swap, health, twa] = await Promise.all([
    getSwap(swapId),
    getSwapHealth(swapId),
    getCurrentTWA(swapId),
  ]);

  return {
    swap,
    health,
    twaRateBps: twa,
  };
}