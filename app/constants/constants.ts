
import { Position, PositionSide, LPPosition, ChartData } from '../interface/types';

export const MOCK_POSITIONS: any[] = [
  {
    id: '0042',
    side: PositionSide.FIXED,
    status: 'ACTIVE',
    rate: '5.2%',
    pnl: 420.50,
    progress: 67,
    daysLeft: 23,
    notionalSize: '10,000',
    collateral: '1,200',
    healthFactor: 1.56,
    mintedDate: 'Jan 15, 2024',
    walletAddress: '0x42...8a91'
  },
  {
    id: '0089',
    side: PositionSide.FLOAT,
    status: 'ACTIVE',
    rate: 'Variable',
    pnl: -89.00,
    progress: 35,
    daysLeft: 45,
    notionalSize: '15,000',
    collateral: '2,500',
    healthFactor: 2.12,
    mintedDate: 'Jan 28, 2024',
    walletAddress: '0x42...8a91'
  },
  {
    id: '0156',
    side: PositionSide.FIXED,
    status: 'ACTIVE',
    rate: '4.8%',
    pnl: 1205.20,
    progress: 10,
    daysLeft: 89,
    notionalSize: '25,000',
    collateral: '4,000',
    healthFactor: 3.45,
    mintedDate: 'Feb 02, 2024',
    walletAddress: '0x42...8a91'
  }
];

export const MOCK_LP_POSITIONS: LPPosition[] = [
  {
    id: 'lp-1',
    assets: ['ETH', 'USDC'],
    amount: '50,000',
    apy: '2.3',
    type: 'Liquidity Provider'
  }
];

export const MOCK_CHART_DATA: ChartData[] = Array.from({ length: 20 }, (_, i) => ({
  time: `T-${20 - i}`,
  rate: 4.5 + Math.sin(i / 2) * 0.5 + Math.random() * 0.2,
  fixed: 5.2
}));
