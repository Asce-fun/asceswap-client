import { Duration, MarketData } from '../interface/types';

export const MARKET_META: Record<string, {
  letter: string;
  colorClass: string;
  iconColor: string;
  oracleSource: string;
  termLabel: string;
  collateralSymbol: string;
}> = {
  '1': { letter: '$', colorClass: 'usdc', iconColor: '#2775ca', oracleSource: 'via Aave', termLabel: '30d', collateralSymbol: 'USDC' },
  '2': { letter: 'E', colorClass: 'eth',  iconColor: '#627eea', oracleSource: 'via Aave', termLabel: '30d', collateralSymbol: 'USDC' },
  '3': { letter: 'S', colorClass: 'strk', iconColor: '#a78bfa', oracleSource: 'via Aave', termLabel: '15d', collateralSymbol: 'USDC' },
  '4': { letter: 'D', colorClass: 'dai',  iconColor: '#fbbf24', oracleSource: 'via MakerDAO', termLabel: '60d', collateralSymbol: 'USDC' },
  '5': { letter: 'T', colorClass: 'usdt', iconColor: '#26a17b', oracleSource: 'via Aave', termLabel: '30d', collateralSymbol: 'USDC' },
  '6': { letter: 'B', colorClass: 'btc',  iconColor: '#f7931a', oracleSource: 'via Aave', termLabel: '60d', collateralSymbol: 'USDC' },
};

export const MARKETS: MarketData[] = [
  {
    id: '1',
    protocol: 'Asceswap',
    name: 'X mockUSDC Borrow Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '2',
    protocol: 'Asceswap',
    name: 'ETH Borrow Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '3',
    protocol: 'Asceswap',
    name: 'STRK Borrow Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '4',
    protocol: 'Asceswap',
    name: 'DAI Savings Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '5',
    protocol: 'Asceswap',
    name: 'USDT Borrow Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '6',
    protocol: 'Asceswap',
    name: 'wBTC Borrow Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
];
