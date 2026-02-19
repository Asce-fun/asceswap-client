/**
 * Client-side P&L scenario calculator for the SwapModal P&L preview.
 */
export interface PnLInput {
  side: 'FIXED' | 'FLOATING';
  notional: number;
  collateral: number;
  lockedRatePct: number;
  termDays: number;
}

export interface PnLScenario {
  label: string;
  ratePct: number;
  pnl: number;
  pnlPct: number;
}

export function calculatePnLScenarios(
  input: PnLInput,
  scenarioRates: number[],
  scenarioLabels: string[]
): PnLScenario[] {
  const { side, notional, collateral, lockedRatePct, termDays } = input;
  const termFraction = termDays / 365;

  return scenarioRates.map((scenarioRate, i) => {
    let pnl: number;

    if (side === 'FIXED') {
      pnl = ((lockedRatePct - scenarioRate) / 100) * notional * termFraction;
    } else {
      pnl = ((scenarioRate - lockedRatePct) / 100) * notional * termFraction;
    }

    return {
      label: scenarioLabels[i] ?? `${scenarioRate.toFixed(2)}%`,
      ratePct: scenarioRate,
      pnl,
      pnlPct: collateral > 0 ? (pnl / collateral) * 100 : 0,
    };
  });
}
