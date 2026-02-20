
export enum MarketSide {
  FIXED_TAKER = 'FIXED_TAKER',
  VARIABLE_TAKER = 'VARIABLE_TAKER'
}

export enum Duration {
  D1 = '1D',
  D7 = '7D',
  D30 = '30D'
}

export interface MarketState {
  side: MarketSide;
  duration: Duration;
  notional: number;
}

export interface MarketData {
  id: string;
  protocol: ProtocolSymbol;
  name: string;
  oracleRate: number;
  icon?: string;
  fixedDuration: Duration;
  maturityTimestamp: number;
}

export type TokenSymbol = "STRK" | "USDC" | "ETH" | "BTC" | "USDT" | "mockBTC" | "mockSTRK" | "mockUSDC";

export type SwapStatus = "ACTIVE" | "SETTLED" | "LIQUIDATED" | "EXITEDEARLY" | "UNINITIALIZED";

export type SwapDirection = 'FIXED' | 'FLOATING';

// interface/types.ts
export type ProtocolSymbol = "Ekubo" | "Vesu" | "Nostra" | "Asceswap" | "Paradex" | "Endure.Fi" | "Troves" | "US";

// interface/formattedMarket.ts

export interface FormattedMarket {
  pairId: number;
  status: "ACTIVE" | "PAUSED";

  oracle: string;           // hex address
  curator: string;          // hex address
  collateralToken: string;  // hex address
  decimals: number;

  rate: {
    currentPct: number;
    lastUpdated: Date;
  };

  pool: {
    totalCollateral: number;
    lockedFixed: number;
    lockedFloating: number;
    availableLiquidity: number;
  };

  params: {
    liquidationThresholdPct: number;
    initialMarginMultiplierPct: number;
    minMarginFloorPct: number;

    swapTermDays: number;
    minHoldPeriodMinutes: number;

    swapFeePct: number;
    earlyExitFeePct: number;
    liquidationBonusPct: number;
    feeSpreadPct: number;

    maxUtilizationPct: number;

    minNotional: number;
    maxNotional: number;

    maxOracleStalenessSeconds: number;
    maxRateChangePct: number;

    minRatePct: number;
    maxRatePct: number;

    isLpPermissioned: boolean;
  };

  stats: {
    totalSwaps: number;
    activeSwaps: number;
  };
}


export enum PositionSide {
  FIXED = 'FIXED',
  FLOAT = 'FLOAT'
}

export interface Position {
    swapId: number;
    pairId: number;
    side: "FIXED" | "FLOAT";
    status: SwapStatus;
    notional: number;
    collateral: number;
    pnl: number;
    fixedRatePct?: number;
    healthFactorPct: number;
    progressPct: number;
    remainingDays: number;
    remainingHours: number;
    remainingLabel: string;
    remainingSeconds: number;
}

export interface LPPosition {
  id: string;
  assets: string[];
  amount: string;
  apy: string;
  type: string;
}

export interface ChartData {
  time: string;
  rate: number;
  fixed: number;
}

export type UserDashboard = {
  /* ---------- Identity ---------- */
  user: string; // hex address

  /* ---------- Portfolio ---------- */
  portfolio: {
    totalValue: number;
    totalCollateralAtRisk: number;
    totalNotionalExposure: number;
    unrealizedPnl: number;
  };

  /* ---------- Counts ---------- */
  counts: {
    totalSwaps: number;
    activeSwaps: number;
    fixedPositions: number;
    floatingPositions: number;
    lpPositions: number;
  };

  /* ---------- Risk ---------- */
  risk: {
    avgHealthFactorPct: number;
    positionsAtRisk: number;
    hasLiquidatablePositions: boolean;
    hasExpiringSoon: boolean;
    expiringSoonCount: number;
  };

  /* ---------- LP ---------- */
  lp: {
    totalValue: number;
    totalSharePct: number;
    positions: {
      pairId: number;
      shares: number;
      shareValue: number;
      sharePct: number;
      utilizationPct: number;
      canWithdraw: boolean;
    }[];
  };

  /* ---------- Swap Positions ---------- */
  swaps: {
    swapId: number;
    pairId: number;
    side: "FIXED" | "FLOAT";
    status: SwapStatus;
    notional: number;
    collateral: number;
    pnl: number;
    fixedRatePct?: number;
    healthFactorPct: number;
    progressPct: number;
    remainingDays: number;
    remainingHours: number;
    remainingLabel: string;
    remainingSeconds: number;
  }[];
};

export type SwapDetail = {
  /* ---------- Identity ---------- */
  swapId: number;
  pairId: number;
  side: "FIXED" | "FLOAT";
  status: SwapStatus;

  /* ---------- Position ---------- */
  notional: number;
  collateral: number;
  leverage: number;

  /* ---------- Rates ---------- */
  fixedRatePct: number;
  floatingRatePct: number;
  spreadPct: number;
  breakevenRatePct: number;

  /* ---------- PnL ---------- */
  pnl: {
    current: number;
    projected: number;
  };

  /* ---------- Risk ---------- */
  healthFactorPct: number;
  requiredMargin: number;
  isLiquidatable: boolean;

  /* ---------- Time ---------- */
  time: {
    startTime: Date;
    expirationTime: Date;

    elapsedSeconds: number;
    remainingSeconds: number;

    elapsedDays: number;
    remainingDays: number;

    progressPct: number; // 0–100 (time-based)
  };

  /* ---------- Fees ---------- */
  fees: {
    earlyExitFee: number;
    earlyExitPayout: number;
  };

  /* ---------- Market ---------- */
  market: {
    utilizationPct: number;
    tvl: number;
  };
};

export type RateEntry = {
  rateBps: number;
  ratePct: number;
  timestamp: number;
  date: Date;
};

export type MarketsPageData = any; // Raw response from analytics.get_markets_page()

export type LpPageData = any; // Raw response from analytics.get_lp_page()

export type SwapQuoteResult = {
  baseRateBps: bigint;
  imbalanceAdjustmentBps: bigint;
  adjustmentIsPositive: boolean;
  feeSpreadBps: bigint;
  finalRateBps: bigint;
  requiredCollateral: bigint;
  lpCollateralToLock: bigint;
};

export type PnLScenario = {
  label: string;
  rateBps: number;
  pnl: number;
  pnlPct: number;
};
