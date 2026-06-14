import {
  Bitcoin,
  Flame,
  Fuel,
  Gauge,
  Landmark,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ASCESWAP_DEMO_MARKETS, ASCESWAP_DEMO_WINDOW } from "../protocol/constants";
import type { Address, Bytes32, Hex } from "../protocol/order";
import type { MarketRuntimeStatus } from "./timeline";

export type CategoryId =
  | "trending"
  | "rates"
  | "crypto"
  | "gas"
  | "yields"
  | "rwa";

export type MetricFormat = "percent" | "usd" | "gwei" | "million";

export interface Market {
  id: Bytes32;
  slug: string;
  conditionId: Bytes32;
  adapter: Address;
  adapterLabel: string;
  chartFromBlock: number;
  chartFromBlockHex: Hex;
  valueDisplay: "aprPercent" | "basefeeGwei";
  unit: string;
  logoSrc?: string;
  logoAlt?: string;
  title: string;
  subtitle: string;
  category: Exclude<CategoryId, "trending">;
  categoryLabel: string;
  icon: LucideIcon;
  iconTone: string;
  status: MarketRuntimeStatus;
  startTimestamp: number;
  endTimestamp: number;
  maturity: string;
  observation: string;
  resolution: "Spot" | "TWA" | "TWAP" | "Cumulative" | "Max" | "Min" | "Range";
  /** Plain-language settlement basis, e.g. "30-day rolling average". */
  settlesOn: string;
  /** Short form for card chips, e.g. "30D avg". */
  resolutionShort: string;
  payoff: "Cap" | "Floor" | "Above" | "Below" | "Range" | "Linear" | "Binary";
  oracle: string;
  metric: string;
  currentValue: number;
  boundaryValue: number;
  boundaryLabel: string;
  format: MetricFormat;
  points: number[];
  change: number;
  volume: string;
  liquidity: string;
  openInterest: string;
  primaryAction: string;
  secondaryAction: string;
  primaryPrice: string;
  secondaryPrice: string;
  payoutLabel: string;
  /** Role caption under each outcome button. */
  yesHint: string;
  noHint: string;
  /** Settlement condition used by the deal sentence, e.g. "borrow APR finishes above 12%". */
  yesCondition: string;
  noCondition: string;
  sourceNote: string;
  settlementWindow: string;
  payoffSummary: string;
  payoffPoints: readonly string[];
  trendingRank?: number;
}

export const categories: Array<{
  id: CategoryId;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "trending", label: "Trending", icon: Flame },
  { id: "rates", label: "Rates", icon: TrendingUp },
  { id: "crypto", label: "Crypto", icon: Bitcoin },
  { id: "gas", label: "Gas", icon: Fuel },
  { id: "yields", label: "Yields", icon: Gauge },
  { id: "rwa", label: "RWA", icon: Landmark },
];

