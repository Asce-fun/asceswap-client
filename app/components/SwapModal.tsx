"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  Info,
  ArrowDown,
  ArrowUp,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Wallet,
} from "lucide-react";
import { MarketData, SwapDirection, FormattedMarket } from "../interface/types";
import { MARKET_META } from "../constants/markets";
import { FullModal } from "./FullModal";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getTokenBalance } from "../blockchain/scripts/tokenBalance";
import { approveAndBuySwap } from "../blockchain/scripts/write/approveAndBuySwap";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";
import { getOracleRateHistory } from "../blockchain/scripts/oracleContract";
import { compute24hChange, compute7dRange } from "../blockchain/utils/utils";
import { getProtocolLogo } from "./SwapCard";

/* ─────────────────────── Types ─────────────────────── */

interface SwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: MarketData;
  direction: SwapDirection;
  marketDetails: FormattedMarket | null;
  oracleRatePct?: number | null;
}

type InfoTab = "overview" | "details" | "risks";

/* ─────────────────────── Component ─────────────────────── */

export const SwapModal: React.FC<SwapModalProps> = ({
  isOpen,
  onClose,
  market,
  direction,
  marketDetails,
  oracleRatePct,
}) => {
  const meta = MARKET_META?.[market.id] ?? {
    letter: "?",
    colorClass: "",
    iconColor: "#a78bfa",
    oracleSource: market.protocol,
    termLabel: "30d",
  };

  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const address = primaryWallet?.address;
  const isConnected = !!address;

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
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    visible: boolean;
  }>({
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
  const initialMarginMultiplierPct =
    marketDetails?.params?.initialMarginMultiplierPct ?? 100;

  const currentRate = oracleRatePct ?? marketDetails?.rate?.currentPct ?? 0;
  const feeSpread = marketDetails?.params?.feeSpreadPct ?? 0;
  const lockedRate = currentRate + feeSpread;
  const termDays = marketDetails?.params?.swapTermDays ?? 30;

  // Required collateral per on-chain SwapManager + HealthCalculator:
  // max_exposure = notional × rate × term / (BPS × YEAR)
  // required_margin = ceil(max_exposure × multiplier / BPS)
  // No floor at entry — min_margin_floor_bps only applies to ongoing health checks
  const collateral = useMemo(() => {
    if (notional <= 0 || lockedRate <= 0) return 0;
    const termFraction = termDays / 365;
    const maxExposure = notional * (lockedRate / 100) * termFraction;
    return maxExposure * (initialMarginMultiplierPct / 100);
  }, [notional, lockedRate, termDays, initialMarginMultiplierPct]);

  const effectiveLeverage = useMemo(
    () => (collateral > 0 ? notional / collateral : 0),
    [notional, collateral],
  );

  const entryFee = useMemo(
    () => collateral * ((marketDetails?.params?.swapFeePct ?? 0) / 100),
    [collateral, marketDetails?.params?.swapFeePct],
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

  /* ── Pool stats ── */
  const tvl = marketDetails?.pool?.totalCollateral ?? 0;
  const lockedTotal = marketDetails?.pool
    ? (marketDetails.pool.lockedFixed ?? 0) + (marketDetails.pool.lockedFloating ?? 0)
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

  const handleAmountChange = (val: string) => {
    // allow digits + single dot
    let clean = val.replace(/[^0-9.]/g, "");

    // prevent multiple decimals
    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }

    if (clean === "" || clean === ".") {
      setNotional(0);
      return;
    }

    const parsed = Number(clean);
    if (Number.isNaN(parsed)) return;

    setNotional(Math.min(parsed, maxNotional));
  };

  /* ── Execute Swap ── */
  const handleExecute = async () => {
    if (!marketDetails) return;
    try {
      setLoading(true);
      setError(null);
      console.log("[SwapModal] tokenAddress:", marketDetails.collateralToken);
      console.log("[SwapModal] asceSwapAddress:", process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS);
      console.log("[SwapModal] collateral:", collateral, "approveAmount:", collateral + entryFee, "notional:", notional);
      const hash = await approveAndBuySwap({
        tokenAddress: marketDetails.collateralToken,
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        pairId: String(marketDetails.pairId),
        side: activeSide,
        notional: notional,
        collateral: (collateral + entryFee) * 2,
        maxRateBps: 100_000,
        decimals: MARKET_META[market.id]?.decimals ?? marketDetails.decimals,
      });
      setTxHash(hash);
    } catch (e: any) {
      setError(e.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  /* ── Real 24h change + 7d range from oracle history ── */
  const [dayChange, setDayChange] = useState(0);
  const [rateRange, setRateRange] = useState<{ minPct: number; maxPct: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const oracleAddr = MARKET_META[market.id]?.oracleAddress;
    if (!oracleAddr) return;
    let cancelled = false;

    async function fetchHistory() {
      try {
        const [h24, h7d] = await Promise.all([
          getOracleRateHistory(oracleAddr, 24).catch(() => []),
          getOracleRateHistory(oracleAddr, 168).catch(() => []),
        ]);
        if (cancelled) return;
        const currentBps = currentRate * 100;
        if (h24.length > 0) {
          setDayChange(parseFloat(compute24hChange(h24, currentBps).toFixed(2)));
        }
        if (h7d.length > 0) {
          setRateRange(compute7dRange(h7d));
        }
      } catch {
        // oracle history unavailable
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [isOpen, market.id, currentRate]);

  const tokens = extractTokensFromName(market.name);
  const collateralTokens = extractTokensFromName(meta?.collateralSymbol ?? "USDC");
  const tokenSymbol = (meta?.collateralSymbol ?? "USDC").replace(/^mock/i, "");

  // Smart formatter: shows enough sig figs for tiny IRS collateral/fee values
  const formatAmount = (n: number): string => {
    if (n === 0) return "0";
    if (Math.abs(n) >= 0.01) return numberFormatter(n);
    // For very small values, show 4 significant digits
    return n.toPrecision(4);
  };

  return (
    <FullModal isOpen={isOpen} onClose={onClose} maxWidth="1120px">
      <div
        className="flex flex-col h-full"
        style={{ maxHeight: "calc(100vh - 48px)" }}
      >
        {/* ========== A. MODAL HEADER ========== */}
        <div className="px-6 pt-5 pb-4 border-b border-white/4 shrink-0">
          <div className="flex items-center gap-3 pr-10">
            {(() => { const PL = getProtocolLogo(market.protocol); return <PL size={40} />; })()}
            <div>
              <h2 className="text-lg font-semibold text-[#e8e6ee] tracking-tight">
                {market.protocol}
              </h2>
              <p className="text-[11px] text-[#9896a3] flex items-center gap-1">
                {market.name}
                {collateralTokens.map((token) => {
                  const Logo = TOKEN_LOGOS[token];
                  return <Logo key={token} size={14} />;
                })}
                {tokenSymbol}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#34d399]/20 bg-[#34d399]/5 mr-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
              <span className="text-[10px] font-semibold text-[#34d399] uppercase tracking-wider">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* ========== B. RATE STRIP ========== */}
        <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between shrink-0 bg-[rgba(12,12,18,0.5)]">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] font-semibold text-[#9896a3] uppercase tracking-wider mb-1">
                Current Rate
              </div>
              <span className="font-mono text-3xl font-bold text-[#e8e6ee] tracking-tighter">
                {currentRate.toFixed(2)}%
              </span>
            </div>
            <span
              className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${
                dayChange >= 0
                  ? "text-[#34d399] bg-[rgba(52,211,153,0.12)]"
                  : "text-[#f87171] bg-[rgba(248,113,113,0.12)]"
              }`}
            >
              {dayChange >= 0 ? "+" : ""}
              {dayChange.toFixed(2)}%{" "}
              <span className="text-[10px] opacity-60">(24h)</span>
            </span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/40">
              Curator
            </span>
            <a
              href="https://x.com/asceswap"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-medium text-[#34d399]/70 hover:text-[#34d399] transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @asceswap
              <ExternalLink className="w-2.5 h-2.5 opacity-40" />
            </a>
          </div>
        </div>

        {/* ========== C. TWO-COLUMN BODY ========== */}
        <div className="relative flex-1 overflow-hidden grid grid-cols-1 min-[960px]:grid-cols-[1fr_360px]">
          {/* Wallet Gate Overlay */}
          {!isConnected && (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-black/40">
              <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-[#0c0c12]/90 border border-[rgba(52,211,153,0.15)] shadow-2xl max-w-xs text-center">
                <div className="w-14 h-14 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-[#6ee7b7]" />
                </div>
                <h3 className="text-[#e8e6ee] font-bold text-base tracking-tight">
                  Connect Your Wallet
                </h3>
                <p className="text-[#9896a3] text-xs leading-relaxed">
                  Connect your wallet to view live charts, configure your trade, and execute swaps.
                </p>
                <button
                  onClick={() => setShowAuthFlow(true)}
                  className="w-full py-3 rounded-xl font-semibold text-sm
                    bg-gradient-to-br from-[#6ee7b7] to-[#34d399]
                    text-[#030305]
                    shadow-lg shadow-[rgba(52,211,153,0.20)]
                    hover:shadow-xl hover:shadow-[rgba(52,211,153,0.38)]
                    transition-all duration-300
                    cursor-pointer"
                >
                  Connect Wallet
                </button>
              </div>
            </div>
          )}
          {/* ===== C1. LEFT COLUMN ===== */}
          <div className="overflow-y-auto p-6 space-y-5 border-r border-white/[0.04]">
            {/* Chart Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 p-1 bg-[rgba(17,17,24,0.7)] rounded-[10px] border border-[#1e1e2a] w-fit">
                {["Rate", "TWA Rate"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setChartRateType(t)}
                    className={`px-4 py-2 rounded-lg font-semibold text-[0.75rem] transition-all cursor-pointer ${
                      chartRateType === t
                        ? "bg-[rgba(255,255,255,0.06)] text-[#e8e6ee]"
                        : "text-[#9896a3] hover:text-[#e8e6ee]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate History Chart */}
            <OracleChart
              oracleAddress={MARKET_META[market.id]?.oracleAddress ?? ''}
              isOpen={isOpen}
              liveRatePct={currentRate}
            />

            {/* Info Tabs — pill style */}
            <div>
              <div className="flex gap-1 p-1 bg-[rgba(17,17,24,0.7)] rounded-[10px] border border-[#1e1e2a] w-fit mb-3">
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
                    className={`px-4 py-2 rounded-lg font-semibold text-[0.75rem] transition-all cursor-pointer ${
                      infoTab === t.key
                        ? "bg-[rgba(255,255,255,0.06)] text-[#e8e6ee]"
                        : "text-[#9896a3] hover:text-[#e8e6ee]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Overview Tab */}
              {infoTab === "overview" && (
                <div className="space-y-4">
                  <p className="text-[12px] text-[#9896a3] leading-relaxed">
                    {activeSide === "FIXED" ? (
                      <>
                        By taking the{" "}
                        <span className="text-[#e8e6ee] font-semibold">Fixed</span>{" "}
                        side, you lock in the current rate. You profit when
                        floating rates fall below your locked rate, and lose
                        when rates rise above it. Your maximum loss is limited
                        to the collateral you deposit.
                      </>
                    ) : (
                      <>
                        By taking the{" "}
                        <span className="text-[#e8e6ee] font-semibold">Float</span>{" "}
                        side, you receive the floating rate and pay the fixed
                        rate. You profit when rates rise above the locked rate,
                        and lose when rates fall below it. Your maximum loss is
                        limited to the collateral you deposit.
                      </>
                    )}
                  </p>

                  {/* Oracle addresses – side by side */}
                  <div className="grid grid-cols-2 gap-2">
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
                        className="flex items-center justify-between bg-[rgba(17,17,24,0.7)] border border-[#1e1e2a] rounded-[10px] p-3"
                      >
                        <div className="min-w-0">
                          <div className="font-mono text-[0.52rem] tracking-[0.1em] uppercase text-[#5c5a66] mb-1.5">
                            {row.label}
                          </div>
                          <div className="font-mono font-bold text-[0.75rem] text-[#e8e6ee] truncate">
                            {truncHex(row.value)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopy(row.value, row.field)}
                          className="p-1.5 rounded-md hover:bg-white/[0.05] text-[#9896a3] hover:text-[#e8e6ee] transition-colors cursor-pointer shrink-0"
                        >
                          {copiedField === row.field ? (
                            <Check className="w-3.5 h-3.5 text-[#34d399]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* P&L Scenario Card */}
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-[#34d399]/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-[#34d399]" />
                      <span className="text-[10px] font-semibold text-[#e8e6ee] uppercase tracking-wider">
                        P&L at Expiry
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {pnlScenarios.map((s) => (
                        <div
                          key={s.label}
                          className="p-2.5 rounded-xl bg-white/[0.015] border border-white/[0.05] text-center"
                        >
                          <div className="text-[9px] font-semibold text-white/40 uppercase tracking-wider mb-1">
                            {s.label}
                          </div>

                          <div className="text-[10px] font-mono text-white/60 mb-1">
                            {s.rate}
                          </div>

                          <div
                            className={`text-sm font-mono font-bold ${
                              s.pnl >= 0 ? "text-[#34d399]" : "text-red-400"
                            }`}
                          >
                            {s.pnl >= 0 ? "+" : "-"}
                            {formatAmount(Math.abs(s.pnl))}
                          </div>

                          <div
                            className={`text-[9px] font-mono ${
                              s.pct >= 0 ? "text-[#34d399]/70" : "text-red-400/70"
                            }`}
                          >
                            {s.pct >= 0 ? "+" : ""}
                            {s.pct.toFixed(1)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Details Tab */}
              {infoTab === "details" && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Oracle Source",
                      value: meta.oracleSource,
                    },
                    {
                      label: "Available Liq.",
                      value: `${numberFormatter(available > 0 ? available : 0)} ${tokenSymbol}`,
                    },
                    {
                      label: "Pool Util.",
                      value: `${utilization.toFixed(1)}%`,
                    },
                    {
                      label: "Active Swaps",
                      value: String(activeSwaps),
                    },
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
                      value: `${numberFormatter(marketDetails?.params?.minNotional ?? 0)} ${tokenSymbol}`,
                    },
                    {
                      label: "Max Notional",
                      value: `${numberFormatter(marketDetails?.params?.maxNotional ?? 0)} ${tokenSymbol}`,
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
                      value: `${marketDetails?.params?.minHoldPeriodMinutes ?? 0} minutes`,
                    },
                    {
                      label: "Oracle Staleness",
                      value: `${marketDetails?.params?.maxOracleStalenessSeconds ?? 0} seconds`,
                    },
                  ].map((p) => (
                    <div
                      key={p.label}
                      className="bg-[rgba(17,17,24,0.7)] border border-[#1e1e2a] rounded-[10px] p-3.5"
                    >
                      <div className="font-mono text-[0.52rem] tracking-[0.1em] uppercase text-[#5c5a66] mb-1.5">
                        {p.label}
                      </div>
                      <div className="font-mono font-bold text-[0.85rem] text-[#e8e6ee]">
                        {p.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Risks Tab */}
              {infoTab === "risks" && (
                <div className="space-y-3 text-[12px] text-[#9896a3] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-[#e8e6ee] font-semibold">
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
                      <span className="text-[#e8e6ee] font-semibold">
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
                      <span className="text-[#e8e6ee] font-semibold">
                        Max loss = collateral deposited.
                      </span>{" "}
                      Your maximum loss is limited to the collateral you
                      deposit. There is no additional liability beyond your
                      initial margin.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-[#e8e6ee] font-semibold">
                        Oracle risk.
                      </span>{" "}
                      Rates are sourced from on-chain oracles. Oracle
                      manipulation or stale data could impact swap settlement
                      and PnL calculations.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ===== C2. RIGHT COLUMN ===== */}
          <div className="flex flex-col overflow-y-auto bg-gradient-to-b from-[rgba(12,12,18,0.7)] to-transparent">
            <div className="p-5 space-y-4 flex-1">
              {/* Side Selector */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <button
                  onClick={() => setActiveSide("FIXED")}
                  className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider
              transition-all cursor-pointer ${
                activeSide === "FIXED"
                  ? "bg-[#34d399] text-black shadow-[0_0_20px_-5px_rgba(52,211,153,0.6)]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
                >
                  Fixed
                </button>

                <button
                  onClick={() => setActiveSide("FLOATING")}
                  className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider
              transition-all cursor-pointer ${
                activeSide === "FLOATING"
                  ? "bg-[#34d399] text-black shadow-[0_0_20px_-5px_rgba(52,211,153,0.6)]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
                >
                  Float
                </button>
              </div>

              {/* Notional Input Section */}
              <div className="bg-[rgba(17,17,24,0.7)] border border-[#1e1e2a] rounded-[14px] p-[18px] space-y-3">
                <div className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#5c5a66]">
                  Notional Amount
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={notional === 0 ? "" : notional}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="bg-transparent border-none outline-none font-serif font-bold text-[1.8rem] text-[#e8e6ee] tracking-tighter w-full focus:ring-0 placeholder:opacity-20"
                  />
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.15)] font-mono font-bold text-[0.75rem] text-[#34d399] shrink-0">
                    <div className="flex items-center gap-1">
                      {collateralTokens.map((token) => {
                        const Logo = TOKEN_LOGOS[token];
                        return <Logo key={token} size={20} />;
                      })}
                    </div>
                    {tokenSymbol}
                  </span>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min={minNotional}
                  max={maxNotional}
                  step={(maxNotional - minNotional) / 100 || 0.0001}
                  value={Math.min(Math.max(notional, minNotional), maxNotional)}
                  onChange={(e) => setNotional(Number(e.target.value))}
                  className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500
                    [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-[#0c0c12]"
                />
                <div className="flex justify-between items-center text-[9px] font-mono text-[#5C5A66]">
                  <div className="flex items-center gap-3">
                    <span>Min: {numberFormatter(minNotional)}</span>
                    <span>Max: {numberFormatter(maxNotional)}</span>
                  </div>
                  <button
                    onClick={() => walletBalance && setNotional(Math.min(walletBalance, maxNotional))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md
                      border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)]
                      font-mono text-[0.6rem] font-bold text-[#34d399]
                      cursor-pointer hover:bg-[rgba(52,211,153,0.12)]
                      transition-colors"
                  >
                    <Wallet className="w-3 h-3 text-[#34d399]" />
                    Wallet: {numberFormatter(walletBalance ? walletBalance : 0)}
                  </button>
                </div>
              </div>

              {/* Summary Rows */}
              <div className="flex flex-col">
                <QuoteRow
                  label="Fixed Rate Locked"
                  value={`${lockedRate.toFixed(2)}%`}
                  tooltip={`Current rate ${currentRate.toFixed(2)}% + fee spread ${feeSpread}%`}
                />
                <QuoteRow
                  label="Required Collateral"
                  value={`${formatAmount(collateral)} ${tokenSymbol}`}
                  tooltip="Collateral = maxExposure × margin multiplier (based on rate × term)"
                />
                <QuoteRow
                  label="Effective Leverage"
                  value={`~${effectiveLeverage.toFixed(1)}x`}
                  highlight
                />
                <QuoteRow label="Market Maturity" value={settlementDate} />
              </div>

              {/* Max Rate Tolerance */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] text-[#9896a3] font-semibold">
                  Max Rate Tolerance
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#9896a3] px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.04]">
                  {(lockedRate * 1.10).toFixed(2)}%
                </span>
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-400 text-xs p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  {error}
                </div>
              )}

              {/* Success State */}
              {txHash && (
                <div className="p-5 rounded-2xl bg-[#34d399]/[0.04] border border-[#34d399]/20 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Success Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center shrink-0">
                      <Check className="w-5 h-5 text-[#34d399]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#e8e6ee]">Swap Executed</p>
                      <p className="text-[10px] text-white/50">Position NFT minted to your wallet</p>
                    </div>
                  </div>

                  {/* Swap Summary */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Side</div>
                      <div className="text-[11px] font-semibold text-[#e8e6ee]">{activeSide === "FIXED" ? "Fixed" : "Float"}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Notional</div>
                      <div className="text-[11px] font-mono font-semibold text-[#e8e6ee]">{formatAmount(notional)} {tokenSymbol}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Locked Rate</div>
                      <div className="text-[11px] font-mono font-semibold text-[#e8e6ee]">{lockedRate.toFixed(2)}%</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Collateral</div>
                      <div className="text-[11px] font-mono font-semibold text-[#e8e6ee]">{formatAmount(collateral)} {tokenSymbol}</div>
                    </div>
                  </div>

                  {/* Tx Hash */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="min-w-0">
                      <div className="text-[9px] font-semibold text-white/30 uppercase tracking-wider mb-0.5">Transaction</div>
                      <div className="text-[11px] font-mono text-white/60 truncate">{`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        onClick={() => handleCopy(txHash, "txHash")}
                        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-[#e8e6ee] transition-colors cursor-pointer"
                      >
                        {copiedField === "txHash" ? <Check className="w-3.5 h-3.5 text-[#34d399]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a
                        href={`https://sepolia.voyager.online/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/[0.05] text-white/40 hover:text-[#34d399] transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Explorer Button */}
                  <a
                    href={`https://sepolia.voyager.online/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl
                      bg-[#34d399]/10 border border-[#34d399]/20
                      text-[#34d399] text-[11px] font-semibold uppercase tracking-wider
                      hover:bg-[#34d399]/20 transition-colors"
                  >
                    View on Explorer
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* CTA Button — pinned bottom */}
            <div className="p-5 pt-0 mt-auto">
              {!txHash && walletBalance !== null && walletBalance < collateral + entryFee && notional > 0 && (
                <div className="text-amber-400 text-[10px] p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 mb-2 text-center">
                  Insufficient balance — need {formatAmount(collateral + entryFee)} {tokenSymbol}, wallet has {formatAmount(walletBalance)} {tokenSymbol}
                </div>
              )}
              {txHash ? (
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-xl font-semibold text-xs uppercase tracking-[0.15em]
                   transition-all active:scale-[0.98] cursor-pointer
                   bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08]
                   text-[#e8e6ee]
                   flex items-center justify-center gap-2"
                >
                  Close
                </button>
              ) : (
                <button
                  disabled={notional === 0 || loading || (walletBalance !== null && walletBalance < collateral + entryFee)}
                  onClick={handleExecute}
                  className="w-full py-4 rounded-xl bg-[#34d399] text-[#060608] font-bold text-[0.95rem]
                   hover:bg-[#6ee7b7] active:bg-[#059669]
                   disabled:bg-[rgba(17,17,24,0.7)] disabled:text-[#5c5a66] disabled:cursor-not-allowed
                   transition-colors
                   flex items-center justify-center gap-2"
                >
                  {loading ? "Executing..." : "Execute Swap"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullModal>
  );
};

/* ─────────────────────── OracleChart ─────────────────────── */

function OracleChart({ oracleAddress, isOpen, liveRatePct }: { oracleAddress: string; isOpen: boolean; liveRatePct?: number }) {
  const [points, setPoints] = useState<{ x: number; y: number; label: string; rate: number; fullDate: string }[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!isOpen || !oracleAddress) return;
    let cancelled = false;

    async function load() {
      try {
        const history = await getOracleRateHistory(oracleAddress, 50);
        if (cancelled || !history || history.length === 0) return;

        const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);

        // Append live rate from market contract as the latest point
        if (liveRatePct && liveRatePct > 0) {
          const lastTs = sorted.length > 0 ? sorted[sorted.length - 1].timestamp : Math.floor(Date.now() / 1000);
          sorted.push({ rateBps: Math.round(liveRatePct * 100), timestamp: Math.floor(Date.now() / 1000) });
        }

        const rates = sorted.map(h => h.rateBps / 100);
        const minRate = Math.min(...rates);
        const maxRate = Math.max(...rates);
        const range = maxRate - minRate || 1;

        const W = 600, H = 255, PAD_X = 60, PAD_Y = 30;
        const plotW = W - PAD_X * 2;
        const plotH = H - PAD_Y * 2;

        const pts = sorted.map((entry, i) => {
          const x = PAD_X + (i / Math.max(sorted.length - 1, 1)) * plotW;
          const y = PAD_Y + plotH - ((entry.rateBps / 100 - minRate) / range) * plotH;
          const d = new Date(entry.timestamp * 1000);
          return {
            x, y,
            label: `${d.getMonth() + 1}/${d.getDate()}`,
            rate: entry.rateBps / 100,
            fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
          };
        });

        if (!cancelled) setPoints(pts);
      } catch {
        // History unavailable
      }
    }

    load();
    return () => { cancelled = true; };
  }, [oracleAddress, isOpen, liveRatePct]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 600;

      let closest = 0;
      let minDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dist = Math.abs(points[i].x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      }
      setHoverIdx(closest);
    },
    [points],
  );

  const handleMouseLeave = useCallback(() => {
    setHoverIdx(null);
  }, []);

  if (points.length === 0) {
    return (
      <div className="relative rounded-xl bg-white/[0.015] border border-[#34d399]/10 overflow-hidden flex items-center justify-center" style={{ height: 255 }}>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          Loading chart...
        </div>
      </div>
    );
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = linePath + ` L${points[points.length - 1].x},230 L${points[0].x},230 Z`;
  const hp = hoverIdx !== null ? points[hoverIdx] : null;

  return (
    <div className="relative rounded-xl bg-white/[0.015] border border-[#34d399]/10 overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 600 255"
        className="w-full cursor-crosshair"
        style={{ height: 255 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {[60, 110, 160, 210].map((y) => (
          <line key={y} x1="40" y1={y} x2="580" y2={y} stroke="rgba(52,211,153,0.08)" strokeDasharray="4 4" />
        ))}

        <path d={areaPath} fill="url(#chartGradient)" />
        <path d={linePath} fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

        {/* Last point dot (when not hovering) */}
        {hoverIdx === null && points.length > 0 && (
          <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="4" fill="#34d399" />
        )}

        {/* Hover crosshair + dot */}
        {hp && (
          <>
            <line x1={hp.x} y1="30" x2={hp.x} y2="230" stroke="rgba(52,211,153,0.3)" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="60" y1={hp.y} x2="540" y2={hp.y} stroke="rgba(52,211,153,0.15)" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={hp.x} cy={hp.y} r="5" fill="#0c0c12" stroke="#34d399" strokeWidth="2" />
          </>
        )}

        {/* Invisible hover zones for each point */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={p.x - 15}
            y="0"
            width="30"
            height="255"
            fill="transparent"
          />
        ))}
      </svg>

      {/* Tooltip */}
      {hp && (
        <div
          className="absolute pointer-events-none z-20 px-3 py-2 rounded-lg bg-[#0c0c12] border border-[#34d399]/20 shadow-xl"
          style={{
            left: `${(hp.x / 600) * 100}%`,
            top: `${(hp.y / 255) * 100}%`,
            transform: `translate(${hp.x > 400 ? "-110%" : "10%"}, -120%)`,
          }}
        >
          <div className="text-[10px] text-white/50 mb-0.5">{hp.fullDate}</div>
          <div className="font-mono font-bold text-sm text-[#34d399]">{hp.rate.toFixed(2)}%</div>
        </div>
      )}
    </div>
  );
}

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
    <div className="flex items-center justify-between py-[11px] border-b border-[rgba(30,30,42,0.5)] last:border-b-0 relative">
      <span className="flex items-center gap-1 text-[0.8rem] text-[#9896a3]">
        {label}

        {tooltip && (
          <span
            className="relative cursor-help"
            onMouseEnter={() => setShowTip(true)}
            onMouseLeave={() => setShowTip(false)}
          >
            <Info className="w-3 h-3 text-white/30 hover:text-[#34d399] transition-colors" />

            {showTip && (
              <span
                className="absolute left-full ml-2 top-1/2 -translate-y-1/2
                               bg-[#0c0c12]
                               border border-[#34d399]/20
                               rounded-lg px-3 py-2
                               text-[10px] text-white/70
                               whitespace-nowrap z-30 shadow-xl"
              >
                {tooltip}
              </span>
            )}
          </span>
        )}
      </span>

      <span
        className={`font-mono font-bold text-[0.8rem] ${
          highlight ? "text-[#34d399]" : "text-[#e8e6ee]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
