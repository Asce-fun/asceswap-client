import { uint256 } from "starknet";

const feltToHexAddress = (v: bigint | string) =>
  "0x" + BigInt(v).toString(16);

const u256ToBigInt = (v: any) =>
  uint256.uint256ToBN(v);

/**
 * Format a MarketForTrading struct (from analytics get_markets_page)
 * into the same FormattedMarket shape used everywhere.
 *
 * MarketForTrading is flat (no nested pool/params/rate_index) and has
 * different field names, so it needs its own mapper.
 */
export function formatMarketForTrading(raw: any) {
  const decimals = Number(raw.decimals);
  const scale = 10 ** decimals;

  const toAmount = (v: any) =>
    Number(u256ToBigInt(v)) / scale;

  const toBpsPct = (v: any) =>
    Number(u256ToBigInt(v)) / 100;

  const totalCollateral = toAmount(raw.total_liquidity);
  const availableFixed = toAmount(raw.available_for_fixed);
  const availableFloating = toAmount(raw.available_for_floating);

  // locked = total - available (per side)
  const lockedFixed = Math.max(0, totalCollateral - availableFixed);
  const lockedFloating = Math.max(0, totalCollateral - availableFloating);

  return {
    pairId: Number(raw.pair_id),

    status:
      Object.keys(raw.status).length === 0
        ? "ACTIVE"
        : "PAUSED",

    oracle: "",
    curator: "",
    collateralToken: feltToHexAddress(raw.collateral_token),

    decimals,

    rate: {
      currentPct: toBpsPct(raw.current_oracle_rate_bps),
      lastUpdated: new Date(),
    },

    pool: {
      totalCollateral,
      lockedFixed,
      lockedFloating,
      availableLiquidity:
        totalCollateral - lockedFixed - lockedFloating,
    },

    params: {
      liquidationThresholdPct: 0,
      initialMarginMultiplierPct: 0,
      minMarginFloorPct: 0,

      swapTermDays:
        Number(raw.swap_term_seconds) / 86400,

      minHoldPeriodMinutes: 0,

      swapFeePct:
        toBpsPct(raw.swap_fee_bps),

      earlyExitFeePct:
        toBpsPct(raw.early_exit_fee_bps),

      liquidationBonusPct: 0,
      feeSpreadPct: 0,

      maxUtilizationPct: 0,

      minNotional:
        toAmount(raw.min_notional),

      maxNotional:
        toAmount(raw.max_notional_per_swap),

      maxOracleStalenessSeconds: 0,
      maxRateChangePct: 0,
      minRatePct: 0,
      maxRatePct: 0,
      isLpPermissioned: false,
    },

    stats: {
      totalSwaps:
        Number(u256ToBigInt(raw.total_swaps_created)),
      activeSwaps:
        Number(u256ToBigInt(raw.active_swap_count)),
    },
  };
}

export function formatMarket(raw: any) {
  const decimals = Number(raw.decimals);
  const scale = 10 ** decimals;

  const toAmount = (v: any) =>
    Number(u256ToBigInt(v)) / scale;

  const toBpsPct = (v: bigint) =>
    Number(v) / 100;

  const totalCollateral = toAmount(raw.pool.total_collateral);
  const lockedFixed = toAmount(raw.pool.locked_for_fixed);
  const lockedFloating = toAmount(raw.pool.locked_for_floating);

  return {
    /* ---------- Identity ---------- */
    pairId: Number(raw.pair_id),

    status:
      Object.keys(raw.status).length === 0
        ? "ACTIVE"
        : "PAUSED",

    oracle: feltToHexAddress(raw.rate_oracle),
    curator: feltToHexAddress(raw.curator),
    collateralToken: feltToHexAddress(raw.collateral_token),

    decimals,

    /* ---------- Rate ---------- */
    rate: {
      currentPct: toBpsPct(raw.rate_index.last_rate_bps),
      lastUpdated: new Date(
        Number(raw.rate_index.last_update_time) * 1000
      ),
    },

    /* ---------- Pool ---------- */
    pool: {
      totalCollateral,
      lockedFixed,
      lockedFloating,
      availableLiquidity:
        totalCollateral - lockedFixed - lockedFloating,
    },

    /* ---------- Params ---------- */
    params: {
      liquidationThresholdPct:
        toBpsPct(raw.params.liquidation_threshold_bps),

      initialMarginMultiplierPct:
        toBpsPct(raw.params.initial_margin_multiplier_bps),

      minMarginFloorPct:
        toBpsPct(raw.params.min_margin_floor_bps),

      swapTermDays:
        Number(raw.params.swap_term_seconds) / 86400,

      minHoldPeriodMinutes:
        Number(raw.params.min_hold_period_seconds) / 60,

      swapFeePct:
        toBpsPct(raw.params.swap_fee_bps),

      earlyExitFeePct:
        toBpsPct(raw.params.early_exit_fee_bps),

      liquidationBonusPct:
        toBpsPct(raw.params.liquidation_bonus_bps),

      feeSpreadPct:
        toBpsPct(raw.params.fee_spread_bps),

      maxUtilizationPct:
        toBpsPct(raw.params.max_utilization_bps),

      minNotional:
        toAmount(raw.params.min_notional),

      maxNotional:
        toAmount(raw.params.max_notional_per_swap),

      maxOracleStalenessSeconds:
        Number(raw.params.max_oracle_staleness_seconds),

      maxRateChangePct:
        toBpsPct(raw.params.max_rate_change_per_update_bps),

      minRatePct:
        toBpsPct(raw.params.min_rate_bps),

      maxRatePct:
        toBpsPct(raw.params.max_rate_bps),

      isLpPermissioned:
        Number(raw.params.is_lp_permissioned) === 1,
    },

    /* ---------- Stats ---------- */
    stats: {
      totalSwaps:
        Number(raw.total_swaps_created),
      activeSwaps:
        Number(raw.active_swap_count),
    },
  };
}
