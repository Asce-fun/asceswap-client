import { Duration, MarketData } from '../interface/types';

export const MARKET_META: Record<string, {
  letter: string;
  colorClass: string;
  iconColor: string;
  oracleSource: string;
  termLabel: string;
  collateralSymbol: string;
  oracleAddress: string;
  tokenAddress: string;
  decimals: number;
}> = {
  '1': {
    letter: 'B',
    colorClass: 'btc',
    iconColor: '#f7931a',
    oracleSource: 'BTC Funding Rate',
    termLabel: '1d',
    collateralSymbol: 'mockBTC',
    oracleAddress: '0x33f64b08fee62e515066c62adae9f864a0cd2bd380eca50eef930fedb972722',
    tokenAddress: '',
    decimals: 8,
  },
  '2': {
    letter: 'S',
    colorClass: 'strk',
    iconColor: '#a78bfa',
    oracleSource: 'STRK Staking Yield',
    termLabel: '1d',
    collateralSymbol: 'mockSTRK',
    oracleAddress: '0x4f054dc7fc84e1b3c4e3575eaae78acee0c63e6057547d300b6c9ebe9c4ee51',
    tokenAddress: '',
    decimals: 18,
  },
  '3': {
    letter: 'B',
    colorClass: 'btc',
    iconColor: '#f7931a',
    oracleSource: 'Troves xWBTC Supply Rate',
    termLabel: '1d',
    collateralSymbol: 'mockBTC',
    oracleAddress: '0x2a73bf6c220c3ae3030500fefe13865f5e57e8dec84889eb7490794d6b6f5e6',
    tokenAddress: '',
    decimals: 8,
  },
  '4': {
    letter: '$',
    colorClass: 'usdc',
    iconColor: '#2775ca',
    oracleSource: 'US SOFR Rate',
    termLabel: '1d',
    collateralSymbol: 'mockUSDC',
    oracleAddress: '0xba6cb4064d1600632e5e71c4ca829c8931586bc572a01eead5fb6999018eb1',
    tokenAddress: '',
    decimals: 6,
  },
  '5': {
    letter: 'S',
    colorClass: 'strk',
    iconColor: '#a78bfa',
    oracleSource: 'Ekubo STRK/USDC Pool Rate',
    termLabel: '1d',
    collateralSymbol: 'mockSTRK',
    oracleAddress: '0x5a780d781d5effe4fe9d977606aeb499d5dc161b677487838e4b714111c457e',
    tokenAddress: '',
    decimals: 18,
  },
  '6': {
    letter: '$',
    colorClass: 'usdc',
    iconColor: '#2775ca',
    oracleSource: 'US Real Estate Cap Rate',
    termLabel: '1d',
    collateralSymbol: 'mockUSDC',
    oracleAddress: '0x3637e03bc25e4e33fb213875e26c6e084b2fc30766cbb36d737edaeeec00197',
    tokenAddress: '',
    decimals: 6,
  },
};

export const MARKETS: MarketData[] = [
  {
    id: '1',
    protocol: 'Paradex',
    name: 'BTC Funding Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '2',
    protocol: 'Endur.fi',
    name: 'STRK Staking Yield',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '3',
    protocol: 'Troves',
    name: 'Troves xWBTC Supply Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '4',
    protocol: 'US',
    name: 'US SOFR Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '5',
    protocol: 'Ekubo',
    name: 'Ekubo STRK/USDC Pool Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
  {
    id: '6',
    protocol: 'US',
    name: 'US Real Estate Cap Rate',
    oracleRate: 7.22,
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29
  },
];
