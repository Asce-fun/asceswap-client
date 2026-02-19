/**
 * Client-side swap quote calculator — mirrors the on-chain logic
 * so quote updates are instant when the user changes notional/side.
 */

export interface SwapQuoteInput {
  notional: bigint;
  side: 'FIXED' | 'FLOATING';
  oracleRateBps: bigint;
  feeSpreadBps: bigint;
  lockedFixed: bigint;
  lockedFloating: bigint;
  totalCollateral: bigint;
  maxImbalanceAdjustmentBps: bigint;
  initialMarginMultiplierBps: bigint;
  minMarginFloorBps: bigint;
  swapTermSeconds: bigint;
}

export interface SwapQuoteOutput {
  baseRateBps: bigint;
  imbalanceAdjustmentBps: bigint;
  adjustmentIsPositive: boolean;
  feeSpreadBps: bigint;
  finalRateBps: bigint;
  requiredCollateral: bigint;
  lpCollateralToLock: bigint;
}

const BPS = BigInt(10000);
const ZERO = BigInt(0);
const SECONDS_PER_YEAR = BigInt(31536000);

export function calculateSwapQuote(input: SwapQuoteInput): SwapQuoteOutput {
  const {
    notional,
    side,
    oracleRateBps,
    feeSpreadBps,
    lockedFixed,
    lockedFloating,
    totalCollateral,
    maxImbalanceAdjustmentBps,
    initialMarginMultiplierBps,
    minMarginFloorBps,
    swapTermSeconds,
  } = input;

  // Base rate = oracle rate
  const baseRateBps = oracleRateBps;

  // Imbalance adjustment
  let imbalanceAdjustmentBps = ZERO;
  let adjustmentIsPositive = false;

  if (totalCollateral > ZERO) {
    const fixedAfter = side === 'FIXED' ? lockedFixed + notional : lockedFixed;
    const floatAfter = side === 'FLOATING' ? lockedFloating + notional : lockedFloating;
    const totalLocked = fixedAfter + floatAfter;

    if (totalLocked > ZERO) {
      const fixedShare = (fixedAfter * BPS) / totalLocked;
      const floatShare = (floatAfter * BPS) / totalLocked;
      const diff = fixedShare > floatShare ? fixedShare - floatShare : floatShare - fixedShare;
      imbalanceAdjustmentBps = (diff * maxImbalanceAdjustmentBps) / BPS;

      // Fixed side: adjustment positive when more fixed demand
      // Float side: adjustment positive when more float demand
      if (side === 'FIXED') {
        adjustmentIsPositive = fixedShare > floatShare;
      } else {
        adjustmentIsPositive = floatShare > fixedShare;
      }
    }
  }

  // Final rate
  let finalRateBps: bigint;
  if (adjustmentIsPositive) {
    finalRateBps = baseRateBps + feeSpreadBps + imbalanceAdjustmentBps;
  } else {
    const subtraction = feeSpreadBps > imbalanceAdjustmentBps
      ? feeSpreadBps - imbalanceAdjustmentBps
      : ZERO;
    finalRateBps = baseRateBps + subtraction;
  }

  // max_exposure = notional × finalRate × term / (BPS × SECONDS_PER_YEAR)
  const maxExposure = (notional * finalRateBps * swapTermSeconds) / (BPS * SECONDS_PER_YEAR);

  // required_margin = ceil(max_exposure × multiplier / BPS)
  // No floor at entry — min_margin_floor_bps only applies to ongoing health checks
  const numerator = maxExposure * initialMarginMultiplierBps;
  const requiredCollateral = numerator / BPS + (numerator % BPS !== ZERO ? BigInt(1) : ZERO);

  // LP collateral to lock = required collateral (mirrors buyer)
  const lpCollateralToLock = requiredCollateral;

  return {
    baseRateBps,
    imbalanceAdjustmentBps,
    adjustmentIsPositive,
    feeSpreadBps,
    finalRateBps,
    requiredCollateral,
    lpCollateralToLock,
  };
}
