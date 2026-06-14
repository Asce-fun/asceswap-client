"use client";

import Image from "next/image";
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
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  FileSignature,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from "lucide-react";

import { PageLayout } from "../components/PageLayout";
import { getErc1155Balance, getErc20Balance, getMakerEpoch, getPositionIds } from "../contracts/asceswap";
import { ensureClaimApprovalForAll, ensureErc20Approval } from "../contracts/approvals";
import { getTwaSamples } from "../contracts/events";
import { createOrderbookClient } from "../orderbook/client";
import type { ApiEvent, OrderbookOrder, ReservationRecord, SubmitOrderOutcome } from "../orderbook/schemas";
import {
  ASCESWAP_ADDRESSES,
  ASCESWAP_CHAIN_ID,
  ASCESWAP_CHAIN_NAME,
  MUSDC_DECIMALS,
  getExplorerAddressUrl,
  getExplorerTxUrl,
} from "../protocol/constants";
import { resolveSigningConfig } from "../protocol/clientConfig";
import { formatUnits } from "../protocol/amounts";
import {
  type Address,
  type ApiOrder,
  type Hex,
  type Outcome,
  type Side,
  parseCentsLabelToPriceWad,
  parseDecimalToUnits,
} from "../protocol/order";
import { pendingRecordFromSubmission, upsertPendingOrder } from "../state/orderStore";
import { buildBuyOrderFromCollateral, buildOrder } from "../trading/buildOrder";
import { signOrder, submitSignedOrder } from "../trading/placeLimitOrder";
import { useWallet } from "../wallet/WalletProvider";
import { dealSentence, formatContracts, formatUsd } from "./copy";
import { categories, markets } from "./data";
import type { CategoryId, Market, MetricFormat } from "./data";
import { formatCountdown, formatMarketDate, getMarketTimeline } from "./timeline";

const chartRanges = ["1H", "1D", "2D", "1W"] as const;
type ChartRange = (typeof chartRanges)[number];
const chartPointIntervalMinutes = 15;
const activityFastPollMs = 2_000;
const activitySlowPollMs = 12_000;
const activityFastPollDurationMs = 30_000;
const maxCachedActivityEvents = 24;
const defaultOrderExpiryMinutes = 60;
const defaultMaxFeeRateBps = 50;
const submittedPopupAutoCloseMs = 3_000;
const chartRangePointCounts: Record<ChartRange, number> = {
  "1H": 5,
  "1D": 97,
  "2D": 193,
  "1W": 673,
};

function formatValue(value: number, format: MetricFormat) {
  if (format === "usd") {
    if (value >= 100000) return `$${(value / 1000).toFixed(1)}K`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  }

  if (format === "million") return `$${value.toFixed(2)}M`;
  if (format === "gwei") return `${value < 1 ? value.toFixed(4) : value.toFixed(1)} gwei`;
  return `${value.toFixed(2)}%`;
}

function getChainMismatchMessage(chainId: number | null) {
  return chainId && chainId !== ASCESWAP_CHAIN_ID
    ? `Switch wallet to ${ASCESWAP_CHAIN_NAME} (${ASCESWAP_CHAIN_ID}).`
    : null;
}

function parseCentsPrice(price: string) {
  const cents = Number(price.replace(/[^0-9.]/g, ""));
  return Number.isFinite(cents) && cents > 0 ? cents / 100 : 1;
}

function getCentsInputValue(price: string) {
  const cents = Number(price.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return Number.isInteger(cents) ? cents.toFixed(0) : cents.toFixed(2).replace(/\.?0+$/, "");
}

function formatCentsPrice(value: number) {
  const normalized = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2).replace(/\.?0+$/, "");
  return `${normalized}c`;
}

function formatShortHex(value: Hex) {
  return `${value.slice(0, 10)}...${value.slice(-8)}`;
}

function formatCompactHex(value: Hex) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatShortAddress(value: Hex) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatMusdc(value: bigint) {
  return `${formatUnits(value, MUSDC_DECIMALS, 2)} mUSDC`;
}

function useMarketClock(market: Market) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const updateClock = () => setNowMs(Date.now());

    updateClock();
    const interval = window.setInterval(updateClock, 1000);

    return () => window.clearInterval(interval);
  }, [market.id, market.startTimestamp, market.endTimestamp]);

  const timeline = nowMs === null ? null : getMarketTimeline(market, nowMs);
  const phase = timeline?.phase ?? "live";
  const targetTimestamp = timeline?.targetTimestamp ?? market.endTimestamp;
  const countdownLabel = timeline ? formatCountdown(timeline.remainingSeconds) : "--:--:--";
  const countdownSuffix = phase === "upcoming" ? "until open" : phase === "ended" ? "ended" : "left";
  const heading = phase === "upcoming" ? "Opens" : phase === "ended" ? "Ended" : "Expires";

  return {
    phase,
    status: timeline?.status ?? market.status,
    heading,
    countdownLabel,
    countdownSuffix,
    targetDateLabel: formatMarketDate(targetTimestamp),
    startDateLabel: formatMarketDate(market.startTimestamp),
    endDateLabel: formatMarketDate(market.endTimestamp),
  };
}

function parseCompactUsd(value: string) {
  const numericValue = Number(value.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(numericValue)) return 0;
  if (value.toLowerCase().includes("m")) return numericValue * 1_000_000;
  if (value.toLowerCase().includes("k")) return numericValue * 1_000;
  return numericValue;
}

function getsPaidAboveBoundary(market: Market) {
  return !["Below", "Floor"].includes(market.payoff);
}

function getMarketTone(market: Market) {
  const isAboveBoundary = market.currentValue >= market.boundaryValue;
  const favorable = getsPaidAboveBoundary(market) ? isAboveBoundary : !isAboveBoundary;

  return {
    favorable,
    stroke: favorable ? "#059669" : "#b94a5a",
    soft: favorable ? "rgba(5, 150, 105, 0.14)" : "rgba(185, 74, 90, 0.12)",
    text: favorable ? "text-[#047857]" : "text-[#b94a5a]",
  };
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

function getChartAverageWindow(range: ChartRange) {
  if (range === "1H") return 3;
  if (range === "1D") return 12;
  if (range === "2D") return 16;
  return 32;
}

function getSeriesNoiseAmplitude(market: Market) {
  if (market.format === "usd") return Math.max(market.currentValue * 0.0025, 250);
  if (market.format === "gwei") return Math.max(market.currentValue * 0.08, 0.0008);
  if (market.format === "million") return 0.045;
  return Math.max(market.currentValue * 0.015, 0.06);
}

function getStableSeed(value: string) {
  return value.split("").reduce((seed, character) => (seed * 31 + character.charCodeAt(0)) % 9973, 17);
}

function getHistoricalMarketPoints(market: Market) {
  const totalPoints = chartRangePointCounts["1W"];
  const intervalSeconds = chartPointIntervalMinutes * 60;
  const end = Math.min(Math.max(Math.floor(Date.now() / 1000), market.startTimestamp), market.endTimestamp);
  const seed = getStableSeed(market.id);
  const amplitude = getSeriesNoiseAmplitude(market);
  const anchors = market.points;
  const historicalPoints: number[] = [];

  for (let index = 0; index < totalPoints; index += 1) {
    const progress = index / (totalPoints - 1);
    const anchorPosition = progress * (anchors.length - 1);
    const leftIndex = Math.floor(anchorPosition);
    const rightIndex = Math.min(leftIndex + 1, anchors.length - 1);
    const mix = anchorPosition - leftIndex;
    const base = anchors[leftIndex] + (anchors[rightIndex] - anchors[leftIndex]) * mix;
    const intradayWave = Math.sin(index * 0.23 + seed) * amplitude;
    const weeklyWave = Math.sin(index * 0.037 + seed * 0.11) * amplitude * 0.75;
    const microMove = Math.sin(index * 0.91 + seed * 0.07) * amplitude * 0.22;
    const eventPulse = Math.exp(-Math.pow((progress - 0.58) / 0.045, 2)) * amplitude * (getsPaidAboveBoundary(market) ? 1.65 : -1.65);
    let value = base + intradayWave + weeklyWave + microMove + eventPulse;

    if (market.resolution === "Cumulative" && historicalPoints.length > 0) {
      value = Math.max(value, historicalPoints[historicalPoints.length - 1] + 0.002);
    }

    if (market.format !== "usd") value = Math.max(value, 0);
    historicalPoints.push(value);
  }

  historicalPoints[historicalPoints.length - 1] = market.currentValue;

  return historicalPoints.map((value, index) => ({
    time: (end - (totalPoints - index - 1) * intervalSeconds) as UTCTimestamp,
    value,
  }));
}

function formatChartTimestamp(timestamp: UTCTimestamp) {
  const date = new Date(Number(timestamp) * 1000);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = date.getUTCHours().toString().padStart(2, "0");
  const minutes = date.getUTCMinutes().toString().padStart(2, "0");

  return `${month} ${day} ${hours}:${minutes} UTC`;
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
  if (status === "Closing soon") return "border-[#e4a4ae] bg-[#fff0f3] text-[#9f3448]";
  if (status === "Settles soon") return "border-[#edcf94] bg-[#fff6df] text-[#8a5a12]";
  if (status === "Opening") return "border-[#c9d8f4] bg-[#f3f7ff] text-[#315f9c]";
  return "border-[#b7decf] bg-[#e3f5ee] text-[#047857]";
}

interface TradingChartPoint {
  time: UTCTimestamp;
  label: string;
  value: number;
  average: number;
}

type MarketMetricPoint = Readonly<{
  time: UTCTimestamp;
  value: number;
}>;

type LiveSamplesState = Readonly<{
  points: readonly MarketMetricPoint[];
  status: "idle" | "loading" | "live" | "fallback";
  message: string | null;
}>;

type MarketActivityState = Readonly<{
  orders: readonly OrderbookOrder[];
  events: readonly ApiEvent[];
  reservations: readonly ReservationRecord[];
  status: "idle" | "loading" | "live" | "error";
  message: string | null;
  updatedAt: number | null;
}>;

function useLiveTwaSamples(market: Market, chainId: number | null): LiveSamplesState {
  const [state, setState] = useState<LiveSamplesState>({
    points: [],
    status: "idle",
    message: null,
  });

  useEffect(() => {
    const provider = typeof window === "undefined" ? null : window.ethereum;

    if (!provider) {
      queueMicrotask(() => {
        setState({ points: [], status: "fallback", message: "Connect a wallet for live oracle samples." });
      });
      return;
    }

    if (chainId && chainId !== ASCESWAP_CHAIN_ID) {
      queueMicrotask(() => {
        setState({ points: [], status: "fallback", message: getChainMismatchMessage(chainId) });
      });
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setState((current) => ({ ...current, status: "loading", message: "Loading oracle samples..." }));
      }
    });

    const loadSamples = async () => {
      try {
        const samples = await getTwaSamples({
          provider,
          adapter: market.adapter,
          marketId: market.id,
          fromBlock: market.chartFromBlock,
        });
        if (cancelled) return;

        const points = samples.map((sample) => ({
          time: Number(sample.sampleAt) as UTCTimestamp,
          value: formatTwaSampleValue(market, sample.valueWad),
        }));

        setState({
          points,
          status: points.length > 0 ? "live" : "fallback",
          message: points.length > 0 ? "Live adapter samples" : "No adapter samples found yet.",
        });
      } catch (error) {
        if (cancelled) return;
        setState({
          points: [],
          status: "fallback",
          message: error instanceof Error ? error.message : "Could not load oracle samples.",
        });
      }
    };

    void loadSamples();

    return () => {
      cancelled = true;
    };
  }, [chainId, market]);

  return state;
}