export const markets: Market[] = [
  {
    id: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.marketId,
    slug: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.slug,
    conditionId: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.conditionId,
    adapter: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.adapter,
    adapterLabel: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.adapterLabel,
    chartFromBlock: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.chartFromBlock,
    chartFromBlockHex: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.chartFromBlockHex,
    valueDisplay: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.valueDisplay,
    unit: ASCESWAP_DEMO_MARKETS.aaveBorrowInterest.unit,
    logoSrc: "/market-logos/aave.png",
    logoAlt: "Aave",
    title: "Cap My Aave USDC Borrow Rate",
    subtitle: "Pays more if Aave USDC variable borrow APR rises above 4%, max payout at 8%.",
    category: "rates",
    categoryLabel: "Rates",
    icon: TrendingUp,
    iconTone: "#6fdcb4",
    status: "Live",
    startTimestamp: ASCESWAP_DEMO_WINDOW.startTimestamp,
    endTimestamp: ASCESWAP_DEMO_WINDOW.endTimestamp,
    maturity: "Jul 13, 2026",
    observation: "30D TWAP window",
    resolution: "TWAP",
    settlesOn: "Final 30 Day TWAP",
    resolutionShort: "30D TWAP",
    payoff: "Linear",
    oracle: "Aave variable borrow APR",
    metric: "Borrow APR",
    currentValue: 6.05,
    boundaryValue: 6,
    boundaryLabel: "50% payout",
    format: "percent",
    points: [4.6, 4.8, 5.1, 5.4, 5.9, 6.2, 6.05],
    change: 0.18,
    volume: "$181K",
    liquidity: "$62K",
    openInterest: "$93K",
    primaryAction: "Buy PAYOFF",
    secondaryAction: "Buy RESIDUAL",
    primaryPrice: "45c",
    secondaryPrice: "55c",
    payoutLabel: "PAYOFF protects against higher Aave USDC variable borrow APR.",
    yesHint: "Protection token, pays more as APR rises",
    noHint: "Residual token, keeps the opposite payout",
    yesCondition: "final TWAP borrow APR is above the low strike",
    noCondition: "final TWAP borrow APR stays near or below the low strike",
    sourceNote: "Demo mUSDC market on Arbitrum Sepolia",
    settlementWindow: ASCESWAP_DEMO_WINDOW.utcLabel,
    payoffSummary: "Payout scales from 0 to 1 mUSDC between 4% and 8% APR.",
    payoffPoints: [
      "4% APR or lower: pays 0 mUSDC",
      "6% APR: pays 0.5 mUSDC",
      "8% APR or higher: pays 1 mUSDC",
    ],
    trendingRank: 1,
  },
  {
    id: ASCESWAP_DEMO_MARKETS.l2GasFees.marketId,
    slug: ASCESWAP_DEMO_MARKETS.l2GasFees.slug,
    conditionId: ASCESWAP_DEMO_MARKETS.l2GasFees.conditionId,
    adapter: ASCESWAP_DEMO_MARKETS.l2GasFees.adapter,
    adapterLabel: ASCESWAP_DEMO_MARKETS.l2GasFees.adapterLabel,
    chartFromBlock: ASCESWAP_DEMO_MARKETS.l2GasFees.chartFromBlock,
    chartFromBlockHex: ASCESWAP_DEMO_MARKETS.l2GasFees.chartFromBlockHex,
    valueDisplay: ASCESWAP_DEMO_MARKETS.l2GasFees.valueDisplay,
    unit: ASCESWAP_DEMO_MARKETS.l2GasFees.unit,
    title: "Protect Against Arbitrum Gas Spikes",
    subtitle: "Pays more if average Arbitrum L2 basefee rises above 0.015 gwei, max payout at 0.030 gwei.",
    category: "gas",
    categoryLabel: "Gas",
    icon: Fuel,
    iconTone: "#f5b84b",
    status: "Live",
    startTimestamp: ASCESWAP_DEMO_WINDOW.startTimestamp,
    endTimestamp: ASCESWAP_DEMO_WINDOW.endTimestamp,
    maturity: "Jul 13, 2026",
    observation: "30D TWAP window",
    resolution: "TWAP",
    settlesOn: "Final 30 Day TWAP",
    resolutionShort: "30D TWAP",
    payoff: "Linear",
    oracle: "Arbitrum Sepolia L2 basefee",
    metric: "L2 basefee",
    currentValue: 0.02,
    boundaryValue: 0.02,
    boundaryLabel: "50% payout",
    format: "gwei",
    points: [0.015, 0.017, 0.018, 0.021, 0.019, 0.022, 0.02],
    change: 0.001,
    volume: "$96K",
    liquidity: "$41K",
    openInterest: "$58K",
    primaryAction: "Buy PAYOFF",
    secondaryAction: "Buy RESIDUAL",
    primaryPrice: "50c",
    secondaryPrice: "50c",
    payoutLabel: "PAYOFF protects against higher Arbitrum Sepolia L2 basefee.",
    yesHint: "Protection token, pays more as basefee rises",
    noHint: "Residual token, keeps the opposite payout",
    yesCondition: "final TWAP L2 basefee is above the low strike",
    noCondition: "final TWAP L2 basefee stays near or below the low strike",
    sourceNote: "Demo mUSDC market on Arbitrum Sepolia",
    settlementWindow: ASCESWAP_DEMO_WINDOW.utcLabel,
    payoffSummary: "Payout scales from 0 to 1 mUSDC between 0.015 and 0.030 gwei.",
    payoffPoints: [
      "0.015 gwei or lower: pays 0 mUSDC",
      "0.020 gwei: pays 0.5 mUSDC",
      "0.030 gwei or higher: pays 1 mUSDC",
    ],
    trendingRank: 2,
  },
];
