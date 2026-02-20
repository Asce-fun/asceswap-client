import {
  bpsToPct,
  cairoEnumToString,
  feltToHexAddress,
  signedValue,
} from "./utils";

const secondsToTime = (seconds: number) => {
  if (seconds <= 0) {
    return {
      days: 0,
      hours: 0,
      label: "Ready to Settle",
    };
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  if (days > 0) {
    return {
      days,
      hours,
      label: `${days}d left`,
    };
  }

  if (hours > 0) {
    return {
      days: 0,
      hours,
      label: `${hours}h left`,
    };
  }

  const minutes = Math.ceil(seconds / 60);
  return {
    days: 0,
    hours: 0,
    label: `${minutes}m left`,
  };
};

export function formatUserDashboard(raw: any, decimalsMap: Record<string, number>) {
  // Fallback scale for cross-market portfolio aggregates
  const fallbackScale = 10 ** 6;

  const toAmountFallback = (v: any) => Number(BigInt(v)) / fallbackScale;

  return {
    /* ---------- Identity ---------- */
    user: feltToHexAddress(raw.user),

    /* ---------- Portfolio ---------- */
    portfolio: {
      totalValue: toAmountFallback(raw.total_portfolio_value),

      totalCollateralAtRisk: toAmountFallback(raw.total_collateral_at_risk),

      totalNotionalExposure: toAmountFallback(raw.total_notional_exposure),

      unrealizedPnl: signedValue(raw.total_unrealized_pnl) / fallbackScale,
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
      avgHealthFactorPct: bpsToPct(raw.avg_health_factor_bps) / 10,

      positionsAtRisk: Number(raw.positions_at_risk),

      hasLiquidatablePositions: Number(raw.has_liquidatable_positions) === 1,

      hasExpiringSoon: Number(raw.has_expiring_soon) === 1,

      expiringSoonCount: Number(raw.expiring_soon_count),
    },

    /* ---------- LP ---------- */
    lp: {
      totalValue: toAmountFallback(raw.total_lp_value),

      totalSharePct: bpsToPct(raw.total_lp_share_percentage_bps),

      positions: raw.lp_positions.map((lp: any) => {
        const pairId = String(lp.pair_id);
        const lpScale = 10 ** (decimalsMap[pairId] ?? 6);
        const toAmt = (v: any) => Number(BigInt(v)) / lpScale;

        return {
          pairId: Number(lp.pair_id),

          shares: toAmt(lp.shares),

          shareValue: toAmt(lp.share_value),

          sharePct: bpsToPct(lp.share_percentage_bps),

          utilizationPct: bpsToPct(lp.utilization_bps),

          canWithdraw: Number(lp.can_withdraw) === 1,
        };
      }),
    },

    /* ---------- Swap Positions ---------- */
    swaps: raw.swap_positions.map((s: any) => {
      const pairId = String(s.pair_id);
      const swapScale = 10 ** (decimalsMap[pairId] ?? 6);
      const toAmt = (v: any) => Number(BigInt(v)) / swapScale;

      const remainingSeconds = Number(s.remaining_seconds);
      const progressPct = bpsToPct(s.progress_bps); // 0–100

      const time = secondsToTime(remainingSeconds);

      return {
        swapId: Number(s.swap_id),
        pairId: Number(s.pair_id),
        side: cairoEnumToString(s.side) as "FIXED" | "FLOAT",
        status: cairoEnumToString(s.status) as "ACTIVE" | "CLOSED",
        notional: toAmt(s.notional),

        collateral: toAmt(s.collateral),

        pnl: signedValue(s.current_pnl) / swapScale,

        healthFactorPct: bpsToPct(s.health_factor_bps) / 10,

        /* ---------- Time / Progress ---------- */
        progressPct, // use directly for width
        remainingSeconds: remainingSeconds,
        remainingDays: time.days,
        remainingHours: time.hours,
        remainingLabel: time.label,
      };
    }),
  };
}
