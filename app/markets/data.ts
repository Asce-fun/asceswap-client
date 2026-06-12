import {
  Activity,
  Bitcoin,
  Flame,
  Fuel,
  Gauge,
  Landmark,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CategoryId =
  | "trending"
  | "rates"
  | "crypto"
  | "gas"
  | "yields"
  | "rwa"
  | "protocol";

export type MetricFormat = "percent" | "usd" | "gwei" | "million";

export interface Market {
  id: string;
  title: string;
  category: Exclude<CategoryId, "trending">;
  categoryLabel: string;
  icon: LucideIcon;
  iconTone: string;
  status: "Live" | "Opening" | "Closing soon" | "Settles soon";
  minutesToExpiry: number;
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
  { id: "protocol", label: "Protocol Metrics", icon: Activity },
];

export const markets: Market[] = [
  {
    id: "aave-usdc-borrow-cap",
    title: "Cap my Aave USDC borrow cost at 12% APR",
    category: "rates",
    categoryLabel: "Rates",
    icon: TrendingUp,
    iconTone: "#6fdcb4",
    status: "Live",
    minutesToExpiry: 25920,
    maturity: "Jun 30, 2026",
    observation: "30D rolling window",
    resolution: "TWA",
    settlesOn: "30-day rolling average",
    resolutionShort: "30D avg",
    payoff: "Cap",
    oracle: "Aave v3 Ethereum adapter",
    metric: "Borrow APR",
    currentValue: 9.86,
    boundaryValue: 12,
    boundaryLabel: "Your cap",
    format: "percent",
    points: [7.7, 8.1, 8.8, 8.4, 9.2, 10.6, 10.1, 11.4, 10.7, 9.8, 9.2, 9.7, 9.86],
    change: 0.82,
    volume: "$184K",
    liquidity: "$62K",
    openInterest: "$93K",
    primaryAction: "Buy YES",
    secondaryAction: "Buy NO",
    primaryPrice: "34c",
    secondaryPrice: "67c",
    payoutLabel: "YES pays if borrow APR finishes above 12%.",
    yesHint: "Pays if APR ends above 12% — your hedge",
    noHint: "Pays if it stays at or under — earn the premium",
    yesCondition: "borrow APR finishes above 12%",
    noCondition: "borrow APR finishes at or below 12%",
    sourceNote: "Hedge variable USDC borrow APR",
    trendingRank: 1,
  },
  {
    id: "eth-base-fee-35",
    title: "Hedge Ethereum gas above 35 gwei this week",
    category: "gas",
    categoryLabel: "Gas",
    icon: Fuel,
    iconTone: "#f5b84b",
    status: "Closing soon",
    minutesToExpiry: 4,
    maturity: "Jun 12, 2026",
    observation: "Last 7D",
    resolution: "TWA",
    settlesOn: "7-day average",
    resolutionShort: "7D avg",
    payoff: "Above",
    oracle: "Ethereum base fee adapter",
    metric: "Avg base fee",
    currentValue: 32.8,
    boundaryValue: 35,
    boundaryLabel: "Target",
    format: "gwei",
    points: [22, 24, 31, 29, 35, 43, 39, 37, 41, 36, 32, 34, 32.8],
    change: -1.7,
    volume: "$96K",
    liquidity: "$41K",
    openInterest: "$58K",
    primaryAction: "Buy YES",
    secondaryAction: "Buy NO",
    primaryPrice: "46c",
    secondaryPrice: "55c",
    payoutLabel: "YES pays if weekly average gas finishes above 35 gwei.",
    yesHint: "Pays if gas averages above 35 gwei — your hedge",
    noHint: "Pays if gas stays at or under — earn the premium",
    yesCondition: "weekly average gas finishes above 35 gwei",
    noCondition: "weekly average gas finishes at or below 35 gwei",
    sourceNote: "Base fee in gwei",
    trendingRank: 2,
  },
  {
    id: "btc-110k-month-end",
    title: "Trade BTC closing above $110K at month end",
    category: "crypto",
    categoryLabel: "Crypto",
    icon: Bitcoin,
    iconTone: "#f59f34",
    status: "Live",
    minutesToExpiry: 27360,
    maturity: "Jul 1, 2026",
    observation: "5:00 PM ET close",
    resolution: "Spot",
    settlesOn: "5 PM ET close",
    resolutionShort: "Spot close",
    payoff: "Binary",
    oracle: "BTC/USD verified price adapter",
    metric: "BTC/USD",
    currentValue: 107240,
    boundaryValue: 110000,
    boundaryLabel: "Price to beat",
    format: "usd",
    points: [101200, 102600, 105400, 104700, 106800, 108100, 107300, 109500, 108800, 106900, 107900, 106700, 107240],
    change: 2.4,
    volume: "$311K",
    liquidity: "$88K",
    openInterest: "$126K",
    primaryAction: "Buy YES",
    secondaryAction: "Buy NO",
    primaryPrice: "58c",
    secondaryPrice: "43c",
    payoutLabel: "YES pays if BTC closes above $110K.",
    yesHint: "Pays if BTC closes above $110K",
    noHint: "Pays if BTC closes at or below $110K",
    yesCondition: "BTC closes above $110K",
    noCondition: "BTC closes at or below $110K",
    sourceNote: "Reference exchange basket",
    trendingRank: 3,
  },
  {
    id: "morpho-usdc-floor",
    title: "Protect Morpho USDC yield below 6% APY",
    category: "yields",
    categoryLabel: "Yields",
    icon: Gauge,
    iconTone: "#4c8dff",
    status: "Live",
    minutesToExpiry: 30240,
    maturity: "Jul 3, 2026",
    observation: "30D rolling window",
    resolution: "TWA",
    settlesOn: "30-day rolling average",
    resolutionShort: "30D avg",
    payoff: "Floor",
    oracle: "Morpho Blue USDC adapter",
    metric: "Supply APY",
    currentValue: 6.42,
    boundaryValue: 6,
    boundaryLabel: "Your floor",
    format: "percent",
    points: [7.8, 7.3, 6.9, 6.6, 6.2, 6.5, 6.9, 6.7, 6.4, 6.1, 6.3, 6.5, 6.42],
    change: -0.28,
    volume: "$72K",
    liquidity: "$29K",
    openInterest: "$37K",
    primaryAction: "Buy YES",
    secondaryAction: "Buy NO",
    primaryPrice: "25c",
    secondaryPrice: "76c",
    payoutLabel: "YES pays if supply APY finishes below 6%.",
    yesHint: "Pays if yield slips below 6% — your floor",
    noHint: "Pays if yield holds at or above 6% — earn the premium",
    yesCondition: "supply APY finishes below 6%",
    noCondition: "supply APY finishes at or above 6%",
    sourceNote: "USDC supply side yield",
  },
  {
    id: "base-sequencer-revenue",
    title: "Trade Base revenue above $8M this month",
    category: "protocol",
    categoryLabel: "Protocol",
    icon: Activity,
    iconTone: "#7aa7ff",
    status: "Live",
    minutesToExpiry: 25920,
    maturity: "Jun 30, 2026",
    observation: "Calendar month",
    resolution: "Cumulative",
    settlesOn: "Calendar-month total",
    resolutionShort: "Monthly total",
    payoff: "Above",
    oracle: "L2 revenue adapter",
    metric: "Sequencer revenue",
    currentValue: 6.41,
    boundaryValue: 8,
    boundaryLabel: "Monthly threshold",
    format: "million",
    points: [1.1, 1.6, 2.1, 2.8, 3.4, 3.7, 4.3, 4.8, 5.1, 5.7, 6.0, 6.25, 6.41],
    change: 3.4,
    volume: "$64K",
    liquidity: "$21K",
    openInterest: "$42K",
    primaryAction: "Buy YES",
    secondaryAction: "Buy NO",
    primaryPrice: "40c",
    secondaryPrice: "61c",
    payoutLabel: "YES pays if monthly revenue clears $8M.",
    yesHint: "Pays if monthly revenue clears $8M",
    noHint: "Pays if revenue stays under $8M",
    yesCondition: "monthly revenue clears $8M",
    noCondition: "monthly revenue stays under $8M",
    sourceNote: "Fees net of refunds",
  },
  {
    id: "tokenized-treasury-yield",
    title: "Trade Treasury yield range 4.9%-5.3%",
    category: "rwa",
    categoryLabel: "RWA",
    icon: Landmark,
    iconTone: "#d4b06a",
    status: "Opening",
    minutesToExpiry: 158400,
    maturity: "Sep 30, 2026",
    observation: "Q3 final print",
    resolution: "Range",
    settlesOn: "Q3 final print",
    resolutionShort: "Final print",
    payoff: "Range",
    oracle: "RWA yield adapter",
    metric: "Benchmark yield",
    currentValue: 5.08,
    boundaryValue: 5.3,
    boundaryLabel: "Upper band",
    format: "percent",
    points: [5.22, 5.18, 5.15, 5.11, 5.06, 5.04, 5.1, 5.12, 5.09, 5.05, 5.07, 5.1, 5.08],
    change: 0.05,
    volume: "$53K",
    liquidity: "$34K",
    openInterest: "$25K",
    primaryAction: "Buy YES",
    secondaryAction: "Buy NO",
    primaryPrice: "21c",
    secondaryPrice: "80c",
    payoutLabel: "YES pays if the final yield lands in range.",
    yesHint: "Pays if the yield lands between 4.9%–5.3%",
    noHint: "Pays if it finishes outside the band",
    yesCondition: "the final yield lands between 4.9% and 5.3%",
    noCondition: "the final yield finishes outside 4.9%–5.3%",
    sourceNote: "Tokenized T-bill basket",
  },
];
