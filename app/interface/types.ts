
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