function useMarketActivity(
  market: Market,
  maker: Address | null,
  refreshKey: number,
  trackedOrderHash: Hex | null,
  trackedReservationId: string | null,
): MarketActivityState {
  const [state, setState] = useState<MarketActivityState>({
    orders: [],
    events: [],
    reservations: [],
    status: "idle",
    message: null,
    updatedAt: null,
  });
  const fastPollUntilRef = useRef(0);
  const loadActivityRef = useRef<((options: Readonly<{ showLoading: boolean; forceOrders: boolean }>) => void) | null>(null);
  const trackedOrderHashRef = useRef<Hex | null>(trackedOrderHash);
  const trackedReservationIdRef = useRef<string | null>(trackedReservationId);

  useEffect(() => {
    trackedOrderHashRef.current = trackedOrderHash;
    trackedReservationIdRef.current = trackedReservationId;
  }, [trackedOrderHash, trackedReservationId]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | null = null;
    let nextEventSequence = 0;
    let cachedOrders: readonly OrderbookOrder[] = [];
    let cachedEvents: readonly ApiEvent[] = [];
    let cachedReservations: readonly ReservationRecord[] = [];
    let loading = false;
    const makerAddress = maker?.toLowerCase() ?? null;

    if (!makerAddress || !maker) {
      loadActivityRef.current = null;
      setState({
        orders: [],
        events: [],
        reservations: [],
        status: "idle",
        message: "Connect wallet to view account activity.",
        updatedAt: null,
      });
      return () => {
        cancelled = true;
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
      };
    }

    const publishActivity = (message: string | null = null) => {
      setState({
        orders: cachedOrders.slice(0, 8),
        events: cachedEvents,
        reservations: cachedReservations,
        status: "live",
        message,
        updatedAt: Date.now(),
      });
    };

    const loadOrders = async (orderbookClient: ReturnType<typeof createOrderbookClient>) => {
      const ordersResponse = await orderbookClient.getOrders({ maker });
      cachedOrders = ordersResponse.orders
        .filter((row) => row.order.market_id.toLowerCase() === market.id.toLowerCase())
        .filter((row) => row.order.maker.toLowerCase() === makerAddress);
    };

    const loadReservations = async (orderbookClient: ReturnType<typeof createOrderbookClient>) => {
      const orderHash = trackedOrderHashRef.current;
      if (!orderHash) {
        cachedReservations = [];
        return;
      }

      const reservationsResponse = await orderbookClient.getReservations({ orderHash, limit: 10 });
      const reservationId = trackedReservationIdRef.current;
      cachedReservations = reservationsResponse.reservations.filter((reservation) => {
        if (reservationId && reservation.reservation_id !== reservationId) return false;
        return !reservation.order_hash || reservation.order_hash.toLowerCase() === orderHash.toLowerCase();
      });
    };

    const loadEvents = async (orderbookClient: ReturnType<typeof createOrderbookClient>) => {
      const eventsResponse = await orderbookClient.getEvents({ fromSequence: nextEventSequence, limit: 100 });
      const highestSequence = getHighestActivitySequence(eventsResponse.events, eventsResponse.sequence);

      if (highestSequence >= nextEventSequence) {
        nextEventSequence = highestSequence + 1;
      } else if (nextEventSequence === 0) {
        nextEventSequence = 1;
      }

      const relevantEvents = filterAccountEvents(
        eventsResponse.events,
        market.id,
        cachedOrders,
        trackedOrderHashRef.current,
        trackedReservationIdRef.current,
      );
      cachedEvents = mergeActivityEvents(cachedEvents, relevantEvents);

      return relevantEvents.some(isExecutionConfirmedEvent);
    };

    const loadActivity = async (options: Readonly<{ showLoading: boolean; forceOrders: boolean }>) => {
      if (loading) return;
      loading = true;

      if (options.showLoading) {
        setState((current) => ({ ...current, status: "loading", message: "Loading account activity..." }));
      }

      try {
        const orderbookClient = createOrderbookClient();
        if (options.forceOrders || cachedOrders.length === 0) {
          await loadOrders(orderbookClient);
        }
        await loadReservations(orderbookClient);

        const shouldRefetchOrders = await loadEvents(orderbookClient);

        if (shouldRefetchOrders) {
          await loadOrders(orderbookClient);
          await loadReservations(orderbookClient);
        }

        if (cancelled) return;

        publishActivity();
      } catch (error) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          status: "error",
          message: error instanceof Error ? error.message : "Could not load orderbook activity.",
          updatedAt: Date.now(),
        }));
      } finally {
        loading = false;
      }
    };

    const scheduleNextPoll = () => {
      if (cancelled) return;

      const delay = Date.now() < fastPollUntilRef.current ? activityFastPollMs : activitySlowPollMs;
      timeoutId = window.setTimeout(() => {
        void loadActivity({ showLoading: false, forceOrders: false }).finally(scheduleNextPoll);
      }, delay);
    };

    loadActivityRef.current = (options) => {
      void loadActivity(options);
    };

    void loadActivity({ showLoading: true, forceOrders: true }).finally(scheduleNextPoll);

    return () => {
      cancelled = true;
      loadActivityRef.current = null;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [maker, market.id]);

  useEffect(() => {
    if (refreshKey <= 0) return;

    fastPollUntilRef.current = Date.now() + activityFastPollDurationMs;
    loadActivityRef.current?.({ showLoading: false, forceOrders: true });
  }, [refreshKey]);

  return state;
}

