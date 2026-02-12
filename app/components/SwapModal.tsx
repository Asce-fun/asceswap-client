"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Info,
  ArrowDown,
  ArrowUp,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  MarketData,
  SwapDirection,
  FormattedMarket,
} from "../interface/types";
import { MARKET_META } from "../constants/markets";
import { FullModal } from "./FullModal";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getTokenBalance } from "../blockchain/scripts/tokenBalance";
import { approveAndBuySwap } from "../blockchain/scripts/write/approveAndBuySwap";
import numberFormatter from "../blockchain/utils/numberFormatter";

/* ─────────────────────── Types ─────────────────────── */

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: MarketData;
  direction: SwapDirection;
  marketDetails: FormattedMarket | null;
}

type InfoTab = "overview" | "details" | "risks";

/* ─────────────────────── Component ─────────────────────── */

export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  market,
  direction,
  marketDetails,
}) => {
  const meta = MARKET_META?.[market.id] ?? {
    letter: "?",
    colorClass: "",
    iconColor: "#a78bfa",
    oracleSource: market.protocol,
    termLabel: "30d",
  };

  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;

  /* ── State ── */
  const [activeSide, setActiveSide] = useState<SwapDirection>(direction);
  const [notional, setNotional] = useState(0);
  const [infoTab, setInfoTab] = useState<InfoTab>("overview");
  const [chartTimeRange, setChartTimeRange] = useState("1M");
  const [chartRateType, setChartRateType] = useState("Rate");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const chartRef = useRef<SVGSVGElement>(null);

  /* ── Sync direction prop ── */
  useEffect(() => {
    setActiveSide(direction);
  }, [direction]);

  /* ── Reset on open ── */
  useEffect(() => {
    if (isOpen) {
      setNotional(0);
      setTxHash(null);
      setError(null);
      setInfoTab("overview");
    }
  }, [isOpen]);

  /* ── Fetch wallet balance ── */
  useEffect(() => {
    if (!address || !isOpen || !marketDetails?.collateralToken) return;
    let cancelled = false;

    async function fetchBalance() {
      try {
        const res = await getTokenBalance(
          marketDetails!.collateralToken,
          address as string,
        );
        if (!cancelled) setWalletBalance(res.formatted);
      } catch {
        if (!cancelled) setWalletBalance(null);
      }
    }

    fetchBalance();
    return () => {
      cancelled = true;
    };
  }, [address, marketDetails?.collateralToken, isOpen]);

  /* ── Derived values ── */
  const minNotional = marketDetails?.params?.minNotional ?? 0;
  const maxNotional = marketDetails?.params?.maxNotional ?? 1000000;
  const initialMarginPct = marketDetails?.params?.initialMarginMultiplierPct ?? 100;

  const collateral = useMemo(
    () => (notional * 100) / initialMarginPct,
    [notional, initialMarginPct],
  );

  const effectiveLeverage = useMemo(
    () => initialMarginPct / 100,
    [initialMarginPct],
  );

  const currentRate = marketDetails?.rate?.currentPct ?? 0;
  const feeSpread = marketDetails?.params?.feeSpreadPct ?? 0;
  const lockedRate = currentRate + feeSpread;
  const entryFee = useMemo(
    () => (notional * (marketDetails?.params?.swapFeePct ?? 0)) / 100,
    [notional, marketDetails?.params?.swapFeePct],
  );

  const settlementDate = useMemo(() => {
    if (!marketDetails?.params?.swapTermDays) return "—";
    const d = new Date();
    d.setDate(d.getDate() + marketDetails.params.swapTermDays);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [marketDetails?.params?.swapTermDays]);

  const termDays = marketDetails?.params?.swapTermDays ?? 30;

  /* ── Pool stats ── */
  const tvl = marketDetails?.pool?.totalCollateral ?? 0;
  const lockedTotal = marketDetails
    ? marketDetails.pool.lockedFixed + marketDetails.pool.lockedFloating
    : 0;
  const available = tvl - lockedTotal;
  const utilization = tvl > 0 ? (lockedTotal / tvl) * 100 : 0;
  const activeSwaps = marketDetails?.stats?.activeSwaps ?? 0;

  /* ── P&L Scenarios ── */
  const pnlScenarios = useMemo(() => {
    const termFraction = termDays / 365;
    const rateDown = currentRate - 1.5;
    const rateNoChange = currentRate;
    const rateUp = currentRate + 1.5;

    const calcPnl = (scenarioRate: number) => {
      if (activeSide === "FIXED") {
        // Fixed side profits when rates fall
        return ((lockedRate - scenarioRate) / 100) * notional * termFraction;
      } else {
        // Float side profits when rates rise
        return ((scenarioRate - lockedRate) / 100) * notional * termFraction;
      }
    };

    const pnlDown = calcPnl(rateDown);
    const pnlNoChange = calcPnl(rateNoChange);
    const pnlUp = calcPnl(rateUp);

    return [
      {
        label: "Rates Fall",
        rate: `${rateDown.toFixed(2)}%`,
        pnl: pnlDown,
        pct: collateral > 0 ? (pnlDown / collateral) * 100 : 0,
      },
      {
        label: "No Change",
        rate: `${rateNoChange.toFixed(2)}%`,
        pnl: pnlNoChange,
        pct: collateral > 0 ? (pnlNoChange / collateral) * 100 : 0,
      },
      {
        label: "Rates Rise",
        rate: `${rateUp.toFixed(2)}%`,
        pnl: pnlUp,
        pct: collateral > 0 ? (pnlUp / collateral) * 100 : 0,
      },
    ];
  }, [activeSide, notional, currentRate, lockedRate, termDays, collateral]);

  /* ── Notional presets ── */
  const presets = [
    { label: "$1K", value: 1000 },
    { label: "$10K", value: 10000 },
    { label: "$50K", value: 50000 },
    { label: "$100K", value: 100000 },
    { label: "$500K", value: 500000 },
  ];

  /* ── Copy helper ── */
  const handleCopy = useCallback((text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  /* ── Truncate hex ── */
  const truncHex = (hex: string) =>
    hex ? `${hex.slice(0, 6)}...${hex.slice(-4)}` : "—";

  /* ── Chart tooltip ── */
  const handleChartMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!chartRef.current) return;
      const rect = chartRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        visible: true,
      });
    },
    [],
  );

  const handleChartMouseLeave = useCallback(() => {
    setTooltipPos((p) => ({ ...p, visible: false }));
  }, []);

  /* ── Execute Swap ── */
  const handleExecute = async () => {
    if (!marketDetails) return;
    try {
      setLoading(true);
      setError(null);
      const hash = await approveAndBuySwap({
        tokenAddress: marketDetails.collateralToken,
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        oracleAddress: marketDetails.oracle,
        pairId: String(marketDetails.pairId),
        side: activeSide,
        notional: notional,
        collateral: collateral,
        maxRateBps: 900,
        decimals: 6,
      });
      setTxHash(hash);
    } catch (e: any) {
      setError(e.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Mock 24h change ── */
  const dayChange = useMemo(() => {
    const seed = Number(market.id) * 0.17;
    return parseFloat(((seed % 0.8) - 0.3).toFixed(2));
  }, [market.id]);

  return (
    <FullModal isOpen={isOpen} onClose={onClose} maxWidth="1120px">
      <div
        className="flex flex-col h-full"
        style={{ maxHeight: "calc(100vh - 48px)" }}
      >
        {/* ========== A. MODAL HEADER ========== */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3 pr-10">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-base font-bold shrink-0"
              style={{
                backgroundColor: `${meta.iconColor}15`,
                color: meta.iconColor,
              }}
            >
              {meta.letter}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                {market.name}
              </h2>
              <p className="text-[11px] text-[#8A8894]">
                {meta.oracleSource} · {termDays} Day Term
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 mr-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* ========== B. RATE STRIP ========== */}
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center gap-4 shrink-0 bg-[#0d0d10]">
          <div>
            <div className="text-[10px] font-semibold text-[#8A8894] uppercase tracking-wider mb-1">
              Current Rate
            </div>
            <span className="font-mono text-3xl font-bold text-white tracking-tighter">
              {currentRate.toFixed(2)}%
            </span>
          </div>
          <span
            className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${
              dayChange >= 0
                ? "text-[#34d399] bg-[#34d399]/10"
                : "text-[#f43f5e] bg-[#f43f5e]/10"
            }`}
          >
            {dayChange >= 0 ? "+" : ""}
            {dayChange.toFixed(2)}%{" "}
            <span className="text-[10px] opacity-60">(24h)</span>
          </span>
        </div>

        {/* ========== C. TWO-COLUMN BODY ========== */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 min-[960px]:grid-cols-[1fr_360px]">
          {/* ===== C1. LEFT COLUMN ===== */}
          <div className="overflow-y-auto p-6 space-y-5 border-r border-white/[0.04]">
            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                {["Rate", "TWA Rate"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartRateType(t)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      chartRateType === t
                        ? "bg-white/[0.06] text-white"
                        : "text-[#8A8894] hover:text-[#BAB8C4]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 p-0.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                {["1W", "1M", "3M", "ALL"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartTimeRange(t)}
                    className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      chartTimeRange === t
                        ? "bg-white/[0.06] text-white"
                        : "text-[#8A8894] hover:text-[#BAB8C4]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Static SVG Chart */}
            <div className="relative rounded-xl bg-white/[0.015] border border-white/[0.04] overflow-hidden">
              <svg
                ref={chartRef}
                viewBox="0 0 600 255"
                className="w-full"
                style={{ height: 255 }}
                onMouseMove={handleChartMouseMove}
                onMouseLeave={handleChartMouseLeave}
              >
                <defs>
                  <linearGradient
                    id="chartGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                {[60, 110, 160, 210].map((y) => (
                  <line
                    key={y}
                    x1="40"
                    y1={y}
                    x2="580"
                    y2={y}
                    stroke="rgba(255,255,255,0.03)"
                    strokeDasharray="4 4"
                  />
                ))}
                {/* Y-axis labels */}
                {[
                  { y: 60, label: "8%" },
                  { y: 110, label: "6%" },
                  { y: 160, label: "4%" },
                  { y: 210, label: "2%" },
                ].map((item) => (
                  <text
                    key={item.y}
                    x="32"
                    y={item.y + 4}
                    fill="rgba(255,255,255,0.2)"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    textAnchor="end"
                  >
                    {item.label}
                  </text>
                ))}
                {/* X-axis labels */}
                {[
                  { x: 80, label: "Week 1" },
                  { x: 210, label: "Week 2" },
                  { x: 340, label: "Week 3" },
                  { x: 470, label: "Week 4" },
                ].map((item) => (
                  <text
                    key={item.x}
                    x={item.x}
                    y="245"
                    fill="rgba(255,255,255,0.15)"
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    textAnchor="middle"
                  >
                    {item.label}
                  </text>
                ))}
                {/* Area fill */}
                <path
                  d="M60,150 C100,140 140,155 180,130 C220,105 260,120 300,100 C340,80 380,95 420,85 C460,75 500,90 540,70 L540,230 L60,230 Z"
                  fill="url(#chartGradient)"
                />
                {/* Line */}
                <path
                  d="M60,150 C100,140 140,155 180,130 C220,105 260,120 300,100 C340,80 380,95 420,85 C460,75 500,90 540,70"
                  fill="none"
                  stroke="#a78bfa"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* Pulsing dot at end */}
                <circle cx="540" cy="70" r="5" fill="#a78bfa" opacity="0.3">
                  <animate
                    attributeName="r"
                    values="5;8;5"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.3;0.1;0.3"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx="540" cy="70" r="3" fill="#a78bfa" />
              </svg>
              {/* CSS Tooltip */}
              {tooltipPos.visible && (
                <div
                  className="absolute pointer-events-none bg-[#1a1a22] border border-white/10 rounded-lg px-3 py-2 shadow-lg z-10"
                  style={{
                    left: Math.min(tooltipPos.x + 12, 500),
                    top: Math.max(tooltipPos.y - 50, 0),
                  }}
                >
                  <div className="text-[9px] text-[#8A8894] uppercase tracking-wider">
                    Rate
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    {currentRate.toFixed(2)}%
                  </div>
                </div>
              )}
            </div>

            {/* Info Tabs — pill style */}
            <div>
              <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-white/[0.02] border border-white/[0.04] w-fit">
                {(
                  [
                    { key: "overview", label: "Overview" },
                    { key: "details", label: "Details" },
                    { key: "risks", label: "Risks" },
                  ] as { key: InfoTab; label: string }[]
                ).map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setInfoTab(t.key)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      infoTab === t.key
                        ? "bg-white/[0.06] text-white"
                        : "text-[#8A8894] hover:text-[#BAB8C4]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {infoTab === "overview" && (
                <div className="space-y-4">
                  <p className="text-[12px] text-[#8A8894] leading-relaxed">
                    {activeSide === "FIXED" ? (
                      <>
                        By taking the <span className="text-white font-semibold">Fixed</span> side, you lock in the current rate. You profit when floating rates fall below your locked rate, and lose when rates rise above it. Your maximum loss is limited to the collateral you deposit.
                      </>
                    ) : (
                      <>
                        By taking the <span className="text-white font-semibold">Float</span> side, you receive the floating rate and pay the fixed rate. You profit when rates rise above the locked rate, and lose when rates fall below it. Your maximum loss is limited to the collateral you deposit.
                      </>
                    )}
                  </p>

                  {/* Detail Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Oracle Source", value: meta.oracleSource },
                      {
                        label: "Available Liq.",
                        value: `$${numberFormatter(available > 0 ? available : 0)}`,
                      },
                      {
                        label: "Pool Utilization",
                        value: `${utilization.toFixed(1)}%`,
                      },
                      {
                        label: "Active Swaps",
                        value: String(activeSwaps),
                      },
                      {
                        label: "Rate 7D Range",
                        value: `${(currentRate - 0.5).toFixed(2)}% – ${(currentRate + 0.3).toFixed(2)}%`,
                      },
                      { label: "Expiry", value: settlementDate },
                    ].map((p) => (
                      <div
                        key={p.label}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                      >
                        <div className="text-[9px] font-semibold text-[#5C5A66] uppercase tracking-wider mb-0.5">
                          {p.label}
                        </div>
                        <div className="text-xs font-mono font-semibold text-[#BAB8C4]">
                          {p.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Oracle addresses */}
                  <div className="space-y-2">
                    {[
                      {
                        label: "Rate Oracle",
                        value: marketDetails?.oracle ?? "—",
                        field: "oracle",
                      },
                      {
                        label: "Collateral Token",
                        value: marketDetails?.collateralToken ?? "—",
                        field: "collateral",
                      },
                    ].map((row) => (
                      <div
                        key={row.field}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                      >
                        <div>
                          <div className="text-[9px] font-semibold text-[#5C5A66] uppercase tracking-wider mb-0.5">
                            {row.label}
                          </div>
                          <div className="text-xs font-mono text-[#8A8894]">
                            {truncHex(row.value)}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleCopy(row.value, row.field)
                          }
                          className="p-1.5 rounded-md hover:bg-white/[0.05] text-[#8A8894] hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedField === row.field ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {infoTab === "details" && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Entry Fee",
                      value: `${marketDetails?.params?.swapFeePct ?? 0}%`,
                    },
                    {
                      label: "Early Exit Fee",
                      value: `${marketDetails?.params?.earlyExitFeePct ?? 0}%`,
                    },
                    {
                      label: "Liq. Threshold",
                      value: `${marketDetails?.params?.liquidationThresholdPct ?? 0}%`,
                    },
                    {
                      label: "Liq. Bonus",
                      value: `${marketDetails?.params?.liquidationBonusPct ?? 0}%`,
                    },
                    {
                      label: "Min Notional",
                      value: `$${numberFormatter(marketDetails?.params?.minNotional ?? 0)}`,
                    },
                    {
                      label: "Max Notional",
                      value: `$${numberFormatter(marketDetails?.params?.maxNotional ?? 0)}`,
                    },
                    {
                      label: "Max Utilization",
                      value: `${marketDetails?.params?.maxUtilizationPct ?? 0}%`,
                    },
                    {
                      label: "Fee Spread",
                      value: `${marketDetails?.params?.feeSpreadPct ?? 0}%`,
                    },
                    {
                      label: "Min Hold Period",
                      value: `${marketDetails?.params?.minHoldPeriodMinutes ?? 0}m`,
                    },
                    {
                      label: "Oracle Staleness",
                      value: `${marketDetails?.params?.maxOracleStalenessSeconds ?? 0}s`,
                    },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                    >
                      <div className="text-[9px] font-semibold text-[#5C5A66] uppercase tracking-wider mb-0.5">
                        {p.label}
                      </div>
                      <div className="text-xs font-mono font-semibold text-[#BAB8C4]">
                        {p.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Risks Tab */}
              {infoTab === "risks" && (
                <div className="space-y-3 text-[12px] text-[#8A8894] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-white font-semibold">
                        Liquidation risk.
                      </span>{" "}
                      If your position&apos;s health factor drops below the
                      liquidation threshold (
                      {marketDetails?.params?.liquidationThresholdPct ?? 0}%),
                      your collateral may be seized. Monitor your position
                      regularly.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-white font-semibold">
                        Early exit penalty.
                      </span>{" "}
                      Closing your swap before maturity incurs an early exit fee
                      of {marketDetails?.params?.earlyExitFeePct ?? 0}% of your
                      notional. Factor this into your strategy.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-white font-semibold">
                        Max loss = collateral deposited.
                      </span>{" "}
                      Your maximum loss is limited to the collateral you deposit.
                      There is no additional liability beyond your initial margin.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-white font-semibold">
                        Oracle risk.
                      </span>{" "}
                      Rates are sourced from on-chain oracles. Oracle
                      manipulation or stale data could impact swap settlement and
                      PnL calculations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== C2. RIGHT COLUMN ===== */}
          <div className="flex flex-col overflow-y-auto bg-gradient-to-b from-[#0f0f14] to-transparent">
            <div className="p-5 space-y-4 flex-1">
              {/* Curator */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#5C5A66]">
                  Curator
                </span>
                <a
                  href="https://x.com/asceswap"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] font-semibold text-[#a78bfa]/70 hover:text-[#a78bfa] transition-colors"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  @asceswap
                  <ExternalLink className="w-2.5 h-2.5 opacity-40" />
                </a>
              </div>

              {/* Side Selector */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveSide("FIXED")}
                  className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl transition-all cursor-pointer border ${
                    activeSide === "FIXED"
                      ? "bg-white/[0.08] border-white/[0.12] text-white shadow-lg"
                      : "bg-white/[0.02] border-white/[0.04] text-[#8A8894] hover:text-[#BAB8C4] hover:bg-white/[0.04]"
                  }`}
                >
                  <ArrowDown
                    className={`w-5 h-5 ${activeSide === "FIXED" ? "text-white" : "text-[#8A8894]"}`}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Fixed
                  </span>
                  <span className="text-[9px] text-[#8A8894] font-medium">
                    Rates go down
                  </span>
                </button>
                <button
                  onClick={() => setActiveSide("FLOATING")}
                  className={`flex flex-col items-center gap-1.5 py-4 px-3 rounded-xl transition-all cursor-pointer border ${
                    activeSide === "FLOATING"
                      ? "bg-[#a78bfa]/10 border-[#a78bfa]/20 text-[#a78bfa] shadow-lg"
                      : "bg-white/[0.02] border-white/[0.04] text-[#8A8894] hover:text-[#BAB8C4] hover:bg-white/[0.04]"
                  }`}
                >
                  <ArrowUp
                    className={`w-5 h-5 ${activeSide === "FLOATING" ? "text-[#a78bfa]" : "text-[#8A8894]"}`}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Float
                  </span>
                  <span className="text-[9px] text-[#8A8894] font-medium">
                    Rates go up
                  </span>
                </button>
              </div>

              {/* Notional Slider Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                <div className="text-[10px] font-semibold text-[#8A8894] uppercase tracking-wider">
                  Notional Amount
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-3xl font-bold text-white tracking-tighter">
                    ${numberFormatter(notional)}
                  </span>
                  <span className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#2775ca]/10 text-[10px] font-bold text-[#2775ca] uppercase shrink-0">
                    <span className="w-4 h-4 rounded-full bg-[#2775ca]/20 flex items-center justify-center text-[8px] text-[#2775ca] font-bold">
                      $
                    </span>
                    USDC
                  </span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={minNotional}
                  max={maxNotional}
                  step={maxNotional > 1000 ? maxNotional / 1000 : 1}
                  value={notional}
                  onChange={(e) => setNotional(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-[#5C5A66]">
                  <span>${numberFormatter(minNotional)}</span>
                  <span>${numberFormatter(maxNotional)}</span>
                </div>

                {/* Preset Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setNotional(Math.min(p.value, maxNotional))}
                      className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-colors cursor-pointer ${
                        notional === p.value
                          ? "bg-[rgba(167,139,250,0.10)] text-[#c4b5fd] border border-[rgba(167,139,250,0.22)]"
                          : "bg-white/[0.04] hover:bg-[rgba(167,139,250,0.10)] text-[#8A8894] hover:text-[#c4b5fd]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quote Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                <QuoteRow
                  label="Fixed Rate Locked"
                  value={`${lockedRate.toFixed(2)}%`}
                  tooltip={`Current rate ${currentRate.toFixed(2)}% + fee spread ${feeSpread}%`}
                />
                <QuoteRow
                  label="Required Collateral"
                  value={`$${numberFormatter(collateral)}`}
                  tooltip="Collateral = Notional × 100 / Margin Multiplier"
                />
                <QuoteRow
                  label="Effective Leverage"
                  value={`~${effectiveLeverage.toFixed(0)}x`}
                  highlight
                />
                <QuoteRow
                  label="Entry Fee"
                  value={`$${numberFormatter(entryFee)}`}
                />
                <QuoteRow label="Expires" value={settlementDate} />
              </div>

              {/* P&L Scenario Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-[#a78bfa]" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    P&L at Expiry
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {pnlScenarios.map((s) => (
                    <div
                      key={s.label}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center"
                    >
                      <div className="text-[9px] font-semibold text-[#8A8894] uppercase tracking-wider mb-1">
                        {s.label}
                      </div>
                      <div className="text-[10px] font-mono text-[#8A8894] mb-1">
                        {s.rate}
                      </div>
                      <div
                        className={`text-sm font-mono font-bold ${
                          s.pnl >= 0 ? "text-[#34d399]" : "text-[#f43f5e]"
                        }`}
                      >
                        {s.pnl >= 0 ? "+" : ""}${numberFormatter(Math.abs(s.pnl))}
                      </div>
                      <div
                        className={`text-[9px] font-mono ${
                          s.pct >= 0 ? "text-[#34d399]/70" : "text-[#f43f5e]/70"
                        }`}
                      >
                        {s.pct >= 0 ? "+" : ""}
                        {s.pct.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Slippage Row */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-[#8A8894] font-semibold">
                  Max Rate Tolerance
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#BAB8C4] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.04]">
                  5.15%
                </span>
              </div>

              {/* Error / Success */}
              {error && (
                <div className="text-red-400 text-xs p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  {error}
                </div>
              )}
              {txHash && (
                <div className="text-[#34d399] text-xs p-3 rounded-lg bg-[#34d399]/5 border border-[#34d399]/10 break-all">
                  Transaction submitted: {txHash}
                </div>
              )}
            </div>

            {/* CTA Button — pinned bottom */}
            <div className="p-5 pt-0 mt-auto">
              <button
                disabled={notional === 0 || loading}
                onClick={handleExecute}
                className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#c4b5fd] text-white shadow-lg shadow-[rgba(167,139,250,0.22)] hover:shadow-[rgba(167,139,250,0.40)] flex items-center justify-center gap-2"
              >
                {loading ? "Executing..." : "Execute Swap"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </FullModal>
  );
};

/* ─────────────────────── QuoteRow ─────────────────────── */

function QuoteRow({
  label,
  value,
  tooltip,
  highlight,
}: {
  label: string;
  value: string;
  tooltip?: string;
  highlight?: boolean;
}) {
  const [showTip, setShowTip] = useState(false);

  return (
    <div className="flex items-center justify-between py-1 relative">
      <span className="flex items-center gap-1 text-[11px] text-[#8A8894]">
        {label}
        {tooltip && (
          <span
            className="relative cursor-help"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
          >
            <Info className="w-3 h-3 text-[#5C5A66]" />
            {showTip && (
              <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#1a1a22] border border-white/10 rounded-lg px-3 py-2 text-[10px] text-[#BAB8C4] whitespace-nowrap z-30 shadow-lg">
                {tooltip}
              </span>
            )}
          </span>
        )}
      </span>
      <span
        className={`text-[11px] font-mono font-semibold ${
          highlight ? "text-[#a78bfa]" : "text-[#BAB8C4]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
