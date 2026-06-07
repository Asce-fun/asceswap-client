"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
} from "lightweight-charts";
import type { LineData, MouseEventParams, Time, UTCTimestamp } from "lightweight-charts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bitcoin,
  Bookmark,
  CheckCircle2,
  FileSignature,
  Flame,
  Fuel,
  Gauge,
  Landmark,
  LineChart,
  Loader2,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageLayout } from "./components/PageLayout";
import { createOrderbookClient } from "./orderbook/client";
import type { SubmitOrderOutcome } from "./orderbook/schemas";
import { resolveSigningConfig } from "./protocol/clientConfig";
import {
  type ApiOrder,
  type Hex,
  type Outcome,
  type Side,
  parseCentsLabelToPriceWad,
  parseDecimalToUnits,
} from "./protocol/order";
import { pendingRecordFromSubmission, upsertPendingOrder } from "./state/orderStore";
import { buildBuyOrderFromCollateral, buildOrder } from "./trading/buildOrder";
import { signOrder, submitSignedOrder } from "./trading/placeLimitOrder";
import { formatAddress, useWallet } from "./wallet/WalletProvider";

type CategoryId =
  | "trending"
  | "rates"
  | "crypto"
  | "gas"
  | "yields"
  | "rwa"
  | "protocol";

type MetricFormat = "percent" | "usd" | "gwei" | "million";
type ChartMode = "underlying" | "depth" | "probability";

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

const chartModes: Array<{
  id: ChartMode;
  label: string;
  description: string;
}> = [
  { id: "underlying", label: "Underlying", description: "Observed metric path" },
  { id: "depth", label: "Depth", description: "Bid/ask liquidity ladder" },
  { id: "probability", label: "Probability", description: "Implied outcome skew" },
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

function formatShortHex(value: Hex) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function parseCompactUsd(value: string) {
  const numericValue = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numericValue)) return 0;
  if (value.toLowerCase().includes("m")) return numericValue * 1_000_000;
  if (value.toLowerCase().includes("k")) return numericValue * 1_000;
  return numericValue;
}

function getDistanceToBoundary(market: Market) {
  const denominator = Math.max(Math.abs(market.boundaryValue), 1);
  return ((market.currentValue - market.boundaryValue) / denominator) * 100;
}

function getsPaidAboveBoundary(market: Market) {
  return !["Below", "Floor"].includes(market.payoff);
}

function getMarketTone(market: Market) {
  const isAboveBoundary = market.currentValue >= market.boundaryValue;
  const favorable = getsPaidAboveBoundary(market) ? isAboveBoundary : !isAboveBoundary;

  return {
    favorable,
    stroke: favorable ? "#2ee59d" : "#ff5c7a",
    soft: favorable ? "rgba(46, 229, 157, 0.14)" : "rgba(255, 92, 122, 0.12)",
    text: favorable ? "text-[#2ee59d]" : "text-[#ff5c7a]",
  };
}

function getProbabilityBars(market: Market) {
  const distance = Math.max(Math.min(getDistanceToBoundary(market) / 18, 0.7), -0.7);
  const center = 0.5 + distance * 0.18;

  return Array.from({ length: 19 }, (_, index) => {
    const x = index / 18;
    const gaussian = Math.exp(-Math.pow((x - center) / 0.22, 2));
    const skew = getsPaidAboveBoundary(market) ? x * 0.18 : (1 - x) * 0.18;
    return Math.max(gaussian + skew, 0.08);
  });
}

