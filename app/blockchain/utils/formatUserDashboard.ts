import {
  bpsToPct,
  cairoEnumToString,
  feltToHexAddress,
  signedValue,
} from "./utils";

const secondsToTime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return {
      days,
      hours,
      label: `${days}d left`,
    };
  }

  return {
    days: 0,
    hours,
    label: `${hours}h left`,
  };
};

export function formatUserDashboard(raw: any, collateralDecimals: number) {
  const scale = 10 ** collateralDecimals;

  const toAmount = (v: any) => Number(BigInt(v)) / scale;

  return {
    /* ---------- Identity ---------- */
    user: feltToHexAddress(raw.user),

    /* ---------- Portfolio ---------- */
    portfolio: {
      totalValue: toAmount(raw.total_portfolio_value),

      totalCollateralAtRisk: toAmount(raw.total_collateral_at_risk),

      totalNotionalExposure: toAmount(raw.total_notional_exposure),

      unrealizedPnl: signedValue(raw.total_unrealized_pnl) / scale,
    },

    /* ---------- Counts ---------- */
    counts: {
      totalSwaps: Number(raw.total_swaps),
      activeSwaps: Number(raw.active_swaps),
      fixedPositions: Number(raw.fixed_positions),
      floatingPositions: Number(raw.floating_positions),
      lpPositions: Number(raw.total_lp_positions),
    },

    /* ---------- Risk ---------- */
    risk: {
      avgHealthFactorPct: bpsToPct(raw.avg_health_factor_bps),

      positionsAtRisk: Number(raw.positions_at_risk),

      hasLiquidatablePositions: Number(raw.has_liquidatable_positions) === 1,

      hasExpiringSoon: Number(raw.has_expiring_soon) === 1,

      expiringSoonCount: Number(raw.expiring_soon_count),
    },

    /* ---------- LP ---------- */
    lp: {
      totalValue: toAmount(raw.total_lp_value),

      totalSharePct: bpsToPct(raw.total_lp_share_percentage_bps),

      positions: raw.lp_positions.map((lp: any) => ({
        pairId: Number(lp.pair_id),

        shares: toAmount(lp.shares),

        shareValue: toAmount(lp.share_value),

        sharePct: bpsToPct(lp.share_percentage_bps),

        utilizationPct: bpsToPct(lp.utilization_bps),

        canWithdraw: Number(lp.can_withdraw) === 1,
      })),
    },

    /* ---------- Swap Positions ---------- */
    swaps: raw.swap_positions.map((s: any) => {
      const remainingSeconds = Number(s.remaining_seconds);
      const progressPct = bpsToPct(s.progress_bps); // 0–100

      const time = secondsToTime(remainingSeconds);

      return {
        swapId: Number(s.swap_id),
        pairId: Number(s.pair_id),
side: cairoEnumToString(s.side) as "FIXED" | "FLOAT",
status: cairoEnumToString(s.status) as "ACTIVE" | "CLOSED",
        notional: toAmount(s.notional),

        collateral: toAmount(s.collateral),

        pnl: signedValue(s.current_pnl) / scale,

        healthFactorPct: bpsToPct(s.health_factor_bps),

        /* ---------- Time / Progress ---------- */
        progressPct, // ✅ use directly for width
        remainingSeconds: remainingSeconds,
        remainingDays: time.days,
        remainingHours: time.hours,
        remainingLabel: time.label, // "30d left"
      };
    }),
  };
}