function filterAccountEvents(
  events: readonly ApiEvent[],
  marketId: Hex,
  orders: readonly OrderbookOrder[],
  trackedOrderHash: Hex | null,
  trackedReservationId: string | null,
) {
  const orderHashes = new Set(
    orders
      .map((row) => row.order_hash?.toLowerCase())
      .filter((orderHash): orderHash is string => Boolean(orderHash)),
  );
  if (trackedOrderHash) {
    orderHashes.add(trackedOrderHash.toLowerCase());
  }

  const reservationIds = new Set(
    orders
      .map((row) => row.reservation_id)
      .filter((reservationId): reservationId is string => Boolean(reservationId)),
  );
  if (trackedReservationId) {
    reservationIds.add(trackedReservationId);
  }

  const marketEvents = events.filter((event) => !event.market_id || event.market_id.toLowerCase() === marketId.toLowerCase());

  for (const event of marketEvents) {
    if (event.order_hash && orderHashes.has(event.order_hash.toLowerCase()) && event.reservation_id) {
      reservationIds.add(event.reservation_id);
    }
  }

  return marketEvents.filter((event) => {
    if (event.order_hash && orderHashes.has(event.order_hash.toLowerCase())) return true;
    return Boolean(event.reservation_id && reservationIds.has(event.reservation_id));
  });
}

function getHighestActivitySequence(events: readonly ApiEvent[], responseSequence?: number) {
  return events.reduce((highest, event) => Math.max(highest, event.sequence), responseSequence ?? -1);
}

function mergeActivityEvents(existingEvents: readonly ApiEvent[], incomingEvents: readonly ApiEvent[]) {
  const eventsByKey = new Map<string, ApiEvent>();

  for (const event of [...existingEvents, ...incomingEvents]) {
    eventsByKey.set(getActivityEventKey(event), event);
  }

  return [...eventsByKey.values()]
    .sort((left, right) => left.sequence - right.sequence)
    .slice(-maxCachedActivityEvents);
}

function getActivityEventKey(event: ApiEvent) {
  return `${event.sequence}:${event.kind}:${event.order_hash ?? ""}:${event.reservation_id ?? ""}`;
}

function isExecutionConfirmedEvent(event: ApiEvent) {
  const kind = normalizeEventKind(event.kind);
  return kind === "reservation_committed" || kind === "order_filled";
}

function normalizeEventKind(kind: string) {
  return kind.replace(/\./g, "_");
}

function isCommittedReservationStatus(status: string | undefined) {
  const normalizedStatus = status?.replace(/\./g, "_");
  return normalizedStatus === "reservation_committed"
    || normalizedStatus === "committed"
    || normalizedStatus === "filled"
    || normalizedStatus === "order_filled";
}

function getActivityOrderTxHash(
  row: OrderbookOrder,
  events: readonly ApiEvent[],
  reservations: readonly ReservationRecord[],
) {
  const orderHash = row.order_hash ?? null;
  const reservationId = row.reservation_id ?? null;
  const submittedEvent = [...events].reverse().find((event) => (
    event.tx_hash && isOrderActivityMatch(event, orderHash, reservationId)
  ));

  if (submittedEvent?.tx_hash) return submittedEvent.tx_hash;

  return reservations.find((reservation) => (
    reservation.tx_hash && isOrderActivityMatch(reservation, orderHash, reservationId)
  ))?.tx_hash;
}

function isOrderActivityExecuted(
  row: OrderbookOrder,
  events: readonly ApiEvent[],
  reservations: readonly ReservationRecord[],
) {
  const orderHash = row.order_hash ?? null;
  const reservationId = row.reservation_id ?? null;

  return row.status === "filled"
    || row.status === "settled"
    || events.some((event) => isOrderActivityMatch(event, orderHash, reservationId) && isExecutionConfirmedEvent(event))
    || reservations.some((reservation) => (
      isOrderActivityMatch(reservation, orderHash, reservationId)
      && isCommittedReservationStatus(reservation.status)
    ));
}

function isOrderActivityMatch(
  record: Readonly<{ order_hash?: Hex; reservation_id?: string }>,
  orderHash: Hex | null,
  reservationId: string | null,
) {
  if (orderHash && record.order_hash?.toLowerCase() === orderHash.toLowerCase()) return true;
  return Boolean(reservationId && record.reservation_id === reservationId);
}

function getActivityStatusClassName(status: OrderbookOrder["status"], hasTxHash: boolean) {
  if (hasTxHash || status === "filled" || status === "settled") return "text-[#315f9c]";
  if (status === "rejected" || status === "cancelled" || status === "inactive") return "text-[#9f3448]";
  if (status === "open") return "text-[#047857]";
  return "text-[#5c6b64]";
}

function formatTwaSampleValue(market: Market, valueWad: bigint) {
  if (market.valueDisplay === "aprPercent") {
    return Number(valueWad) / 1e18 * 100;
  }

  return Number(valueWad) / 1e18;
}

function getOrderClaimAmount(order: ApiOrder) {
  return BigInt(order.side === "buy" ? order.taker_amount : order.maker_amount);
}

function getOrderCollateralAmount(order: ApiOrder) {
  return BigInt(order.side === "buy" ? order.maker_amount : order.taker_amount);
}

function formatOrderPrice(order: ApiOrder) {
  const claimAmount = getOrderClaimAmount(order);
  const collateralAmount = getOrderCollateralAmount(order);
  if (claimAmount <= 0n) return "--";

  const centsTimes100 = (collateralAmount * 10_000n) / claimAmount;
  const whole = centsTimes100 / 100n;
  const fraction = centsTimes100 % 100n;
  return fraction === 0n ? `${whole}c` : `${whole}.${fraction.toString().padStart(2, "0")}c`;
}

function formatActivityTime(timestamp: number | null) {
  if (!timestamp) return "never";

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(timestamp));
}

