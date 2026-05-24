"use client";

import React, { useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bitcoin,
  Bookmark,
  Flame,
  Fuel,
  Gauge,
  Landmark,
  LineChart,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageLayout } from "./components/PageLayout";

type CategoryId =
  | "trending"
  | "rates"
  | "crypto"
  | "gas"
  | "yields"
  | "rwa"
  | "protocol";

type MetricFormat = "percent" | "usd" | "gwei" | "million";

interface Market {
  id: string;
  title: string;
  category: Exclude<CategoryId, "trending">;
  categoryLabel: string;
  icon: LucideIcon;
  iconTone: string;
  status: "Live" | "Opening" | "Critical" | "Settles soon";
  timeLeft: string;
  minutesToExpiry: number;
  maturity: string;
  observation: string;
  resolution: "Spot" | "TWA" | "TWAP" | "Cumulative" | "Max" | "Min" | "Range";
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
  sourceNote: string;
  trendingRank?: number;
}

const categories: Array<{
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

const markets: Market[] = [
  {
    id: "aave-usdc-borrow-cap",
    title: "Aave USDC borrow APR above 12% for 30D",
    category: "rates",
    categoryLabel: "Rates",
    icon: TrendingUp,
    iconTone: "#6fdcb4",
    status: "Live",
    timeLeft: "4h 18m",
    minutesToExpiry: 258,
    maturity: "Jun 30, 2026",
    observation: "30D rolling window",
    resolution: "TWA",
    payoff: "Cap",
    oracle: "Aave v3 Ethereum adapter",
    metric: "Borrow APR",
    currentValue: 9.86,
    boundaryValue: 12,
    boundaryLabel: "Cap strike",
    format: "percent",
    points: [7.7, 8.1, 8.8, 8.4, 9.2, 10.6, 10.1, 11.4, 10.7, 9.8, 9.2, 9.7, 9.86],
    change: 0.82,
    volume: "$184K",
    liquidity: "$62K",
    openInterest: "$93K",
    primaryAction: "Buy Cap",
    secondaryAction: "Sell Cap",
    primaryPrice: "34c",
    secondaryPrice: "31c",
    payoutLabel: "Pays as APR clears strike",
    sourceNote: "USDC variable borrow rate",
    trendingRank: 1,
  },
  {
    id: "eth-base-fee-35",
    title: "Ethereum average gas fee above 35 gwei this week",
    category: "gas",
    categoryLabel: "Gas",
    icon: Fuel,
    iconTone: "#f5b84b",
    status: "Critical",
    timeLeft: "03:40",
    minutesToExpiry: 4,
    maturity: "May 25, 2026",
    observation: "Last 7D",
    resolution: "TWA",
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
    primaryAction: "Above",
    secondaryAction: "Below",
    primaryPrice: "46c",
    secondaryPrice: "55c",
    payoutLabel: "Settles on weekly TWA",
    sourceNote: "Base fee in gwei",
    trendingRank: 2,
  },
  {
    id: "btc-110k-month-end",
    title: "BTC closes above $110K at month end",
    category: "crypto",
    categoryLabel: "Crypto",
    icon: Bitcoin,
    iconTone: "#f59f34",
    status: "Live",
    timeLeft: "6d 9h",
    minutesToExpiry: 9200,
    maturity: "Jun 1, 2026",
    observation: "5:00 PM ET close",
    resolution: "Spot",
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
    primaryAction: "Above",
    secondaryAction: "Below",
    primaryPrice: "58c",
    secondaryPrice: "43c",
    payoutLabel: "Spot close threshold",
    sourceNote: "Reference exchange basket",
    trendingRank: 3,
  },
  {
    id: "morpho-usdc-floor",
    title: "Morpho USDC supply APY below 6% over next 30D",
    category: "yields",
    categoryLabel: "Yields",
    icon: Gauge,
    iconTone: "#4c8dff",
    status: "Live",
    timeLeft: "9d 11h",
    minutesToExpiry: 13620,
    maturity: "Jul 3, 2026",
    observation: "30D rolling window",
    resolution: "TWA",
    payoff: "Floor",
    oracle: "Morpho Blue USDC adapter",
    metric: "Supply APY",
    currentValue: 6.42,
    boundaryValue: 6,
    boundaryLabel: "Floor strike",
    format: "percent",
    points: [7.8, 7.3, 6.9, 6.6, 6.2, 6.5, 6.9, 6.7, 6.4, 6.1, 6.3, 6.5, 6.42],
    change: -0.28,
    volume: "$72K",
    liquidity: "$29K",
    openInterest: "$37K",
    primaryAction: "Buy Floor",
    secondaryAction: "Sell Floor",
    primaryPrice: "25c",
    secondaryPrice: "22c",
    payoutLabel: "Pays as APY falls below strike",
    sourceNote: "USDC supply side yield",
  },
  {
    id: "base-sequencer-revenue",
    title: "Base sequencer revenue above $8M this month",
    category: "protocol",
    categoryLabel: "Protocol",
    icon: Activity,
    iconTone: "#7aa7ff",
    status: "Live",
    timeLeft: "5d 2h",
    minutesToExpiry: 7320,
    maturity: "Jun 30, 2026",
    observation: "Calendar month",
    resolution: "Cumulative",
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
    primaryAction: "Above",
    secondaryAction: "Below",
    primaryPrice: "40c",
    secondaryPrice: "61c",
    payoutLabel: "Cumulative settlement",
    sourceNote: "Fees net of refunds",
  },
  {
    id: "tokenized-treasury-yield",
    title: "Tokenized Treasury yield lands between 4.9% and 5.3%",
    category: "rwa",
    categoryLabel: "RWA",
    icon: Landmark,
    iconTone: "#d4b06a",
    status: "Opening",
    timeLeft: "28d",
    minutesToExpiry: 40320,
    maturity: "Sep 30, 2026",
    observation: "Q3 final print",
    resolution: "Range",
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
    primaryAction: "In Range",
    secondaryAction: "Out",
    primaryPrice: "21c",
    secondaryPrice: "80c",
    payoutLabel: "Range settlement",
    sourceNote: "Tokenized T-bill basket",
  },
];

function formatValue(value: number, format: MetricFormat) {
  if (format === "usd") {
    if (value >= 100000) return `$${(value / 1000).toFixed(1)}K`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }

  if (format === "million") return `$${value.toFixed(2)}M`;
  if (format === "gwei") return `${value.toFixed(1)} gwei`;
  return `${value.toFixed(2)}%`;
}

function parseCentsPrice(price: string) {
  const cents = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(cents) && cents > 0 ? cents / 100 : 1;
}

function formatUsd(value: number) {
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getChartRange(points: number[], boundaryValue: number) {
  const low = Math.min(...points, boundaryValue);
  const high = Math.max(...points, boundaryValue);
  const padding = Math.max((high - low) * 0.18, high === low ? 1 : 0);

  return {
    min: low - padding,
    max: high + padding,
  };
}

function buildPath(points: number[], width: number, height: number, min: number, max: number, padding = 18) {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return points
    .map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * innerWidth;
      const y = padding + ((max - point) / Math.max(max - min, 1)) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function getPoint(points: number[], index: number, width: number, height: number, min: number, max: number, padding = 18) {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const x = padding + (index / Math.max(points.length - 1, 1)) * innerWidth;
  const y = padding + ((max - points[index]) / Math.max(max - min, 1)) * innerHeight;
  return { x, y };
}

function getBoundaryY(boundaryValue: number, height: number, min: number, max: number, padding = 18) {
  const innerHeight = height - padding * 2;
  return padding + ((max - boundaryValue) / Math.max(max - min, 1)) * innerHeight;
}

function getStatusStyle(status: Market["status"]) {
  if (status === "Critical") return "border-[#ff5c7a]/40 bg-[#2b151c] text-[#ff8ca0]";
  if (status === "Settles soon") return "border-[#f5b84b]/40 bg-[#2c2212] text-[#f5c873]";
  if (status === "Opening") return "border-[#4c8dff]/35 bg-[#132033] text-[#8fb5ff]";
  return "border-[#2ee59d]/30 bg-[#10261f] text-[#72e6b8]";
}

function FeaturedChart({ market }: { market: Market }) {
  const width = 760;
  const height = 288;
  const { min, max } = getChartRange(market.points, market.boundaryValue);
  const path = buildPath(market.points, width, height, min, max, 24);
  const boundaryY = getBoundaryY(market.boundaryValue, height, min, max, 24);
  const latest = getPoint(market.points, market.points.length - 1, width, height, min, max, 24);
  const first = getPoint(market.points, 0, width, height, min, max, 24);
  const areaPath = `${path} L ${latest.x.toFixed(2)} ${height - 24} L ${first.x.toFixed(2)} ${height - 24} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[280px] w-full" role="img" aria-label={`${market.title} underlying chart`}>
      <defs>
        <linearGradient id={`${market.id}-area`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4c8dff" stopOpacity="0.2" />
          <stop offset="72%" stopColor="#4c8dff" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[0.2, 0.4, 0.6, 0.8].map((tick) => {
        const y = 24 + tick * (height - 48);
        return <line key={tick} x1="24" x2={width - 24} y1={y} y2={y} stroke="#1d2a34" strokeWidth="1" />;
      })}

      {[0.25, 0.5, 0.75].map((tick) => {
        const x = 24 + tick * (width - 48);
        return <line key={tick} x1={x} x2={x} y1="24" y2={height - 24} stroke="#14202a" strokeWidth="1" />;
      })}

      <line
        x1="24"
        x2={width - 24}
        y1={boundaryY}
        y2={boundaryY}
        stroke="#f5b84b"
        strokeDasharray="8 7"
        strokeWidth="1.6"
      />
      <text x={width - 150} y={boundaryY - 10} fill="#f5c873" fontSize="12" fontWeight="700">
        {market.boundaryLabel} {formatValue(market.boundaryValue, market.format)}
      </text>

      <path d={areaPath} fill={`url(#${market.id}-area)`} />
      <path d={path} fill="none" stroke="#4c8dff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={latest.x} cy={latest.y} r="5" fill="#4c8dff" stroke="#101820" strokeWidth="3" />
      <circle cx={latest.x} cy={latest.y} r="13" fill="none" stroke="#4c8dff" strokeOpacity="0.2" strokeWidth="2" />

      <text x={latest.x - 90} y={Math.max(latest.y - 18, 28)} fill="#f2f5f3" fontSize="13" fontWeight="700">
        Current {formatValue(market.currentValue, market.format)}
      </text>

      <text x="24" y={height - 7} fill="#65717d" fontSize="12">
        Window start
      </text>
      <text x={width / 2 - 38} y={height - 7} fill="#65717d" fontSize="12">
        Observing
      </text>
      <text x={width - 96} y={height - 7} fill="#65717d" fontSize="12">
        Maturity
      </text>
    </svg>
  );
}

function MiniChart({ market }: { market: Market }) {
  const width = 220;
  const height = 74;
  const { min, max } = getChartRange(market.points, market.boundaryValue);
  const path = buildPath(market.points, width, height, min, max, 8);
  const boundaryY = getBoundaryY(market.boundaryValue, height, min, max, 8);
  const latest = getPoint(market.points, market.points.length - 1, width, height, min, max, 8);
  const isPositive = market.change >= 0;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[74px] w-full" aria-hidden="true">
      <line x1="8" x2={width - 8} y1={height * 0.28} y2={height * 0.28} stroke="#17242d" strokeWidth="1" />
      <line x1="8" x2={width - 8} y1={height * 0.7} y2={height * 0.7} stroke="#17242d" strokeWidth="1" />
      <line
        x1="8"
        x2={width - 8}
        y1={boundaryY}
        y2={boundaryY}
        stroke="#f5b84b"
        strokeDasharray="5 5"
        strokeOpacity="0.9"
        strokeWidth="1.3"
      />
      <path
        d={path}
        fill="none"
        stroke={isPositive ? "#4c8dff" : "#ff5c7a"}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={latest.x} cy={latest.y} r="3.5" fill={isPositive ? "#4c8dff" : "#ff5c7a"} />
    </svg>
  );
}

function CategoryStrip({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: CategoryId;
  setActiveCategory: (category: CategoryId) => void;
}) {
  return (
    <div className="sticky top-16 z-40 -mx-4 border-b border-[#1d2a34] bg-[rgba(8,11,15,0.88)] px-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-[1760px] items-center gap-2 overflow-x-auto py-3">
        {categories.map((category) => {
          const Icon = category.icon;
          const isActive = category.id === activeCategory;

          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#1a2730] text-[#f2f5f3]"
                  : "text-[#7d8996] hover:bg-[#121a21] hover:text-[#d7ddd9]"
              }`}
            >
              <Icon className={isActive ? "h-4 w-4 text-[#2ee59d]" : "h-4 w-4 text-[#65717d]"} />
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FeaturedMarket({ market }: { market: Market }) {
  const Icon = market.icon;
  const isPositive = market.change >= 0;
  const [orderAmount, setOrderAmount] = useState("100");
  const entryPrice = parseCentsPrice(market.primaryPrice);
  const orderValue = Math.max(Number(orderAmount) || 0, 0);
  const estimatedShares = entryPrice > 0 ? orderValue / entryPrice : 0;
  const maxPayout = estimatedShares;
  const estimatedProfit = Math.max(maxPayout - orderValue, 0);
  const payoutMultiple = orderValue > 0 ? maxPayout / orderValue : 0;

  return (
    <article className="glass-panel overflow-hidden rounded-lg">
      <div className="grid min-h-[520px] xl:grid-cols-[minmax(0,1fr)_318px]">
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${getStatusStyle(market.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {market.status}
                </span>
                <span className="glass-control rounded-md px-2 py-1 text-xs font-semibold text-[#8a96a3]">
                  {market.categoryLabel}
                </span>
                <span className="glass-control rounded-md px-2 py-1 font-mono text-xs font-semibold text-[#f5c873]">
                  {market.timeLeft}
                </span>
              </div>

              <div className="flex items-start gap-4">
                <div className="glass-control flex h-14 w-14 shrink-0 items-center justify-center rounded-md">
                  <Icon className="h-7 w-7" style={{ color: market.iconTone }} />
                </div>
                <div className="min-w-0">
                  <h1 className="max-w-4xl text-2xl font-semibold leading-tight text-[#f2f5f3] sm:text-3xl">
                    {market.title}
                  </h1>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#8a96a3]">
                    <span className="glass-control rounded-md px-2 py-1">{market.resolution}</span>
                    <span className="glass-control rounded-md px-2 py-1">{market.payoff}</span>
                    <span className="glass-control rounded-md px-2 py-1">{market.observation}</span>
                    <span className="glass-control rounded-md px-2 py-1">{market.maturity}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="glass-control flex h-9 w-9 items-center justify-center rounded-md text-[#8a96a3] transition hover:text-[#f2f5f3]">
                <Bookmark className="h-4 w-4" />
              </button>
              <button className="glass-control flex h-9 w-9 items-center justify-center rounded-md text-[#8a96a3] transition hover:text-[#f2f5f3]">
                <LineChart className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-7 h-[356px] rounded-md border border-[#20303a] bg-[rgba(4,9,13,0.56)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <FeaturedChart market={market} />
          </div>
        </div>

        <aside className="border-t border-[#23323d] bg-[rgba(6,11,15,0.62)] p-5 backdrop-blur-xl xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#f2f5f3]">{market.primaryAction}</div>
              <div className="mt-1 text-xs text-[#65717d]">{market.payoutLabel}</div>
            </div>
            <span
              className={`flex items-center gap-1 font-mono text-sm font-semibold ${
                isPositive ? "text-[#2ee59d]" : "text-[#ff5c7a]"
              }`}
            >
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              {Math.abs(market.change).toFixed(2)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="h-16 rounded-md border border-[#2ee59d]/35 bg-[rgba(18,48,38,0.72)] px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[#2ee59d]">
              <span className="block text-xs font-semibold text-[#72e6b8]">{market.primaryAction}</span>
              <span className="mt-1 block font-mono text-2xl font-semibold text-[#f2f5f3]">{market.primaryPrice}</span>
            </button>
            <button className="h-16 rounded-md border border-[#ff5c7a]/28 bg-[rgba(37,21,26,0.72)] px-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-[#ff5c7a]">
              <span className="block text-xs font-semibold text-[#ff9cad]">{market.secondaryAction}</span>
              <span className="mt-1 block font-mono text-2xl font-semibold text-[#f2f5f3]">{market.secondaryPrice}</span>
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <div className="glass-control rounded-md p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#65717d]">Order value</span>
                <span className="text-xs text-[#8a96a3]">USDC</span>
              </div>
              <label className="flex items-center gap-2">
                <span className="font-mono text-xl font-semibold text-[#65717d]">$</span>
                <input
                  type="number"
                  min="0"
                  value={orderAmount}
                  onChange={(event) => setOrderAmount(event.target.value)}
                  className="h-10 min-w-0 flex-1 bg-transparent font-mono text-2xl font-semibold text-[#f2f5f3] outline-none"
                  aria-label="Order value in USDC"
                />
              </label>
            </div>

            <div className="rounded-md border border-[#2ee59d]/25 bg-[rgba(12,36,29,0.52)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6fdcb4]">Expected payoff</span>
                <span className="rounded-sm bg-[#2ee59d]/12 px-2 py-0.5 font-mono text-xs font-semibold text-[#72e6b8]">
                  {payoutMultiple.toFixed(1)}x
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-[#65717d]">Max payout</div>
                  <div className="mt-1 font-mono text-lg font-semibold text-[#f2f5f3]">{formatUsd(maxPayout)}</div>
                </div>
                <div>
                  <div className="text-xs text-[#65717d]">Est. profit</div>
                  <div className="mt-1 font-mono text-lg font-semibold text-[#2ee59d]">+{formatUsd(estimatedProfit)}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-[#2ee59d]/14 pt-3 text-xs">
                <span className="text-[#65717d]">Estimated shares</span>
                <span className="font-mono font-semibold text-[#d7ddd9]">{estimatedShares.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button className="mt-4 h-11 w-full rounded-md bg-[#2ee59d] text-sm font-bold text-[#06100c] transition hover:bg-[#6fdcb4]">
            Preview order
          </button>
        </aside>
      </div>
    </article>
  );
}

function MarketCard({ market }: { market: Market }) {
  const Icon = market.icon;
  const isPositive = market.change >= 0;
  const payoutMultiple = 1 / parseCentsPrice(market.primaryPrice);

  return (
    <article className="glass-card group rounded-lg p-4 transition hover:border-[#416070]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="glass-control flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
            <Icon className="h-5 w-5" style={{ color: market.iconTone }} />
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-sm bg-[#15212a] px-1.5 py-0.5 text-[11px] font-bold text-[#8a96a3]">{market.resolution}</span>
              <span className="rounded-sm bg-[#15212a] px-1.5 py-0.5 text-[11px] font-bold text-[#8a96a3]">{market.payoff}</span>
            </div>
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#f2f5f3]">{market.title}</h3>
          </div>
        </div>
        <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#65717d] transition hover:bg-[#18232c] hover:text-[#d7ddd9]">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="glass-control mt-4 rounded-md p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#65717d]">{market.metric}</span>
          <span
            className={`flex items-center gap-1 font-mono text-xs font-semibold ${
              isPositive ? "text-[#2ee59d]" : "text-[#ff5c7a]"
            }`}
          >
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(market.change).toFixed(2)}
          </span>
        </div>
        <MiniChart market={market} />
        <div className="mt-1 flex items-center justify-between px-1 text-xs">
          <span className="font-mono font-semibold text-[#d7ddd9]">{formatValue(market.currentValue, market.format)}</span>
          <span className="font-mono text-[#f5c873]">{formatValue(market.boundaryValue, market.format)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="h-11 rounded-md border border-[#2ee59d]/32 bg-[rgba(18,48,38,0.68)] px-3 text-left transition hover:border-[#2ee59d]">
          <span className="block text-[11px] font-semibold text-[#72e6b8]">{market.primaryAction}</span>
          <span className="font-mono text-base font-semibold text-[#f2f5f3]">{market.primaryPrice}</span>
        </button>
        <button className="h-11 rounded-md border border-[#ff5c7a]/25 bg-[rgba(37,21,26,0.68)] px-3 text-left transition hover:border-[#ff5c7a]">
          <span className="block text-[11px] font-semibold text-[#ff9cad]">{market.secondaryAction}</span>
          <span className="font-mono text-base font-semibold text-[#f2f5f3]">{market.secondaryPrice}</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <div>
          <div className="text-[#65717d]">Ends</div>
          <div className="mt-1 font-mono font-semibold text-[#f5c873]">{market.timeLeft}</div>
        </div>
        <div>
          <div className="text-[#65717d]">Volume</div>
          <div className="mt-1 font-mono font-semibold text-[#d7ddd9]">{market.volume}</div>
        </div>
        <div>
          <div className="text-[#65717d]">Liq.</div>
          <div className="mt-1 font-mono font-semibold text-[#d7ddd9]">{market.liquidity}</div>
        </div>
        <div>
          <div className="text-[#65717d]">Max</div>
          <div className="mt-1 font-mono font-semibold text-[#2ee59d]">{payoutMultiple.toFixed(1)}x</div>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("trending");

  const visibleMarkets = useMemo(() => {
    if (activeCategory === "trending") {
      return markets
        .filter((market) => market.trendingRank)
        .sort((a, b) => Number(a.trendingRank) - Number(b.trendingRank));
    }

    return markets.filter((market) => market.category === activeCategory);
  }, [activeCategory]);

  const featured = markets[0];

  return (
    <PageLayout>
      <CategoryStrip activeCategory={activeCategory} setActiveCategory={setActiveCategory} />

      <div className="space-y-6 pt-5">
        <section>
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#8a96a3]">
              <Sparkles className="h-4 w-4 text-[#2ee59d]" />
              Live scalar payoff markets
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-[#f2f5f3] md:text-4xl">
              Trade the path of rates, prices, gas, yields, and protocol metrics.
            </h1>
          </div>
        </section>

        <section>
          <FeaturedMarket market={featured} />
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 border-y border-[#1d2a34] py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#f2f5f3]">All markets</h2>
              <p className="mt-1 text-sm text-[#8a96a3]">Each card shows the observed variable against its payoff boundary.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65717d]" />
                <input
                  aria-label="Search markets"
                  placeholder="Search markets"
                  className="h-10 w-full rounded-md border border-[#23323d] bg-[#0d141a] pl-9 pr-3 text-sm text-[#f2f5f3] outline-none transition placeholder:text-[#65717d] focus:border-[#2ee59d]"
                />
              </div>
              <button className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#23323d] bg-[#0d141a] text-[#8a96a3] transition hover:border-[#33505f] hover:text-[#f2f5f3]">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>

      </div>
    </PageLayout>
  );
}
