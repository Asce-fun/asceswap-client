
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
  protocol: string;
  name: string;
  oracleRate: number;
  icon?: string;
  fixedDuration: Duration;
  maturityTimestamp: number;
}

export type TokenSymbol = "STRK" | "USDC" | "ETH" | "BTC" | "USDT"; 

export type SwapDirection = 'FIXED' | 'FLOATING';