function TradingMetricChart({
  market,
  range,
  livePoints,
}: {
  market: Market;
  range: ChartRange;
  livePoints: readonly MarketMetricPoint[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const history = useMemo(() => (
    livePoints.length > 0 ? livePoints : getHistoricalMarketPoints(market)
  ), [livePoints, market]);
  const visiblePoints = useMemo(() => {
    const pointCount = chartRangePointCounts[range];
    return history.slice(-Math.min(pointCount, history.length));
  }, [history, range]);
  const chartData = useMemo<TradingChartPoint[]>(() => {
    const values = visiblePoints.map((point) => point.value);
    const averages = getMovingAverageValues(values, getChartAverageWindow(range));

    return visiblePoints.map((point, index) => ({
      time: point.time,
      label: index === visiblePoints.length - 1 ? "Live" : formatChartTimestamp(point.time),
      value: point.value,
      average: averages[index],
    }));
  }, [range, visiblePoints]);
  const dataByTime = useMemo(() => new Map(chartData.map((point) => [point.time, point])), [chartData]);
  const latestPoint = chartData[chartData.length - 1];
  const [activePoint, setActivePoint] = useState<TradingChartPoint>(latestPoint);
  const [tooltipPoint, setTooltipPoint] = useState<{ x: number; y: number } | null>(null);

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
        textColor: "#5c6b64",
        fontSize: 11,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(138,160,150,0.28)" },
        horzLines: { color: "rgba(138,160,150,0.28)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "#5c6b64",
          labelBackgroundColor: "#0c1a15",
          style: LineStyle.Dashed,
          width: 1,
        },
        horzLine: {
          color: "#5c6b64",
          labelBackgroundColor: "#0c1a15",
          style: LineStyle.Dashed,
          width: 1,
        },
      },
      rightPriceScale: {
        borderColor: "#cfe0d8",
        entireTextOnly: true,
      },
      timeScale: {
        borderColor: "#cfe0d8",
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

    const metricSeries = chart.addSeries(AreaSeries, {
      lineColor: "#059669",
      topColor: "rgba(5,150,105,0.2)",
      bottomColor: "rgba(5,150,105,0.02)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    const averageSeries = chart.addSeries(LineSeries, {
      color: "#4d7a68",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    metricSeries.setData(chartData.map(({ time, value }) => ({ time, value })));
    averageSeries.setData(chartData.map(({ time, average }) => ({ time, value: average })));
    metricSeries.createPriceLine({
      price: market.boundaryValue,
      color: "#b7791f",
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: market.boundaryLabel,
    });

    const handleCrosshairMove = (param: MouseEventParams<Time>) => {
      if (!param.point || param.time === undefined) {
        setActivePoint(latestPoint);
        setTooltipPoint(null);
        return;
      }

      const seriesPoint = param.seriesData.get(metricSeries) as LineData<Time> | undefined;
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
  }, [chartData, dataByTime, latestPoint, market.boundaryLabel, market.boundaryValue, market.format]);

  const tooltipX = tooltipPoint?.x ?? 0;
  const tooltipY = tooltipPoint?.y ?? 0;
  const tooltipTransform = `translate(${tooltipX > 520 ? "-205px" : "14px"}, ${tooltipY > 220 ? "-116px" : "-70px"})`;

  return (
    <div className="relative h-full min-h-[280px] w-full overflow-hidden rounded-md bg-[#f7fbf9]">
      {tooltipPoint ? (
        <div
          className="pointer-events-none absolute z-20 w-[190px] rounded-md border border-[#cfe0d8] bg-white/95 p-3 font-mono text-xs shadow-[0_18px_40px_rgba(64,86,74,0.16)]"
          style={{ left: tooltipX, top: tooltipY, transform: tooltipTransform }}
        >
          <div className="font-semibold text-[#0c1a15]">{activePoint.label}</div>
          <div className="mt-2 flex justify-between gap-3 text-[#047857]">
            <span>{market.metric}</span>
            <span className="font-semibold text-[#0c1a15]">{formatValue(activePoint.value, market.format)}</span>
          </div>
          <div className="mt-1 flex justify-between gap-3 text-[#5c6b64]">
            <span>Average</span>
            <span className="font-semibold text-[#0c1a15]">{formatValue(activePoint.average, market.format)}</span>
          </div>
        </div>
      ) : null}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function FeaturedChart({
  market,
  liveSamples,
}: {
  market: Market;
  liveSamples: LiveSamplesState;
}) {
  const [activeRange, setActiveRange] = useState<ChartRange>("1W");
  const chartLabel = market.metric;

  return (
    <div className="flex h-full min-h-[280px] w-full flex-col overflow-hidden rounded-md bg-[#f7fbf9]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[#cfe0d8] bg-white/72 px-3 py-2">
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-semibold text-[#0c1a15]">{chartLabel}</span>
          <span className="rounded border border-[#cfe0d8] bg-[#eef7f2] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#5c6b64]">
            {chartPointIntervalMinutes}-min intervals
          </span>
          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${
            liveSamples.status === "live"
              ? "border-[#b7decf] bg-[#e3f5ee] text-[#047857]"
              : liveSamples.status === "loading"
                ? "border-[#c9d8f4] bg-[#f3f7ff] text-[#315f9c]"
                : "border-[#edcf94] bg-[#fff6df] text-[#8a5a12]"
          }`}>
            {liveSamples.status === "live" ? "adapter live" : liveSamples.status}
          </span>
        </div>
        <div className="flex rounded bg-[#edf7f2] p-0.5">
          {chartRanges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setActiveRange(range)}
              className={`h-7 rounded px-2.5 font-mono text-[11px] font-semibold transition ${
                activeRange === range
                  ? "bg-white text-[#047857] shadow-[0_1px_6px_rgba(64,86,74,0.1)]"
                  : "text-[#5c6b64] hover:bg-white/70 hover:text-[#0c1a15]"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <TradingMetricChart market={market} range={activeRange} livePoints={liveSamples.points} />
      </div>
      {liveSamples.message ? (
        <div className="border-t border-[#cfe0d8] bg-white/72 px-3 py-1.5 text-[11px] text-[#5c6b64]">
          {liveSamples.message}
        </div>
      ) : null}
    </div>
  );
}

function MarketActivityPanel({
  market,
  activity,
  onRefresh,
}: {
  market: Market;
  activity: MarketActivityState;
  onRefresh: () => void;
}) {
  const visibleOrders = activity.orders.slice(0, 5);
  const hasOrders = visibleOrders.length > 0;
  const isLoading = activity.status === "loading";

  return (
    <section className="mt-2 overflow-hidden rounded-md border border-[#cfe0d8] bg-white/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cfe0d8] px-3 py-2">
        <div>
          <div className="text-sm font-semibold text-[#0c1a15]">Market activity</div>
          <div className="mt-0.5 font-mono text-[11px] text-[#5c6b64]">Updated {formatActivityTime(activity.updatedAt)}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded border px-2 py-1 font-mono text-[11px] ${
            activity.status === "error"
              ? "border-[#e4a4ae] bg-[#fff0f3] text-[#9f3448]"
              : "border-[#b7decf] bg-[#e3f5ee] text-[#047857]"
          }`}>
            {activity.status === "error" ? "API error" : isLoading ? "Loading" : activity.status === "idle" ? "Wallet" : "Live"}
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="flex h-7 w-7 items-center justify-center rounded border border-[#cfe0d8] bg-[#eef7f2] text-[#5c6b64] transition hover:border-[#9fcfba] hover:text-[#047857]"
            aria-label="Refresh market activity"
            title="Refresh market activity"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {activity.message ? (
        <div className="border-b border-[#cfe0d8] bg-[#fff6df] px-3 py-1.5 text-xs text-[#8a5a12]">{activity.message}</div>
      ) : null}

      <div className="p-2.5">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c6b64]">Your orders in this market</span>
            <span className="font-mono text-[11px] text-[#5c6b64]">{activity.orders.length} rows</span>
          </div>
          <div className="grid grid-cols-[52px_58px_minmax(56px,1fr)_86px] gap-1.5 border-b border-[#cfe0d8] px-1.5 pb-1.5 font-semibold uppercase tracking-[0.08em] text-[#5c6b64] text-[10px]">
            <span>Side</span>
            <span className="text-right">Price</span>
            <span className="text-right">Size</span>
            <span className="text-right">Status</span>
          </div>
          <div className="max-h-[164px] overflow-auto pr-1">
            {hasOrders ? visibleOrders.map((row, index) => {
              const order = row.order;
              const isBuy = order.side === "buy";
              const txHash = getActivityOrderTxHash(row, activity.events, activity.reservations);
              const isExecuted = isOrderActivityExecuted(row, activity.events, activity.reservations);
              const statusLabel = txHash ? isExecuted ? "filled" : "tx sent" : row.status;
              const statusClassName = getActivityStatusClassName(row.status, Boolean(txHash));
              return (
                <div
                  key={`${row.order_hash ?? order.salt}-${index}`}
                  className="grid min-h-8 grid-cols-[52px_58px_minmax(56px,1fr)_86px] items-center gap-1.5 border-b border-[#edf4f0] px-1.5 py-1 font-mono text-[11px] last:border-b-0"
                >
                  <span className={isBuy ? "font-semibold text-[#047857]" : "font-semibold text-[#9f3448]"}>{order.side.toUpperCase()}</span>
                  <span className="text-right font-semibold text-[#0c1a15]">{formatOrderPrice(order)}</span>
                  <span className="text-right text-[#41514a]">{formatUnits(getOrderClaimAmount(order), MUSDC_DECIMALS, 2)}</span>
                  <span className="min-w-0 text-right">
                    {txHash ? (
                      <a
                        href={getExplorerTxUrl(txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex max-w-full items-center justify-end gap-1 text-[#315f9c] underline-offset-2 hover:underline"
                        title={txHash}
                      >
                        <span className="truncate">{statusLabel}</span>
                        <ExternalLink className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className={`truncate ${statusClassName}`} title={row.order_hash ?? undefined}>{statusLabel}</span>
                    )}
                  </span>
                </div>
              );
            }) : (
              <div className="flex h-20 items-center justify-center rounded bg-[#f7fbf9] text-xs text-[#5c6b64]">
                No account orders for {market.resolutionShort} yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function OrderSubmittedPopup({
  signature,
  onDismiss,
}: {
  signature: Hex;
  onDismiss: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-1/2 z-50 flex -translate-y-1/2 justify-center px-4">
      <div
        className="pointer-events-auto w-full max-w-[520px] rounded-lg border border-[#b7decf] bg-white/96 p-5 shadow-[0_28px_80px_rgba(64,86,74,0.26)] backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-[#047857]" />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold text-[#0c1a15]">Your order has been submitted</div>
              <div className="mt-2 truncate rounded border border-[#cfe0d8] bg-[#eef7f2] px-2 py-1 font-mono text-sm text-[#5c6b64]">
                Signature {formatCompactHex(signature)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-[#cfe0d8] bg-[#eef7f2] text-[#5c6b64] transition hover:border-[#9fcfba] hover:text-[#047857]"
            aria-label="Dismiss submitted order notice"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ market }: { market: Market }) {
  const width = 220;
  const height = 74;
  const history = useMemo(() => getHistoricalMarketPoints(market), [market]);
  const points = history.filter((_, index) => index % 12 === 0 || index === history.length - 1).map((point) => point.value);
  const { min, max } = getChartRange(points, market.boundaryValue);
  const path = buildPath(points, width, height, min, max, 8);
  const boundaryY = getBoundaryY(market.boundaryValue, height, min, max, 8);
  const latest = getPoint(points, points.length - 1, width, height, min, max, 8);
  const tone = getMarketTone(market);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[74px] w-full" aria-hidden="true">
      <line x1="8" x2={width - 8} y1={height * 0.28} y2={height * 0.28} stroke="#dcebe4" strokeWidth="1" />
      <line x1="8" x2={width - 8} y1={height * 0.7} y2={height * 0.7} stroke="#dcebe4" strokeWidth="1" />
      <line
        x1="8"
        x2={width - 8}
        y1={boundaryY}
        y2={boundaryY}
        stroke="#b7791f"
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

type TicketLimitOrder = Readonly<{
  side: string;
  price: string;
  status: string;
}>;

function OrderFlowPanel({ market, userLimitOrder }: { market: Market; userLimitOrder?: TicketLimitOrder | null }) {
  const [activeTab, setActiveTab] = useState<"orderbook" | "settlement">("orderbook");
  const marketClock = useMarketClock(market);
  const rows = getDepthRows(market, 8);
  const maxTotal = Math.max(...rows.flatMap((row) => [row.bidSize, row.askSize]));
  const noRows = rows
    .map((row) => ({
      price: row.askPrice,
      size: row.askSize,
      total: Math.round(row.askSize * (row.askPrice / 100) * 100) / 100,
    }))
    .reverse();
  const yesRows = rows.map((row) => ({
    price: row.bidPrice,
    size: row.bidSize,
    total: Math.round(row.bidSize * (row.bidPrice / 100) * 100) / 100,
  }));
  const activeOrders = [
    ...(userLimitOrder ? [userLimitOrder] : []),
    { side: "Buy", price: market.primaryPrice, size: "120", status: "Open" },
    { side: "Buy", price: market.secondaryPrice, size: "80", status: "Resting" },
  ];
  const settlementRows = [
    { label: "Adapter", detail: market.adapterLabel, status: "Live" },
    { label: "Settlement window", detail: market.settlementWindow, status: "Pending" },
    { label: "Maturity check", detail: marketClock.endDateLabel, status: marketClock.phase === "ended" ? "Ready" : "Queued" },
    { label: "Payout", detail: market.payoffSummary, status: "Ready" },
  ];

  return (
    <aside className="flex min-h-[540px] flex-col border-t border-[#cfe0d8] bg-[#f7fbf9]/82 text-xs xl:border-l xl:border-t-0 2xl:min-h-[588px]">
      <div className="grid grid-cols-2 border-b border-[#cfe0d8]">
        <button
          type="button"
          onClick={() => setActiveTab("orderbook")}
          className={`h-10 text-sm font-semibold transition ${
            activeTab === "orderbook"
              ? "border-b border-[#059669] bg-white text-[#047857]"
              : "text-[#5c6b64] hover:bg-white/70 hover:text-[#0c1a15]"
          }`}
        >
          Orderbook
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("settlement")}
          className={`h-10 text-sm font-semibold transition ${
            activeTab === "settlement"
              ? "border-b border-[#059669] bg-white text-[#047857]"
              : "text-[#5c6b64] hover:bg-white/70 hover:text-[#0c1a15]"
          }`}
        >
          Settlement
        </button>
      </div>

      {activeTab === "orderbook" ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-[#cfe0d8] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-[#0c1a15]">Orderbook</div>
              <span className="shrink-0 rounded border border-[#edcf94] bg-[#fff6df] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#8a5a12]">
                {market.primaryPrice} / {market.secondaryPrice}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-[#5c6b64]">Prices are cents per $1 payout</div>
          </div>

          <div className="grid grid-cols-[58px_64px_minmax(64px,1fr)] gap-2 px-3 py-2 font-semibold uppercase tracking-[0.08em] text-[#5c6b64]">
            <span>Level</span>
            <span className="text-right">Price</span>
            <span className="text-right">USDC</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden px-2">
            {noRows.map((row, index) => (
              <div key={`no-${row.price}-${index}`} className="relative grid h-6 grid-cols-[58px_64px_minmax(64px,1fr)] items-center gap-2 overflow-hidden rounded-sm px-2 font-mono text-[13px]">
                <div
                  className="absolute inset-y-0 right-0 bg-[#b94a5a]/12"
                  style={{ width: `${Math.max((row.size / maxTotal) * 100, 8)}%` }}
                />
                <span className="relative text-xs font-semibold text-[#9f3448]">Ask</span>
                <span className="relative text-right text-[#9f3448]">{row.price.toFixed(0)}c</span>
                <span className="relative text-right text-[#41514a]">{row.total.toLocaleString("en-US")}</span>
              </div>
            ))}

            <div className="my-2 flex items-center justify-between border-y border-[#cfe0d8] px-2 py-2">
              <span className="font-semibold text-[#5c6b64]">Best prices</span>
              <span className="font-mono text-xs font-semibold text-[#0c1a15]">{market.primaryPrice} / {market.secondaryPrice}</span>
            </div>

            {yesRows.map((row, index) => (
              <div key={`yes-${row.price}-${index}`} className="relative grid h-6 grid-cols-[58px_64px_minmax(64px,1fr)] items-center gap-2 overflow-hidden rounded-sm px-2 font-mono text-[13px]">
                <div
                  className="absolute inset-y-0 right-0 bg-[#059669]/12"
                  style={{ width: `${Math.max((row.size / maxTotal) * 100, 8)}%` }}
                />
                <span className="relative text-xs font-semibold text-[#047857]">Bid</span>
                <span className="relative text-right text-[#047857]">{row.price.toFixed(0)}c</span>
                <span className="relative text-right text-[#41514a]">{row.total.toLocaleString("en-US")}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#cfe0d8] p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5c6b64]">Open orders</div>
            <div className="space-y-1.5">
              {activeOrders.map((order, index) => (
                <div key={`${order.side}-${order.price}-${index}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded border border-[#cfe0d8] bg-white/70 px-2 py-1.5">
                  <span className="truncate font-semibold text-[#0c1a15]">{order.side}</span>
                  <span className="font-mono text-[#8a5a12]">{order.price}</span>
                  <span className="font-mono text-[#5c6b64]">{order.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#0c1a15]">How this settles</div>
              <div className="mt-1 font-mono text-[11px] text-[#5c6b64]">{marketClock.countdownLabel} {marketClock.countdownSuffix}</div>
            </div>
            <span className={`rounded border px-2 py-1 font-mono ${getStatusStyle(marketClock.status)}`}>{marketClock.status}</span>
          </div>

          <div className="space-y-2">
            {settlementRows.map((row, index) => (
              <div key={row.label} className="rounded border border-[#cfe0d8] bg-white/70 p-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#b7decf] bg-[#e3f5ee] font-mono text-[10px] font-semibold text-[#047857]">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-[#0c1a15]">{row.label}</span>
                </div>
                <div className="mt-1 truncate pl-7 text-[#5c6b64]" title={row.detail}>{row.detail}</div>
                <div className="ml-7 mt-2 inline-flex rounded border border-[#cfe0d8] bg-[#eef7f2] px-2 py-0.5 font-mono text-[11px] text-[#5c6b64]">{row.status}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded border border-[#cfe0d8] bg-white/70 p-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5c6b64]">Curve points</div>
            <div className="mt-2 space-y-1 font-mono text-[11px] text-[#41514a]">
              {market.payoffPoints.map((point) => (
                <div key={point}>{point}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function FeaturedMarket({ market }: { market: Market }) {
  const Icon = market.icon;
  const wallet = useWallet();
  const liveSamples = useLiveTwaSamples(market, wallet.chainId);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [trackedActivityOrderHash, setTrackedActivityOrderHash] = useState<Hex | null>(null);
  const [trackedActivityReservationId, setTrackedActivityReservationId] = useState<string | null>(null);
  const marketActivity = useMarketActivity(
    market,
    wallet.account,
    activityRefreshKey,
    trackedActivityOrderHash,
    trackedActivityReservationId,
  );
  const [orderAmount, setOrderAmount] = useState("100");
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>("yes");
  const [selectedSide, setSelectedSide] = useState<Side>("buy");
  const [limitPriceCents, setLimitPriceCents] = useState(() => getCentsInputValue(market.primaryPrice));
  const [signingStatus, setSigningStatus] = useState<"idle" | "connecting" | "checking" | "approving" | "signing" | "signed" | "submitted" | "error">("idle");
  const [signingError, setSigningError] = useState<string | null>(null);
  const [submitWarning, setSubmitWarning] = useState<string | null>(null);
  const [submitOutcome, setSubmitOutcome] = useState<SubmitOrderOutcome | null>(null);
  const [signedOrder, setSignedOrder] = useState<ApiOrder | null>(null);
  const [signature, setSignature] = useState<Hex | null>(null);
  const [submittedPopupDismissed, setSubmittedPopupDismissed] = useState(false);
  const marketPriceLabel = selectedOutcome === "yes" ? market.primaryPrice : market.secondaryPrice;
  const marketPrimaryEntryPrice = parseCentsPrice(market.primaryPrice);
  const marketSecondaryEntryPrice = parseCentsPrice(market.secondaryPrice);
  const limitPriceValue = Number(limitPriceCents);
  const isLimitPriceValid = Number.isFinite(limitPriceValue) && limitPriceValue > 0 && limitPriceValue <= 100;
  const ticketPriceLabel = isLimitPriceValid ? formatCentsPrice(limitPriceValue) : `${limitPriceCents || "0"}c`;
  const entryPrice = isLimitPriceValid ? limitPriceValue / 100 : 0;
  const orderValue = Math.max(Number(orderAmount) || 0, 0);
  const estimatedShares = entryPrice > 0 ? orderValue / entryPrice : 0;
  const maxPayout = estimatedShares;
  const estimatedProfit = Math.max(maxPayout - orderValue, 0);
  const payoutMultiple = orderValue > 0 ? maxPayout / orderValue : 0;
  const sellContracts = orderValue;
  const sellProceeds = sellContracts * entryPrice;
  const ticketDeal = dealSentence({
    side: selectedSide,
    condition: selectedOutcome === "yes" ? market.yesCondition : market.noCondition,
    amount: orderValue,
    priceLabel: ticketPriceLabel,
    entryPrice,
  });
  const primaryPayoutMultiple = selectedOutcome === "yes" && entryPrice > 0 ? 1 / entryPrice : 1 / marketPrimaryEntryPrice;
  const secondaryPayoutMultiple = selectedOutcome === "no" && entryPrice > 0 ? 1 / entryPrice : 1 / marketSecondaryEntryPrice;
  const marketClock = useMarketClock(market);
  const chainMismatch = getChainMismatchMessage(wallet.chainId);
  const isSigning = signingStatus === "connecting"
    || signingStatus === "checking"
    || signingStatus === "approving"
    || signingStatus === "signing";
  const ticketButtonLabel = !isLimitPriceValid ? "Enter limit price" : isSigning
    ? signingStatus === "connecting" ? "Connecting wallet"
      : signingStatus === "checking" ? "Checking approvals"
        : signingStatus === "approving" ? "Open approval request"
          : "Open wallet request"
    : signingStatus === "submitted" ? "Place again" : signingStatus === "signed" ? "Sign again" : wallet.account ? "Place limit order" : "Connect and place";
  const showSubmittedPopup = Boolean(signature && signedOrder && !submittedPopupDismissed && (
    signingStatus === "submitted"
    || signingStatus === "signed"
  ));
  const userLimitOrder = submitOutcome?.outcome === "rested" ? {
    side: selectedSide === "buy" ? "Buy" : "Sell",
    price: ticketPriceLabel,
    status: "Resting",
  } : null;

  useEffect(() => {
    setLimitPriceCents(getCentsInputValue(marketPriceLabel));
  }, [market.id, marketPriceLabel]);

  useEffect(() => {
    setSignedOrder(null);
    setSignature(null);
    setSigningError(null);
    setSubmitWarning(null);
    setSubmitOutcome(null);
    setTrackedActivityOrderHash(null);
    setTrackedActivityReservationId(null);
    setSubmittedPopupDismissed(false);
    setSigningStatus((currentStatus) => currentStatus === "signed" || currentStatus === "submitted" ? "idle" : currentStatus);
  }, [market.id, ticketPriceLabel, orderAmount, selectedOutcome, selectedSide]);

  useEffect(() => {
    if (!signature || !signedOrder || submittedPopupDismissed) return;

    const timeoutId = window.setTimeout(() => {
      setSubmittedPopupDismissed(true);
    }, submittedPopupAutoCloseMs);

    return () => window.clearTimeout(timeoutId);
  }, [signature, signedOrder, submittedPopupDismissed]);

  const handleSignPreview = async () => {
    try {
      setSigningError(null);
      setSubmitWarning(null);
      setSubmitOutcome(null);
      setSignedOrder(null);
      setSignature(null);
      setTrackedActivityOrderHash(null);
      setTrackedActivityReservationId(null);
      setSubmittedPopupDismissed(false);
      setSigningStatus(wallet.account && wallet.chainId ? "signing" : "connecting");

      const connection = wallet.account && wallet.chainId
        ? { account: wallet.account, chainId: wallet.chainId }
        : await wallet.connect();
      const config = resolveSigningConfig(connection.chainId);
      const provider = wallet.provider ?? window.ethereum;

      if (config.chainId !== connection.chainId) {
        throw new Error(`Switch wallet to chain ${config.chainId} before signing.`);
      }

      if (!provider) {
        throw new Error("No injected wallet was found.");
      }

      if (!isLimitPriceValid) {
        throw new Error("Limit price must be greater than 0c and at most 100c.");
      }

      setSigningStatus("checking");
      const inputAmount = parseDecimalToUnits(orderAmount, MUSDC_DECIMALS);
      const priceWad = parseCentsLabelToPriceWad(ticketPriceLabel);
      const expiration = BigInt(Math.floor(Date.now() / 1000) + defaultOrderExpiryMinutes * 60);
      const epoch = await getMakerEpoch(provider, connection.account, config.verifyingContract);
      const commonOrderInput = {
        maker: connection.account,
        marketId: market.id,
        outcome: selectedOutcome,
        priceWad,
        expiration,
        epoch,
        maxFeeRateBps: defaultMaxFeeRateBps,
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

      if (selectedSide === "buy") {
        const requiredCollateral = BigInt(order.maker_amount);
        const balance = await getErc20Balance(provider, ASCESWAP_ADDRESSES.demoMusdc, connection.account);

        if (balance < requiredCollateral) {
          throw new Error(`Insufficient demo mUSDC. Need ${formatMusdc(requiredCollateral)}, wallet has ${formatMusdc(balance)}. Use the faucet first.`);
        }

        setSigningStatus("approving");
        const approval = await ensureErc20Approval(
          provider,
          ASCESWAP_ADDRESSES.demoMusdc,
          connection.account,
          config.verifyingContract,
          requiredCollateral,
        );

        if (!approval.approved) {
          setSubmitWarning(`mUSDC approval sent: ${approval.transactionHash ? formatShortHex(approval.transactionHash) : "pending"}. Place again after it confirms.`);
          setSigningStatus("idle");
          return;
        }
      } else {
        const { payoffPositionId, residualPositionId } = await getPositionIds(provider, market.id, config.verifyingContract);
        const positionId = selectedOutcome === "yes" ? payoffPositionId : residualPositionId;
        const requiredClaims = BigInt(order.maker_amount);
        const balance = await getErc1155Balance(provider, ASCESWAP_ADDRESSES.ctf, connection.account, positionId);

        if (balance < requiredClaims) {
          throw new Error(`Insufficient contracts. Need ${formatMusdc(requiredClaims)}, wallet has ${formatMusdc(balance)}.`);
        }

        setSigningStatus("approving");
        const approval = await ensureClaimApprovalForAll(
          provider,
          ASCESWAP_ADDRESSES.ctf,
          connection.account,
          config.verifyingContract,
        );

        if (!approval.approved) {
          setSubmitWarning(`CTF approval sent: ${approval.transactionHash ? formatShortHex(approval.transactionHash) : "pending"}. Place again after it confirms.`);
          setSigningStatus("idle");
          return;
        }
      }

      setSigningStatus("signing");
      if (order.maker.toLowerCase() !== connection.account.toLowerCase()) {
        throw new Error("Order maker must match the signing wallet.");
      }
      const nextSignature = await signOrder(order, wallet, domain);
      setSignedOrder(order);
      setSignature(nextSignature);
      setSigningStatus("submitted");
      upsertPendingOrder(pendingRecordFromSubmission({ order, signature: nextSignature }));

      try {
        const orderbookClient = createOrderbookClient();
        setSubmittedPopupDismissed(false);
        const response = await submitSignedOrder(orderbookClient, order, nextSignature, {
          postOnly: false,
          restOnNoMatch: true,
          reservationTtlSecs: 300,
        });
        setSubmitOutcome(response);
        upsertPendingOrder(pendingRecordFromSubmission({ order, signature: nextSignature, response }));
        setTrackedActivityOrderHash("order_hash" in response ? response.order_hash ?? null : null);
        setTrackedActivityReservationId(response.outcome === "matched" ? response.reservation_id : null);
        setActivityRefreshKey((current) => current + 1);
        if (response.outcome === "rested" || response.outcome === "matched") {
          setSigningStatus("submitted");
        } else {
          setSigningStatus("signed");
        }
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
    <>
      {showSubmittedPopup && signature ? (
        <OrderSubmittedPopup
          signature={signature}
          onDismiss={() => setSubmittedPopupDismissed(true)}
        />
      ) : null}
      <article className="glass-panel overflow-hidden rounded-lg">
      <div className="grid xl:grid-cols-[minmax(0,1fr)_286px_280px] 2xl:grid-cols-[minmax(0,1fr)_318px_292px]">
        <div className="min-w-0 p-3 sm:p-4">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#cfe0d8] pb-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${getStatusStyle(marketClock.status)}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {marketClock.status}
                </span>
                <span className="glass-control rounded-md px-2 py-0.5 text-[11px] font-semibold text-[#5c6b64]">
                  {market.categoryLabel}
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="glass-control flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md">
                  {market.logoSrc ? (
                    <Image
                      src={market.logoSrc}
                      alt={market.logoAlt ?? market.title}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Icon className="h-5 w-5" style={{ color: market.iconTone }} />
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="max-w-4xl text-lg font-semibold leading-tight text-[#0c1a15] sm:text-xl">
                    {market.title}
                  </h1>
                  <p className="mt-1 max-w-3xl text-sm leading-snug text-[#41514a]">
                    {market.subtitle}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#5c6b64]">
                    <span className="rounded-md border border-[#cfe0d8] bg-[#eef7f2] px-2 py-1 text-[#5c6b64]">
                      Settles on: <span className="font-mono text-[#0c1a15]">{market.settlesOn}</span>
                    </span>
                    <span className="rounded-md border border-[#cfe0d8] bg-[#eef7f2] px-2 py-1 text-[#5c6b64]">
                      Vol: <span className="font-mono text-[#0c1a15]">{market.volume}</span>
                    </span>
                    <a
                      href={getExplorerAddressUrl(market.adapter)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-[#cfe0d8] bg-[#eef7f2] px-2 py-1 text-[#5c6b64] transition hover:border-[#9fcfba] hover:text-[#047857]"
                    >
                      Oracle: <span className="font-mono text-[#0c1a15]">{formatShortAddress(market.adapter)}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-[210px] rounded-md border border-[#edcf94] bg-[#fff6df] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:min-w-[248px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a673d]">{marketClock.heading}</span>
                <span className="font-mono text-xs font-semibold text-[#8a5a12]">{marketClock.targetDateLabel}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-semibold leading-none text-[#8a5a12]">{marketClock.countdownLabel}</span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a673d]">{marketClock.countdownSuffix}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 h-[540px] overflow-hidden rounded-md border border-[#cfe0d8] bg-white/76 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_18px_48px_rgba(64,86,74,0.1)] 2xl:h-[600px]">
            <FeaturedChart market={market} liveSamples={liveSamples} />
          </div>
          <div className="mt-1 flex justify-end">
            <a
              href="https://www.tradingview.com/"
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-semibold text-[#8aa096] transition hover:text-[#5c6b64]"
            >
              Charting by TradingView
            </a>
          </div>
          <MarketActivityPanel
            market={market}
            activity={marketActivity}
            onRefresh={() => setActivityRefreshKey((current) => current + 1)}
          />
        </div>

        <OrderFlowPanel market={market} userLimitOrder={userLimitOrder} />

        <aside className="border-t border-[#cfe0d8] bg-[#f7fbf9]/86 p-3 backdrop-blur-xl xl:border-l xl:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#0c1a15]">Trade ticket</div>
              <div className="mt-0.5 text-[11px] text-[#5c6b64]">{market.sourceNote}</div>
            </div>
          </div>

          {chainMismatch ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-[#edcf94] bg-[#fff6df] p-2 text-xs text-[#8a5a12]">
              <span>{chainMismatch}</span>
              <button
                type="button"
                onClick={() => {
                  wallet.switchChain(ASCESWAP_CHAIN_ID).catch((error) => {
                    setSigningError(error instanceof Error ? error.message : "Network switch failed.");
                  });
                }}
                className="h-7 shrink-0 rounded border border-[#edcf94] bg-white/70 px-2 font-semibold text-[#8a5a12] transition hover:border-[#d9b36f]"
              >
                Switch
              </button>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-2 gap-1 rounded-md border border-[#cfe0d8] bg-[#edf7f2] p-1">
            {(["buy", "sell"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setSelectedSide(side)}
                className={`h-8 rounded text-xs font-semibold uppercase transition ${
                  selectedSide === side
                    ? "bg-white text-[#047857] shadow-[0_1px_6px_rgba(64,86,74,0.1)]"
                    : "text-[#5c6b64] hover:bg-white/70 hover:text-[#0c1a15]"
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
              className={`rounded-md border px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
                selectedOutcome === "yes"
                  ? "border-[#059669] bg-[#e3f5ee]"
                  : "border-[#b7decf] bg-white/72 hover:border-[#059669]"
              }`}
            >
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-[#047857]">
                PAYOFF
                <span className="font-mono">{primaryPayoutMultiple.toFixed(1)}x</span>
              </span>
              <span className="mt-0.5 block font-mono text-lg font-semibold text-[#0c1a15]">{market.primaryPrice}</span>
              <span className="mt-1 block text-[10px] leading-tight text-[#41514a]">{market.yesHint}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedOutcome("no")}
              className={`rounded-md border px-2.5 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition ${
                selectedOutcome === "no"
                  ? "border-[#b94a5a] bg-[#fff0f3]"
                  : "border-[#e4a4ae] bg-white/72 hover:border-[#b94a5a]"
              }`}
            >
              <span className="flex items-center justify-between gap-2 text-xs font-semibold text-[#9f3448]">
                RESIDUAL
                <span className="font-mono">{secondaryPayoutMultiple.toFixed(1)}x</span>
              </span>
              <span className="mt-0.5 block font-mono text-lg font-semibold text-[#0c1a15]">{market.secondaryPrice}</span>
              <span className="mt-1 block text-[10px] leading-tight text-[#41514a]">{market.noHint}</span>
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <div className="glass-control rounded-md p-2">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c6b64]">
                  {selectedSide === "buy" ? "Limit price max" : "Limit price min"}
                </span>
                <button
                  type="button"
                  onClick={() => setLimitPriceCents(getCentsInputValue(marketPriceLabel))}
                  className="rounded border border-[#cfe0d8] bg-white/70 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#047857] transition hover:border-[#9fcfba]"
                >
                  Market {marketPriceLabel}
                </button>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.1"
                  value={limitPriceCents}
                  onChange={(event) => setLimitPriceCents(event.target.value)}
                  className="h-8 min-w-0 flex-1 bg-transparent font-mono text-lg font-semibold text-[#0c1a15] outline-none"
                  aria-label="Limit price in cents"
                  aria-invalid={!isLimitPriceValid}
                />
                <span className="font-mono text-lg font-semibold text-[#8aa096]">c</span>
              </label>
              <div className={`mt-1 text-[11px] ${isLimitPriceValid ? "text-[#5c6b64]" : "text-[#9f3448]"}`}>
                {isLimitPriceValid
                  ? `${selectedSide === "buy" ? "Will not pay above" : "Will not sell below"} ${ticketPriceLabel}.`
                  : "Enter a price from 0.01c to 100c."}
              </div>
            </div>

            <div className="glass-control rounded-md p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5c6b64]">
                  {selectedSide === "buy" ? "Order value" : "Contracts to sell"}
                </span>
                <span className="text-xs text-[#5c6b64]">{selectedSide === "buy" ? "mUSDC" : "contracts"}</span>
              </div>
              <label className="flex items-center gap-2">
                {selectedSide === "buy" ? (
                  <span className="font-mono text-lg font-semibold text-[#8aa096]">$</span>
                ) : null}
                <input
                  type="number"
                  min="0"
                  value={orderAmount}
                  onChange={(event) => setOrderAmount(event.target.value)}
                  className="h-8 min-w-0 flex-1 bg-transparent font-mono text-lg font-semibold text-[#0c1a15] outline-none"
                  aria-label={selectedSide === "buy" ? "Order value in USDC" : "Contracts to sell"}
                />
              </label>
            </div>

            {selectedSide === "buy" ? (
              <div className="rounded-md border border-[#b7decf] bg-[#e3f5ee] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#047857]">If you&apos;re right</span>
                  <span className="rounded-sm bg-white/70 px-2 py-0.5 font-mono text-xs font-semibold text-[#047857]">
                    {payoutMultiple.toFixed(1)}x
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-[#5c6b64]">You collect</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-[#0c1a15]">{formatUsd(maxPayout)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c6b64]">Net profit</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-[#047857]">+{formatUsd(estimatedProfit)}</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-[#b7decf] pt-2 text-xs">
                  <span className="text-[#5c6b64]">Contracts</span>
                  <span className="font-mono font-semibold text-[#0c1a15]">{formatContracts(estimatedShares)}</span>
                </div>
              </div>
            ) : (
              <div className="rounded-md border border-[#b7decf] bg-[#e3f5ee] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#047857]">Order summary</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[11px] text-[#5c6b64]">You receive</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-[#0c1a15]">{formatUsd(sellProceeds)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#5c6b64]">Contracts</div>
                    <div className="mt-1 font-mono text-sm font-semibold text-[#0c1a15]">{formatContracts(sellContracts)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {ticketDeal ? (
            <p className="mt-3 rounded-md border border-[#cfe0d8] bg-white/70 p-2 text-xs leading-relaxed text-[#41514a]">
              {ticketDeal}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleSignPreview}
            disabled={isSigning || wallet.status === "unavailable" || !isLimitPriceValid}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#059669] text-sm font-bold text-white transition hover:bg-[#047857] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
            {ticketButtonLabel}
          </button>

          {wallet.status === "unavailable" ? (
            <div className="mt-2 flex gap-2 rounded-md border border-[#edcf94] bg-[#fff6df] p-2 text-xs text-[#8a5a12]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>No injected wallet detected.</span>
            </div>
          ) : null}

          {signingError ? (
            <div className="mt-2 flex gap-2 rounded-md border border-[#e4a4ae] bg-[#fff0f3] p-2 text-xs text-[#9f3448]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{signingError}</span>
            </div>
          ) : null}

          {submitWarning ? (
            <div className="mt-2 flex gap-2 rounded-md border border-[#edcf94] bg-[#fff6df] p-2 text-xs text-[#8a5a12]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{submitWarning}</span>
            </div>
          ) : null}

        </aside>
      </div>
      </article>
    </>
  );
}

function MarketCard({
  market,
  isSelected,
  onSelect,
}: {
  market: Market;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = market.icon;
  const isPositive = market.change >= 0;
  const tone = getMarketTone(market);
  const payoutMultiple = 1 / parseCentsPrice(market.primaryPrice);
  const marketClock = useMarketClock(market);
  const clockCardLabel = marketClock.phase === "upcoming" ? "Starts" : marketClock.phase === "ended" ? "Ended" : "Ends";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`group cursor-pointer rounded-[10px] border bg-white/82 p-4 shadow-[0_14px_36px_rgba(64,86,74,0.08)] transition ${
        isSelected ? "border-[#059669] ring-2 ring-[#059669]/14" : "border-[#cfe0d8] hover:border-[#9fcfba]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#cfe0d8] bg-[#f7fbf9]">
            {market.logoSrc ? (
              <Image
                src={market.logoSrc}
                alt={market.logoAlt ?? market.title}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon className="h-5 w-5" style={{ color: market.iconTone }} />
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-sm bg-[#eef7f2] px-1.5 py-0.5 text-[11px] font-bold text-[#5c6b64]">{market.resolutionShort}</span>
              <span className="rounded-sm bg-[#eef7f2] px-1.5 py-0.5 text-[11px] font-bold text-[#5c6b64]">{market.payoff}</span>
            </div>
            <h3 className="line-clamp-2 text-[15px] font-semibold leading-5 text-[#0c1a15]">{market.title}</h3>
            <div className="mt-1 line-clamp-2 text-xs leading-snug text-[#5c6b64]">{market.subtitle}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8aa096] transition hover:bg-[#eef7f2] hover:text-[#0c1a15]"
        >
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 rounded-md border border-[#cfe0d8] bg-[#f7fbf9] p-2">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#5c6b64]">{market.metric}</span>
          <span
            className={`flex items-center gap-1 font-mono text-xs font-semibold ${
              isPositive ? "text-[#047857]" : "text-[#b94a5a]"
            }`}
          >
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(market.change).toFixed(2)}
          </span>
        </div>
        <MiniChart market={market} />
        <div className="mt-1 flex items-center justify-between px-1 text-xs">
          <span className={`font-mono font-semibold ${tone.text}`}>{formatValue(market.currentValue, market.format)}</span>
          <span className="font-mono text-[#8a5a12]">{formatValue(market.boundaryValue, market.format)}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onSelect}
          className="h-11 rounded-md border border-[#b7decf] bg-[#e3f5ee] px-3 text-left transition hover:border-[#059669]"
        >
          <span className="block text-[11px] font-semibold text-[#047857]">Buy</span>
          <span className="font-mono text-base font-semibold text-[#0c1a15]">{market.primaryPrice}</span>
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="h-11 rounded-md border border-[#e4a4ae] bg-[#fff0f3] px-3 text-left transition hover:border-[#b94a5a]"
        >
          <span className="block text-[11px] font-semibold text-[#9f3448]">Buy</span>
          <span className="font-mono text-base font-semibold text-[#0c1a15]">{market.secondaryPrice}</span>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
        <div>
          <div className="text-[#5c6b64]">{clockCardLabel}</div>
          <div className="mt-1 font-mono font-semibold text-[#8a5a12]">{marketClock.countdownLabel}</div>
        </div>
        <div>
          <div className="text-[#5c6b64]">Volume</div>
          <div className="mt-1 font-mono font-semibold text-[#0c1a15]">{market.volume}</div>
        </div>
        <div>
          <div className="text-[#5c6b64]">Oracle</div>
          <a
            href={getExplorerAddressUrl(market.adapter)}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
            className="mt-1 inline-flex items-center gap-1 font-mono font-semibold text-[#0c1a15] hover:text-[#047857]"
          >
            {formatShortAddress(market.adapter)}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div>
          <div className="text-[#5c6b64]">Payout</div>
          <div className="mt-1 font-mono font-semibold text-[#047857]">{payoutMultiple.toFixed(1)}x</div>
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
    <div className="flex w-full max-w-full gap-1 overflow-x-auto rounded-md border border-[#cfe0d8] bg-white/62 p-1 2xl:w-max">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = category.id === activeCategory;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => setActiveCategory(category.id)}
            title={category.label}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded px-2 text-xs font-semibold transition xl:px-2.5 ${
              isActive
                ? "bg-[#e3f5ee] text-[#047857]"
                : "text-[#5c6b64] hover:bg-[#eef7f2] hover:text-[#0c1a15]"
            }`}
          >
            <Icon className={isActive ? "h-3.5 w-3.5 text-[#059669]" : "h-3.5 w-3.5 text-[#8aa096]"} />
            <span className="hidden xl:inline">{category.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<CategoryId>("trending");
  const [selectedMarketId, setSelectedMarketId] = useState(markets[0].id);

  const visibleMarkets = useMemo(() => {
    if (activeCategory === "trending") {
      return markets
        .filter((market) => market.trendingRank)
        .sort((a, b) => Number(a.trendingRank) - Number(b.trendingRank));
    }

    return markets.filter((market) => market.category === activeCategory);
  }, [activeCategory]);

  const featured = markets.find((market) => market.id === selectedMarketId) ?? markets[0];

  const selectCategory = (category: CategoryId) => {
    setActiveCategory(category);
    const nextVisibleMarkets = category === "trending"
      ? markets
          .filter((market) => market.trendingRank)
          .sort((a, b) => Number(a.trendingRank) - Number(b.trendingRank))
      : markets.filter((market) => market.category === category);
    const [firstMarket] = nextVisibleMarkets;

    if (firstMarket) {
      setSelectedMarketId(firstMarket.id);
    }
  };

  return (
    <PageLayout
      headerFilters={
        <MarketCategoryFilters activeCategory={activeCategory} setActiveCategory={selectCategory} />
      }
    >
      <div className="page-enter space-y-3 pt-3">
        <section>
          <FeaturedMarket market={featured} />
        </section>

        <section className="space-y-4">
          <div className="border-y border-[#cfe0d8] py-4">
            <h2 className="text-xl font-semibold text-[#0c1a15]">All markets</h2>
            <p className="mt-1 text-sm text-[#5c6b64]">Each card shows the observed variable against its payoff boundary.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {visibleMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
                isSelected={market.id === featured.id}
                onSelect={() => setSelectedMarketId(market.id)}
              />
            ))}
          </div>
        </section>

      </div>
    </PageLayout>
  );
}