function getDepthRows(market: Market, levels = 7) {
  const bid = Number(market.primaryPrice.replace(/[^0-9.]/g, ""));
  const ask = Number(market.secondaryPrice.replace(/[^0-9.]/g, ""));
  const liquidity = Math.max(parseCompactUsd(market.liquidity) / 1000, 12);

  return Array.from({ length: levels }, (_, index) => ({
    level: index + 1,
    bidPrice: Math.max(bid - index * 2, 1),
    askPrice: Math.min(ask + index * 2, 99),
    bidSize: Math.round(liquidity * (1 - index * 0.085)),
    askSize: Math.round(liquidity * (0.88 - index * 0.064)),
  }));
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

function getMovingAverageValues(points: number[], windowSize = 7) {
  return points.map((_, index) => {
    const window = points.slice(Math.max(index - windowSize + 1, 0), index + 1);
    return window.reduce((sum, point) => sum + point, 0) / window.length;
  });
}

function getSeriesAverageMove(points: number[]) {
  if (points.length < 2) return 0;
  const totalMove = points.slice(1).reduce((sum, point, index) => sum + Math.abs(point - points[index]), 0);
  return totalMove / (points.length - 1);
}

function getMarketImpliedValue(market: Market) {
  const priceWeight = parseCentsPrice(market.primaryPrice);
  return market.currentValue + (market.boundaryValue - market.currentValue) * priceWeight;
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

interface TradingChartPoint {
  time: UTCTimestamp;
  label: string;
  value: number;
  average: number;
  implied: number;
}

function getChartTimestamp(index: number, total: number) {
  const end = Date.UTC(2026, 5, 5, 12, 0, 0) / 1000;
  return (end - (total - index - 1) * 60 * 60) as UTCTimestamp;
}

function TradingUnderlyingChart({ market }: { market: Market }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartData = useMemo<TradingChartPoint[]>(() => {
    const averages = getMovingAverageValues(market.points);
    const implied = getMarketImpliedValue(market);

    return market.points.map((value, index) => ({
      time: getChartTimestamp(index, market.points.length),
      label: index === market.points.length - 1 ? "Live" : `T-${market.points.length - index - 1}h`,
      value,
      average: averages[index],
      implied,
    }));
  }, [market]);
  const dataByTime = useMemo(() => new Map(chartData.map((point) => [point.time, point])), [chartData]);
  const latestPoint = chartData[chartData.length - 1];
  const [activePoint, setActivePoint] = useState<TradingChartPoint>(latestPoint);
  const [tooltipPoint, setTooltipPoint] = useState<{ x: number; y: number } | null>(null);
  const openValue = market.points[0];
  const highValue = Math.max(...market.points);
  const lowValue = Math.min(...market.points);
  const seriesNoun = market.format === "percent" ? "rate" : "metric";

  useEffect(() => {
    setActivePoint(latestPoint);
  }, [latestPoint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: false,
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(2,5,5,0)" },
        textColor: "#8a968f",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(67,81,116,0.22)" },
        horzLines: { color: "rgba(67,81,116,0.22)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#62709a",
          labelBackgroundColor: "#11182f",
          style: LineStyle.Dashed,
          width: 1,
        },
        horzLine: {
          color: "#62709a",
          labelBackgroundColor: "#11182f",
          style: LineStyle.Dashed,
          width: 1,
        },
      },
      rightPriceScale: {
        borderColor: "#1b2d28",
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: "#1b2d28",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 1,
        barSpacing: 26,
      },
      localization: {
        priceFormatter: (price: number) => formatValue(price, market.format),
        timeFormatter: (time: Time) => {
          const point = dataByTime.get(Number(time) as UTCTimestamp);
          return point?.label ?? "";
        },
      },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: true,
      },
    });

    const underlyingSeries = chart.addSeries(AreaSeries, {
      lineColor: "#6f86ff",
      topColor: "rgba(111,134,255,0.24)",
      bottomColor: "rgba(111,134,255,0.02)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    const averageSeries = chart.addSeries(LineSeries, {
      color: "#cdd4ff",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const impliedSeries = chart.addSeries(LineSeries, {
      color: "#b86cff",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    underlyingSeries.setData(chartData.map(({ time, value }) => ({ time, value })));
    averageSeries.setData(chartData.map(({ time, average }) => ({ time, value: average })));
    impliedSeries.setData(chartData.map(({ time, implied }) => ({ time, value: implied })));
    underlyingSeries.createPriceLine({
      price: market.boundaryValue,
      color: "#f5b84b",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "Strike",
    });
    impliedSeries.createPriceLine({
      price: latestPoint.implied,
      color: "#b86cff",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: "Implied",
    });

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!param.point || param.time === undefined) {
        setActivePoint(latestPoint);
        setTooltipPoint(null);
        return;
      }

      const seriesPoint = param.seriesData.get(underlyingSeries) as LineData<Time> | undefined;
      const matchedPoint = dataByTime.get(Number(param.time) as UTCTimestamp);
      setActivePoint(matchedPoint ?? latestPoint);
      setTooltipPoint(seriesPoint ? { x: param.point.x, y: param.point.y } : null);
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    const resizeChart = () => {
      chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      chart.timeScale().fitContent();
    };
    const resizeObserver = new ResizeObserver(resizeChart);
    resizeObserver.observe(container);
    resizeChart();

    return () => {
      resizeObserver.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
    };
  }, [chartData, dataByTime, latestPoint, market.boundaryValue, market.format]);

  const tooltipX = tooltipPoint?.x ?? 0;
  const tooltipY = tooltipPoint?.y ?? 0;
  const tooltipTransform = `translate(${tooltipX > 520 ? "-205px" : "14px"}, ${tooltipY > 220 ? "-116px" : "-70px"})`;

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-md bg-[rgba(2,5,5,0.62)]">
      <div className="pointer-events-none absolute left-3 top-3 z-10 rounded bg-[rgba(4,8,10,0.78)] px-3 py-2 text-xs shadow-[0_12px_30px_rgba(0,0,0,0.26)]">
        <div className="font-mono font-semibold text-[#8da0b8]">
          {market.metric} O {formatValue(openValue, market.format)} H {formatValue(highValue, market.format)} L {formatValue(lowValue, market.format)} C {formatValue(activePoint.value, market.format)}
        </div>
        <div className="mt-2 grid gap-1 font-mono font-semibold">
          <div className="text-[#8ea0ff]">Underlying {seriesNoun} {formatValue(activePoint.value, market.format)}</div>
          <div className="text-[#d9deff]">7 obs average {seriesNoun} {formatValue(activePoint.average, market.format)}</div>
          <div className="text-[#d49aff]">Market implied {seriesNoun} {formatValue(activePoint.implied, market.format)}</div>
        </div>
      </div>
      {tooltipPoint ? (
        <div
          className="pointer-events-none absolute z-20 w-[190px] rounded-md border border-[#31405f] bg-[rgba(5,9,13,0.96)] p-3 font-mono text-xs shadow-[0_18px_40px_rgba(0,0,0,0.38)]"
          style={{ left: tooltipX, top: tooltipY, transform: tooltipTransform }}
        >
          <div className="font-semibold text-[#f2f5f3]">{activePoint.label}</div>
          <div className="mt-2 flex justify-between gap-3 text-[#8ea0ff]">
            <span>Underlying</span>
            <span className="font-semibold text-[#c9d2ff]">{formatValue(activePoint.value, market.format)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-3 text-[#d9deff]">
            <span>Average</span>
            <span className="font-semibold text-[#f2f5f3]">{formatValue(activePoint.average, market.format)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-3 text-[#d49aff]">
            <span>Implied</span>
            <span className="font-semibold">{formatValue(activePoint.implied, market.format)}</span>
          </div>
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function FeaturedChart({ market, mode }: { market: Market; mode: ChartMode }) {
  const width = 760;
  const height = 288;

  if (mode === "underlying") {
    return <TradingUnderlyingChart market={market} />;
  }

  if (mode === "depth") {
    const rows = getDepthRows(market);
    const maxSize = Math.max(...rows.flatMap((row) => [row.bidSize, row.askSize]));
    const centerX = width / 2;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[280px] w-full" role="img" aria-label={`${market.title} market depth chart`}>
        <rect x="24" y="20" width={width - 48} height={height - 40} rx="8" fill="rgba(2,5,5,0.54)" stroke="#16241f" />
        <text x="34" y="44" fill="#72e6b8" fontSize="11" fontWeight="800">BID DEPTH</text>
        <text x={width - 100} y="44" fill="#ff9cad" fontSize="11" fontWeight="800">ASK DEPTH</text>
        <line x1={centerX} x2={centerX} y1="54" y2={height - 24} stroke="#3f504a" strokeWidth="1" />
        {rows.map((row, index) => {
          const y = 62 + index * 29;
          const bidWidth = (row.bidSize / maxSize) * 270;
          const askWidth = (row.askSize / maxSize) * 270;

          return (
            <g key={row.level}>
              <rect x={centerX - bidWidth - 12} y={y} width={bidWidth} height="19" rx="3" fill="rgba(46,229,157,0.18)" />
              <rect x={centerX + 12} y={y} width={askWidth} height="19" rx="3" fill="rgba(255,92,122,0.16)" />
              <text x={centerX - 64} y={y + 14} fill="#d7ddd9" fontSize="12" fontWeight="700" textAnchor="end">{row.bidPrice.toFixed(0)}c</text>
              <text x={centerX - 20} y={y + 14} fill="#72e6b8" fontSize="11" textAnchor="end">{row.bidSize}K</text>
              <text x={centerX + 20} y={y + 14} fill="#ff9cad" fontSize="11">{row.askSize}K</text>
              <text x={centerX + 64} y={y + 14} fill="#d7ddd9" fontSize="12" fontWeight="700">{row.askPrice.toFixed(0)}c</text>
              {index < rows.length - 1 ? <line x1="34" x2={width - 34} y1={y + 25} y2={y + 25} stroke="#0c1916" /> : null}
            </g>
          );
        })}
        <text x={centerX - 8} y={height - 10} fill="#66756f" fontSize="12" textAnchor="end">Buy side</text>
        <text x={centerX + 8} y={height - 10} fill="#66756f" fontSize="12">Sell side</text>
      </svg>
    );
  }

  if (mode === "probability") {
    const bars = getProbabilityBars(market);
    const maxBar = Math.max(...bars);
    const barWidth = 22;
    const chartTop = 34;
    const chartBottom = height - 42;
    const strikeX = width / 2;

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full min-h-[280px] w-full" role="img" aria-label={`${market.title} probability distribution`}>
        <defs>
          <linearGradient id={`${market.id}-probability-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7cf3bd" stopOpacity="0.36" />
            <stop offset="100%" stopColor="#2ee59d" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <rect x="24" y="20" width={width - 48} height={height - 54} rx="8" fill="rgba(2,5,5,0.54)" stroke="#16241f" />
        {[0.25, 0.5, 0.75].map((tick) => {
          const y = chartTop + tick * (chartBottom - chartTop);
          return <line key={tick} x1="32" x2={width - 32} y1={y} y2={y} stroke="#0c1916" />;
        })}
        {bars.map((value, index) => {
          const x = 42 + index * ((width - 84) / (bars.length - 1));
          const barHeight = (value / maxBar) * (chartBottom - chartTop);
          const isAboveStrike = index / (bars.length - 1) >= 0.5;
          const favorable = getsPaidAboveBoundary(market) ? isAboveStrike : !isAboveStrike;

          return (
            <rect
              key={index}
              x={x - barWidth / 2}
              y={chartBottom - barHeight}
              width={barWidth}
              height={barHeight}
              rx="4"
              fill={favorable ? "url(#" + market.id + "-probability-fill)" : "rgba(255,92,122,0.16)"}
              stroke={favorable ? "rgba(46,229,157,0.18)" : "rgba(255,92,122,0.18)"}
            />
          );
        })}
        <line x1={strikeX} x2={strikeX} y1="28" y2={chartBottom} stroke="#f5b84b" strokeDasharray="8 7" strokeWidth="1.5" />
        <text x={strikeX + 10} y="48" fill="#f5c873" fontSize="12" fontWeight="700">Strike boundary</text>
        <text x="36" y="44" fill="#66756f" fontSize="11" fontWeight="800">IMPLIED DISTRIBUTION</text>
        <text x="34" y={height - 10} fill="#66756f" fontSize="12">Lower settlement</text>
        <text x={width - 136} y={height - 10} fill="#66756f" fontSize="12">Higher settlement</text>
      </svg>
    );
  }

  return null;
}

function MiniChart({ market }: { market: Market }) {
  const width = 220;
  const height = 74;
  const { min, max } = getChartRange(market.points, market.boundaryValue);
  const path = buildPath(market.points, width, height, min, max, 8);
  const boundaryY = getBoundaryY(market.boundaryValue, height, min, max, 8);
  const latest = getPoint(market.points, market.points.length - 1, width, height, min, max, 8);
  const tone = getMarketTone(market);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[74px] w-full" aria-hidden="true">
      <line x1="8" x2={width - 8} y1={height * 0.28} y2={height * 0.28} stroke="#10221d" strokeWidth="1" />
      <line x1="8" x2={width - 8} y1={height * 0.7} y2={height * 0.7} stroke="#10221d" strokeWidth="1" />
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
        stroke={tone.stroke}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={latest.x} cy={latest.y} r="3.5" fill={tone.stroke} />
    </svg>
  );
}

function OrderFlowPanel({ market }: { market: Market }) {
  const [activeTab, setActiveTab] = useState<"orderbook" | "settlement">("orderbook");
  const rows = getDepthRows(market, 12);
  const maxTotal = Math.max(...rows.flatMap((row) => [row.bidSize, row.askSize]));
  const askRows = rows
    .map((row) => ({
      price: row.askPrice,
      size: row.askSize,
      total: Math.round(row.askSize * (row.askPrice / 100) * 100) / 100,
    }))
    .reverse();
  const bidRows = rows.map((row) => ({
    price: row.bidPrice,
    size: row.bidSize,
    total: Math.round(row.bidSize * (row.bidPrice / 100) * 100) / 100,
  }));
  const activeOrders = [
    { side: market.primaryAction, price: market.primaryPrice, size: "120", status: "Open" },
    { side: market.secondaryAction, price: market.secondaryPrice, size: "80", status: "Resting" },
  ];
  const settlementRows = [
    { label: "Oracle observation", detail: market.oracle, status: "Live", hash: "0x8f2...a91" },
    { label: "Settlement window", detail: market.observation, status: "Pending", hash: "0x4b7...c32" },
    { label: "Maturity check", detail: market.maturity, status: "Queued", hash: "0xa13...f70" },
    { label: "Payout batch", detail: market.payoutLabel, status: "Ready", hash: "0x92c...1dd" },
  ];

  return (
    <aside className="flex min-h-[540px] flex-col border-t border-[#1b2d28] bg-[rgba(4,7,10,0.7)] text-xs xl:border-l xl:border-t-0 2xl:min-h-[588px]">
      <div className="grid grid-cols-2 border-b border-[#1b2d28]">
        <button
          type="button"
          onClick={() => setActiveTab("orderbook")}
          className={`h-10 text-sm font-semibold transition ${
            activeTab === "orderbook"
              ? "border-b border-[#6f86ff] bg-[#101735] text-[#f2f5f3]"
              : "text-[#66756f] hover:bg-[#0c1514] hover:text-[#d7ddd9]"
          }`}
        >
          Orderbook
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settlement")}
          className={`h-10 text-sm font-semibold transition ${
            activeTab === "settlement"
              ? "border-b border-[#6f86ff] bg-[#101735] text-[#f2f5f3]"
              : "text-[#66756f] hover:bg-[#0c1514] hover:text-[#d7ddd9]"
          }`}
        >
          Settlement Tx
        </button>
      </div>

      {activeTab === "orderbook" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-[#15231f] px-3 py-2">
            <span className="font-mono text-[#8a968f]">0.1%</span>
            <span className="rounded border border-[#f5b84b]/35 bg-[#2c2212] px-2 py-1 font-mono font-semibold text-[#f5c873]">
              {market.primaryPrice} / {market.secondaryPrice}
            </span>
          </div>

          <div className="grid grid-cols-[58px_1fr_1fr] gap-2 px-3 py-2 font-semibold uppercase tracking-[0.08em] text-[#66756f]">
            <span>Rate</span>
            <span className="text-right">Size</span>
            <span className="text-right">Total</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-2">
            {askRows.map((row) => (
              <div key={`ask-${row.price}`} className="relative grid h-6 grid-cols-[58px_1fr_1fr] items-center gap-2 overflow-hidden rounded-sm px-2 font-mono">
                <div
                  className="absolute inset-y-0 right-0 bg-[#ff5c7a]/12"
                  style={{ width: `${Math.max((row.size / maxTotal) * 100, 8)}%` }}
                />
                <span className="relative text-[#c97884]">{(row.price / 10).toFixed(1)}</span>
                <span className="relative text-right text-[#b6c0cf]">{row.size.toLocaleString("en-US")}</span>
                <span className="relative text-right text-[#b6c0cf]">{row.total.toLocaleString("en-US")}</span>
              </div>
            ))}

            <div className="my-2 flex items-center justify-between border-y border-[#15231f] px-2 py-2">
              <span className="font-semibold text-[#8a968f]">Mid</span>
              <span className="font-mono text-sm font-semibold text-[#f2f5f3]">
                {((Number(market.primaryPrice.replace(/[^0-9.]/g, "")) + Number(market.secondaryPrice.replace(/[^0-9.]/g, ""))) / 20).toFixed(1)}
              </span>
            </div>

            {bidRows.map((row) => (
              <div key={`bid-${row.price}`} className="relative grid h-6 grid-cols-[58px_1fr_1fr] items-center gap-2 overflow-hidden rounded-sm px-2 font-mono">
                <div
                  className="absolute inset-y-0 right-0 bg-[#2ee59d]/12"
                  style={{ width: `${Math.max((row.size / maxTotal) * 100, 8)}%` }}
                />
                <span className="relative text-[#72e6b8]">{(row.price / 10).toFixed(1)}</span>
                <span className="relative text-right text-[#b6c0cf]">{row.size.toLocaleString("en-US")}</span>
                <span className="relative text-right text-[#b6c0cf]">{row.total.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#15231f] p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#66756f]">Active orders</div>
            <div className="space-y-1.5">
              {activeOrders.map((order) => (
                <div key={order.side} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded border border-[#15231f] bg-[rgba(2,5,5,0.42)] px-2 py-1.5">
                  <span className="truncate font-semibold text-[#d7ddd9]">{order.side}</span>
                  <span className="font-mono text-[#f5c873]">{order.price}</span>
                  <span className="font-mono text-[#66756f]">{order.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#f2f5f3]">Settlement queue</div>
              <div className="mt-1 text-[11px] text-[#66756f]">{market.timeLeft} left</div>
            </div>
            <span className="rounded border border-[#2ee59d]/30 bg-[#10261f] px-2 py-1 font-mono text-[#72e6b8]">Live</span>
          </div>

          <div className="space-y-2">
            {settlementRows.map((row) => (
              <div key={row.hash} className="rounded border border-[#15231f] bg-[rgba(2,5,5,0.42)] p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#d7ddd9]">{row.label}</span>
                  <span className="font-mono text-[11px] text-[#6f86ff]">{row.hash}</span>
                </div>
                <div className="mt-1 truncate text-[#66756f]" title={row.detail}>{row.detail}</div>
                <div className="mt-2 inline-flex rounded border border-[#1d312b] px-2 py-0.5 font-mono text-[11px] text-[#8a968f]">{row.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function FeaturedMarket({ market }: { market: Market }) {
  const Icon = market.icon;
  const wallet = useWallet();
  const [orderAmount, setOrderAmount] = useState("100");
  const [chartMode, setChartMode] = useState<ChartMode>("underlying");
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>("yes");
  const [selectedSide, setSelectedSide] = useState<Side>("buy");
  const [signingStatus, setSigningStatus] = useState<"idle" | "connecting" | "signing" | "submitting" | "signed" | "submitted" | "error">("idle");
  const [signingError, setSigningError] = useState<string | null>(null);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [submitOutcome, setSubmitOutcome] = useState<SubmitOrderOutcome | null>(null);
  const [signedOrder, setSignedOrder] = useState<ApiOrder | null>(null);
  const [signature, setSignature] = useState<Hex | null>(null);
  const [usedDemoConfig, setUsedDemoConfig] = useState(false);
  const ticketPriceLabel = selectedOutcome === "yes" ? market.primaryPrice : market.secondaryPrice;
  const entryPrice = parseCentsPrice(ticketPriceLabel);
  const secondaryEntryPrice = parseCentsPrice(market.secondaryPrice);
  const orderValue = Math.max(Number(orderAmount) || 0, 0);
  const estimatedShares = entryPrice > 0 ? orderValue / entryPrice : 0;
  const maxPayout = estimatedShares;
  const estimatedProfit = Math.max(maxPayout - orderValue, 0);
  const payoutMultiple = orderValue > 0 ? maxPayout / orderValue : 0;
  const primaryPayoutMultiple = entryPrice > 0 ? 1 / entryPrice : 0;
  const secondaryPayoutMultiple = secondaryEntryPrice > 0 ? 1 / secondaryEntryPrice : 0;
  const impliedMetricValue = getMarketImpliedValue(market);
  const averageMove = getSeriesAverageMove(market.points);
  const chartLabel = market.format === "percent" ? "APR Chart" : `${market.metric} Chart`;
  const chartStats = [
    { label: "Underlying", value: formatValue(market.currentValue, market.format), tone: "text-[#c9d2ff]" },
    { label: "Market implied", value: formatValue(impliedMetricValue, market.format), tone: "text-[#d49aff]" },
    { label: "Strike", value: formatValue(market.boundaryValue, market.format), tone: "text-[#f5c873]" },
    { label: "Notional OI", value: market.openInterest, tone: "text-[#f2f5f3]" },
    { label: "24h volume", value: market.volume, tone: "text-[#f2f5f3]" },
    { label: "Avg move", value: `±${formatValue(averageMove, market.format)}`, tone: "text-[#f2f5f3]" },
  ];
  const isSigning = signingStatus === "connecting" || signingStatus === "signing" || signingStatus === "submitting";
  const ticketButtonLabel = isSigning
    ? signingStatus === "connecting" ? "Connecting wallet" : signingStatus === "submitting" ? "Submitting order" : "Open wallet request"
    : signingStatus === "submitted" ? "Submit again" : signingStatus === "signed" ? "Sign again" : wallet.account ? "Sign and submit" : "Connect and sign";

  useEffect(() => {
    setSignedOrder(null);
    setSignature(null);
    setSigningError(null);
    setSubmitWarning(null);
    setSubmitOutcome(null);
    setUsedDemoConfig(false);
    setSigningStatus((currentStatus) => currentStatus === "signed" || currentStatus === "submitted" ? "idle" : currentStatus);
  }, [market.id, ticketPriceLabel, orderAmount, selectedOutcome, selectedSide]);

  const handleSignPreview = async () => {
    try {
      setSigningError(null);
      setSigningStatus(wallet.account && wallet.chainId ? "signing" : "connecting");

      const connection = wallet.account && wallet.chainId
        ? { account: wallet.account, chainId: wallet.chainId }
        : await wallet.connect();
      const config = resolveSigningConfig(connection.chainId);

      if (config.chainId !== connection.chainId) {
        throw new Error(`Switch wallet to chain ${config.chainId} before signing.`);
      }

      const inputAmount = parseDecimalToUnits(orderAmount, 18);
      const priceWad = parseCentsLabelToPriceWad(ticketPriceLabel);
      const expiration = BigInt(Math.floor(Date.now() / 1000) + 60 * 60);
      const commonOrderInput = {
        maker: connection.account,
        marketId: market.id,
        outcome: selectedOutcome,
        priceWad,
        expiration,
        epoch: 0n,
        maxFeeRateBps: 50,
      };
      const order = selectedSide === "buy"
        ? buildBuyOrderFromCollateral({
            ...commonOrderInput,
            collateralAmount: inputAmount,
          })
        : buildOrder({
            ...commonOrderInput,
            side: "sell",
            claimAmount: inputAmount,
          });
      const domain = {
        name: "AsceSwap" as const,
        version: "1" as const,
        chainId: config.chainId,
        verifyingContract: config.verifyingContract,
      };

      setSigningStatus("signing");
      const nextSignature = await signOrder(order, wallet, domain);
      setSignedOrder(order);
      setSignature(nextSignature);
      setUsedDemoConfig(config.isDemoConfig);
      upsertPendingOrder(pendingRecordFromSubmission({ order, signature: nextSignature }));

      try {
        const orderbookClient = createOrderbookClient();
        setSigningStatus("submitting");
        const response = await submitSignedOrder(orderbookClient, order, nextSignature, {
          postOnly: false,
          restOnNoMatch: true,
        });
        setSubmitOutcome(response);
        upsertPendingOrder(pendingRecordFromSubmission({ order, signature: nextSignature, response }));
        setSigningStatus("submitted");
      } catch (submitError) {
        setSubmitWarning(submitError instanceof Error ? submitError.message : "Signed order was not submitted.");
        setSigningStatus("signed");
      }
    } catch (error) {
      setSigningError(error instanceof Error ? error.message : "Signing request failed.");
      setSigningStatus("error");
    }
  };

  return (
    <article className="glass-panel overflow-hidden rounded-lg">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_286px_280px] 2xl:grid-cols-[minmax(0,1fr)_318px_292px]">
        <div className="min-w-0 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getStatusStyle(market.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {market.status}
                </span>
                <span className="glass-control rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#8a96a3]">
                  {market.categoryLabel}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="glass-control flex h-9 w-9 shrink-0 items-center justify-center rounded-md">
                  <Icon className="h-5 w-5" style={{ color: market.iconTone }} />
                </div>
                <div className="min-w-0">
                  <h1 className="max-w-4xl text-lg font-semibold leading-tight text-[#f2f5f3] sm:text-xl">
                    {market.title}
                  </h1>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#8a96a3]">
                    <span className="glass-control rounded-md px-2 py-0.5">{market.resolution}</span>
                    <span className="glass-control rounded-md px-2 py-0.5">{market.payoff}</span>
                    <span className="glass-control rounded-md px-2 py-0.5">Scalar option</span>
                    <span className="glass-control rounded-md px-2 py-0.5">{market.observation}</span>
                    <span className="glass-control rounded-md px-2 py-0.5">{market.maturity}</span>
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

          <div className="mt-3 grid gap-2 border-y border-[#15231f] py-2 sm:grid-cols-3 xl:grid-cols-6">
            {chartStats.map((stat) => (
              <div key={stat.label} className="min-w-0">
                <div className={`font-mono text-sm font-semibold leading-tight ${stat.tone}`}>{stat.value}</div>
                <div className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.1em] text-[#66756f]">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setChartMode("underlying")}
                className={`h-8 rounded-md border px-3 text-xs font-semibold transition ${
                  chartMode === "underlying"
                    ? "border-[#6f86ff] bg-[#101735] text-[#c9d2ff]"
                    : "border-[#1d312b] bg-[rgba(4,10,10,0.72)] text-[#8a968f] hover:border-[#2b4c41] hover:text-[#f2f5f3]"
                }`}
              >
                {chartLabel}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["5m", "1H", "1D", "1W"].map((label) => (
                <button
                  key={label}
                  type="button"
                  className={`h-8 rounded-md px-2.5 text-xs font-semibold transition ${
                    label === "5m" ? "bg-[#101735] text-[#f2f5f3]" : "text-[#8a968f] hover:bg-[#0c1514] hover:text-[#f2f5f3]"
                  }`}
                >
                  {label}
                </button>
              ))}
              {chartModes.map((mode) => {
                if (mode.id === "underlying" || mode.id === "depth") return null;
                const isActive = mode.id === chartMode;

                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setChartMode(mode.id)}
                    className={`h-8 rounded-md border px-3 text-left text-xs font-semibold transition ${
                      isActive
                        ? "border-[#2ee59d]/45 bg-[#123026] text-[#2ee59d]"
                        : "border-[#1d312b] bg-[rgba(4,10,10,0.72)] text-[#8a968f] hover:border-[#2b4c41] hover:text-[#f2f5f3]"
                    }`}
                    title={mode.description}
                  >
                    {mode.label}
                  </button>
                );
              })}
              <button className="h-8 rounded-md border border-[#1d312b] bg-[rgba(4,10,10,0.72)] px-3 text-xs font-semibold text-[#8a968f] transition hover:border-[#2b4c41] hover:text-[#f2f5f3]">
                Indicators
              </button>
              <div className="ml-0 flex h-8 items-center gap-2 rounded-md border border-[#f5b84b]/30 bg-[rgba(44,34,18,0.62)] px-3 lg:ml-2">
                <span className="font-mono text-sm font-semibold text-[#f5c873]">{market.timeLeft}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#8a968f]">left</span>
                <span className="hidden text-xs text-[#66756f] sm:inline">Matures {market.maturity}</span>
              </div>
            </div>
          </div>

          <div className="mt-2 h-[430px] overflow-hidden rounded-md border border-[#1b2d28] bg-[rgba(2,5,5,0.72)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] 2xl:h-[480px]">
            <FeaturedChart market={market} mode={chartMode} />
          </div>
          <div className="mt-1 flex justify-end">
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-semibold text-[#3f504a] transition hover:text-[#66756f]"
            >
              Charting by TradingView
            </a>
          </div>
        </div>

        <OrderFlowPanel market={market} />

        <aside className="border-t border-[#1b2d28] bg-[rgba(3,7,7,0.68)] p-3 backdrop-blur-xl xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#f2f5f3]">Trade ticket</div>
              <div className="mt-0.5 text-[11px] text-[#65717d]">{market.payoutLabel}</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-md border border-[#1d312b] bg-[rgba(4,10,10,0.52)] p-1">
            {(["buy", "sell"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setSelectedSide(side)}
                className={`h-8 rounded text-xs font-semibold uppercase transition ${
                  selectedSide === side
                    ? "bg-[#123026] text-[#72e6b8]"
                    : "text-[#8a96a3] hover:bg-[#0c1514] hover:text-[#d7ddd9]"
                }`}
              >
                {side}
              </button>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSelectedOutcome("yes")}
              className={`h-12 rounded-md border px-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
                selectedOutcome === "yes"
                  ? "border-[#2ee59d] bg-[rgba(18,48,38,0.86)]"
                  : "border-[#2ee59d]/35 bg-[rgba(18,48,38,0.58)] hover:border-[#2ee59d]"
              }`}
            >
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-[#72e6b8]">
                YES
                <span className="font-mono">{primaryPayoutMultiple.toFixed(1)}x</span>
              </span>
              <span className="mt-0.5 block font-mono text-lg font-semibold text-[#f2f5f3]">{market.primaryPrice}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("no")}
              className={`h-12 rounded-md border px-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
                selectedOutcome === "no"
                  ? "border-[#ff5c7a] bg-[rgba(37,21,26,0.86)]"
                  : "border-[#ff5c7a]/28 bg-[rgba(37,21,26,0.58)] hover:border-[#ff5c7a]"
              }`}
            >
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-[#ff9cad]">
                NO
                <span className="font-mono">{secondaryPayoutMultiple.toFixed(1)}x</span>
              </span>
              <span className="mt-0.5 block font-mono text-lg font-semibold text-[#f2f5f3]">{market.secondaryPrice}</span>
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <div className="glass-control rounded-md p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#65717d]">
                  {selectedSide === "buy" ? "Order value" : "Claim size"}
                </span>
                <span className="text-xs text-[#8a96a3]">{selectedSide === "buy" ? "USDC" : "Claims"}</span>
              </div>
              <label className="flex items-center gap-2">
                <span className="font-mono text-lg font-semibold text-[#65717d]">$</span>
                <input
                  type="number"
                  min="0"
                  value={orderAmount}
                  onChange={(event) => setOrderAmount(event.target.value)}
                  className="h-8 min-w-0 flex-1 bg-transparent font-mono text-lg font-semibold text-[#f2f5f3] outline-none"
                  aria-label="Order value in USDC"
                />
              </label>
            </div>

            <div className="rounded-md border border-[#2ee59d]/25 bg-[rgba(12,36,29,0.52)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6fdcb4]">Expected payoff</span>
                <span className="rounded-sm bg-[#2ee59d]/12 px-2 py-0.5 font-mono text-xs font-semibold text-[#72e6b8]">
                  {payoutMultiple.toFixed(1)}x
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[11px] text-[#65717d]">Max payout</div>
                  <div className="mt-1 font-mono text-sm font-semibold text-[#f2f5f3]">{formatUsd(maxPayout)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-[#65717d]">Est. profit</div>
                  <div className="mt-1 font-mono text-sm font-semibold text-[#2ee59d]">+{formatUsd(estimatedProfit)}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-[#2ee59d]/14 pt-2 text-xs">
                <span className="text-[#65717d]">Estimated shares</span>
                <span className="font-mono font-semibold text-[#d7ddd9]">{estimatedShares.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignPreview}
            disabled={isSigning || wallet.status === "unavailable"}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#2ee59d] text-sm font-bold text-[#06100c] transition hover:bg-[#6fdcb4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            {ticketButtonLabel}
          </button>

          {wallet.status === "unavailable" ? (
            <div className="mt-2 flex gap-2 rounded-md border border-[#f5b84b]/28 bg-[rgba(44,34,18,0.42)] p-2 text-xs text-[#f5c873]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>No injected wallet detected.</span>
            </div>
          ) : null}

          {signingError ? (
            <div className="mt-2 flex gap-2 rounded-md border border-[#ff5c7a]/28 bg-[rgba(37,21,26,0.5)] p-2 text-xs text-[#ff9cad]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{signingError}</span>
            </div>
          ) : null}

          {submitWarning ? (
            <div className="mt-2 flex gap-2 rounded-md border border-[#f5b84b]/28 bg-[rgba(44,34,18,0.42)] p-2 text-xs text-[#f5c873]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{submitWarning}</span>
            </div>
          ) : null}

          {signature && signedOrder ? (
            <div className="mt-2 rounded-md border border-[#2ee59d]/24 bg-[rgba(12,36,29,0.48)] p-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#72e6b8]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {submitOutcome ? `Orderbook ${submitOutcome.outcome}` : "Signed only, not submitted"}
              </div>
              <div className="mt-2 grid gap-1 font-mono text-[11px] text-[#8a96a3]">
                <div className="flex justify-between gap-3">
                  <span>Maker</span>
                  <span className="text-[#d7ddd9]">{formatAddress(signedOrder.maker)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Order</span>
                  <span className="text-[#d7ddd9]">{signedOrder.claim} {signedOrder.side}</span>
                </div>
                {submitOutcome && "order_hash" in submitOutcome && submitOutcome.order_hash ? (
                  <div className="flex justify-between gap-3">
                    <span>Hash</span>
                    <span className="text-[#d7ddd9]">{formatShortHex(submitOutcome.order_hash)}</span>
                  </div>
                ) : null}
                {submitOutcome?.outcome === "matched" ? (
                  <div className="flex justify-between gap-3">
                    <span>Reservation</span>
                    <span className="text-[#d7ddd9]">{submitOutcome.reservation_id}</span>
                  </div>
                ) : null}
                <div className="flex justify-between gap-3">
                  <span>Salt</span>
                  <span className="text-[#d7ddd9]">{signedOrder.salt.slice(0, 8)}...{signedOrder.salt.slice(-6)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Signature</span>
                  <span className="text-[#d7ddd9]">{formatShortHex(signature)}</span>
                </div>
              </div>
              {submitOutcome?.outcome === "matched" ? (
                <div className="mt-2 rounded border border-[#6f86ff]/24 bg-[rgba(16,23,53,0.46)] px-2 py-1 text-[11px] text-[#c9d2ff]">
                  Match is pending execution and indexer confirmation.
                </div>
              ) : null}
              {usedDemoConfig ? (
                <div className="mt-2 rounded border border-[#f5b84b]/24 bg-[rgba(44,34,18,0.36)] px-2 py-1 text-[11px] text-[#f5c873]">
                  Demo domain: set NEXT_PUBLIC_ASCESWAP_CHAIN_ID and NEXT_PUBLIC_ASCESWAP_EXCHANGE_ADDRESS before production signing.
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

function MarketCard({ market }: { market: Market }) {
  const Icon = market.icon;
  const isPositive = market.change >= 0;
  const tone = getMarketTone(market);
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
            <div className="mt-1 truncate text-xs text-[#65717d]">{market.sourceNote}</div>
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
          <span className={`font-mono font-semibold ${tone.text}`}>{formatValue(market.currentValue, market.format)}</span>
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
          <div className="text-[#65717d]">OI</div>
          <div className="mt-1 font-mono font-semibold text-[#d7ddd9]">{market.openInterest}</div>
        </div>
        <div>
          <div className="text-[#65717d]">Max</div>
          <div className="mt-1 font-mono font-semibold text-[#2ee59d]">{payoutMultiple.toFixed(1)}x</div>
        </div>
      </div>
    </article>
  );
}

function MarketCategoryFilters({
  activeCategory,
  setActiveCategory,
}: {
  activeCategory: CategoryId;
  setActiveCategory: (category: CategoryId) => void;
}) {
  return (
    <div className="flex w-full max-w-full gap-1 overflow-x-auto rounded-md border border-[#1d312b] bg-[rgba(4,10,10,0.52)] p-1 2xl:w-max">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = category.id === activeCategory;
        const compactLabel = category.id === "protocol" ? "Protocol" : category.label;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            title={category.label}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded px-2 text-xs font-semibold transition xl:px-2.5 ${
              isActive
                ? "bg-[#123026] text-[#f2f5f3]"
                : "text-[#7d8996] hover:bg-[#0c1514] hover:text-[#d7ddd9]"
            }`}
          >
            <Icon className={isActive ? "h-3.5 w-3.5 text-[#7cf3bd]" : "h-3.5 w-3.5 text-[#66756f]"} />
            <span className="hidden xl:inline">{compactLabel}</span>
          </button>
        );
      })}
    </div>
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
    <PageLayout
      headerFilters={
        <MarketCategoryFilters activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      }
    >
      <div className="space-y-3 pt-3">
        <section>
          <FeaturedMarket market={featured} />
        </section>

        <section className="space-y-4">
          <div className="border-y border-[#15231f] py-4">
            <h2 className="text-xl font-semibold text-[#f2f5f3]">All markets</h2>
            <p className="mt-1 text-sm text-[#8a96a3]">Each card shows the observed variable against its payoff boundary.</p>
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
