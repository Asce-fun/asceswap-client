import { signedValue } from "./utils";

/**
 * Raw fields used:
 * - elapsed_seconds
 * - remaining_seconds
 * - progress_bps (FINANCIAL, not time)
 */

export function formatSwapDetail(raw: any,collateralDecimals:number) {
  /* -------------------- TIME -------------------- */
  const scale = 10 ** collateralDecimals;
  const elapsedSeconds = Number(raw.elapsed_seconds);
  const remainingSeconds = Number(raw.remaining_seconds);

  const totalSeconds = elapsedSeconds + remainingSeconds;

  const timeProgressPct =
    totalSeconds > 0
      ? (elapsedSeconds / totalSeconds) * 100
      : 0;

  /* -------------------- RATES -------------------- */

  const fixedRatePct = Number(raw.fixed_rate_bps) / 100;
  const floatingRatePct =
    Number(raw.current_floating_rate_bps) / 100;

  /* -------------------- VALUES -------------------- */

  const notional = Number(raw.notional) / scale;
  const collateral = Number(raw.collateral) / scale;

  const currentPnl = signedValue(raw.current_pnl) / scale;
  const projectedPnl = signedValue(raw.projected_pnl_at_expiry) / scale;

  const spreadPct =
    signedValue(raw.spread_bps) / 100;

  /* -------------------- META -------------------- */

  return {
    /* ---------- Identity ---------- */
    swapId: Number(raw.swap_id),
    pairId: Number(raw.pair_id),

    side:
      Number(raw.side) === 0 ? "FIXED" : "FLOAT",

    status:
      Number(raw.status) === 0 ? "ACTIVE" : "CLOSED",

    /* ---------- Position ---------- */
    notional,
    collateral,
    leverage:
      Number(raw.leverage_x100) / 100,

    /* ---------- Rates ---------- */
    fixedRatePct,
    floatingRatePct,
    spreadPct,
    breakevenRatePct:
      Number(raw.breakeven_rate_bps) / 100,

    /* ---------- PnL ---------- */
    pnl: {
      current: currentPnl,
      projected: projectedPnl,
    },

    /* ---------- Risk ---------- */
    healthFactorPct:
      Number(raw.health_factor_bps) / 1000,

    requiredMargin:
      Number(raw.required_margin) / scale,

    isLiquidatable:
      Number(raw.is_liquidatable) === 1,

    /* ---------- Time ---------- */
    time: {
      startTime:
        new Date(Number(raw.start_time) * 1000),

      expirationTime:
        new Date(Number(raw.expiration_time) * 1000),

      elapsedSeconds,
      remainingSeconds,

      elapsedDays:
        elapsedSeconds / 86400,

      remainingDays:
        remainingSeconds / 86400,

      progressPct: Math.min(
        100,
        Math.max(0, timeProgressPct)
      ),
    },

    /* ---------- Fees ---------- */
    fees: {
      earlyExitFee:
        Number(raw.early_exit_fee) / scale,

      earlyExitPayout:
        Number(raw.early_exit_payout) / scale,
    },

    /* ---------- Market ---------- */
    market: {
      utilizationPct:
        Number(raw.market_utilization_bps) / 100,

      tvl:
        Number(raw.market_tvl)/scale,
    },
  };
}
