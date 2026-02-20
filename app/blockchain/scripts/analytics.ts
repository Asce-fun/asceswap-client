import { uint256 } from "starknet";
import { SwapSide, u256ToBigInt } from "../utils/utils";
import { analytics } from "./asceswapanalyticsContract";
import { formatUserDashboard } from "../utils/formatUserDashboard";
import { formatSwapDetail } from "../utils/formatSwapDetail";
import { MARKET_META } from "../../constants/markets";

// Build decimals map from MARKET_META: { "1": 8, "2": 18, ... }
const decimalsMap: Record<string, number> = Object.fromEntries(
  Object.entries(MARKET_META).map(([id, meta]) => [id, meta.decimals])
);

export async function getUserDashboard(userAddress: string) {
  const raw = await analytics.get_user_dashboard_full(userAddress);
  return formatUserDashboard(raw, decimalsMap);
}

export async function getUserLPPositions(userAddress: string) {
  const raw = await analytics.get_user_lp_positions(userAddress);
  return raw;
}

export async function getSwapDetail(swapId: string) {
  const raw = await analytics.get_swap_detail(swapId);
  const pairId = String(raw.pair_id);
  const decimals = MARKET_META[pairId]?.decimals ?? 6;
  return formatSwapDetail(raw, decimals);
}

export async function getMarketsPage(pairIds: string[]) {
  const raw = await analytics.get_markets_page(pairIds);
  return raw;
}

export async function getLpPage(userAddress: string, pairIds: string[]) {
  const raw = await analytics.get_lp_page(userAddress, pairIds);
  return raw;
}

export async function getSwapScenarios(swapId: string, ratesBps: number[]) {
  const raw = await analytics.get_swap_scenarios(
    swapId,
    ratesBps.map((r) => uint256.bnToUint256(BigInt(r)))
  );
  return raw;
}
