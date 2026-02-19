import { uint256 } from "starknet";
import { SwapSide, u256ToBigInt } from "../utils/utils";
import { analytics } from "./asceswapanalyticsContract";
import { formatUserDashboard } from "../utils/formatUserDashboard";
import { formatSwapDetail } from "../utils/formatSwapDetail";

export async function getUserDashboard(userAddress: string) {
  const raw = await analytics.get_user_dashboard_full(userAddress);
  console.log(raw,'raw')
  return formatUserDashboard(raw,6);
}

export async function getUserLPPositions(userAddress: string) {
  const raw=await analytics.get_user_lp_positions(userAddress);
  return raw;
}

export async function getSwapDetail(swapId: string) {
  const raw = await analytics.get_swap_detail(swapId);
  return formatSwapDetail(raw,6);
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
