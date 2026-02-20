"use client";

import React, { useState, useEffect } from "react";
import { Info, Wallet, ArrowRight, AlertTriangle, Check, Copy, ExternalLink } from "lucide-react";
import { FormattedMarket, MarketData } from "../interface/types";
import { MARKET_META } from "../constants/markets";
import { FullModal } from "./FullModal";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getTokenBalance } from "../blockchain/scripts/tokenBalance";
import { getLpPosition, getExchangeRateForLp } from "../blockchain/scripts/markets";
import { approveAndSupplyLp } from "../blockchain/scripts/write/approveAndSupplyLp";
import { withdrawLpLiquidity } from "../blockchain/scripts/write/withdrawLiquidity";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";
import { getProtocolLogo } from "./SwapCard";

interface LpModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: MarketData;
  marketDetails: FormattedMarket | null;
  defaultTab?: ActionTab;
}

type ActionTab = "deposit" | "withdraw";
type InfoTab = "fees" | "how" | "risks";

export const LpModal: React.FC<LpModalProps> = ({
  isOpen,
  onClose,
  market,
  marketDetails,
  defaultTab = "deposit",
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
  const tokenSymbol = (meta?.collateralSymbol ?? "USDC").replace(/^mock/i, "");

  const [actionTab, setActionTab] = useState<ActionTab>(defaultTab);
  const [infoTab, setInfoTab] = useState<InfoTab>("fees");
  const [amount, setAmount] = useState(0);
  const [amountStr, setAmountStr] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lpShares, setLpShares] = useState<number | null>(null);
  const [lastDepositTime, setLastDepositTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedTx, setCopiedTx] = useState(false);

  // Sync actionTab when modal opens or defaultTab changes
  useEffect(() => {
    if (isOpen) {
      setActionTab(defaultTab);
    }
  }, [isOpen, defaultTab]);

  // Market data
  const tvl = marketDetails?.pool?.totalCollateral ?? 0;
  const lockedTotal = marketDetails?.pool
    ? (marketDetails.pool.lockedFixed ?? 0) + (marketDetails.pool.lockedFloating ?? 0)
    : 0;
  const available = tvl - lockedTotal;
  const utilization = tvl > 0 ? (lockedTotal / tvl) * 100 : 0;
  const activeSwaps = marketDetails?.stats?.activeSwaps ?? 0;

  const swapFeeBps = (marketDetails?.params?.swapFeePct ?? 0) * 100;
  const termDays = marketDetails?.params?.swapTermDays ?? 30;
  const utilizationFraction = utilization / 100;

  // Fee APY calculation
  const feeApy = marketDetails
    ? (swapFeeBps * utilizationFraction * (365 / termDays)) / 10000
    : 0;

  // Share price state (fetched from chain)
  const [sharePrice, setSharePrice] = useState(1.0);

  const decimals = MARKET_META[market.id]?.decimals ?? marketDetails?.decimals ?? 6;

  // Fetch real exchange rate
  useEffect(() => {
    if (!isOpen || !marketDetails?.pairId) return;
    let cancelled = false;

    async function fetchSharePrice() {
      try {
        const rawRate = await getExchangeRateForLp(String(marketDetails!.pairId));
        if (!cancelled) {
          // Exchange rate is in 1e18 precision per spec (1e18 = 1.0 per share)
          const rate = Number(rawRate) / 1e18;
          setSharePrice(rate > 0 ? rate : 1.0);
        }
      } catch {
        // fallback to 1.0
      }
    }

    fetchSharePrice();
    return () => { cancelled = true; };
  }, [isOpen, marketDetails?.pairId, decimals]);

  // PnL component: lifetime share price gain (not annualized — would need time data)
  const pnlReturn = sharePrice > 1.0 ? (sharePrice - 1.0) : 0;
  const totalApy = feeApy + pnlReturn;

  // Exposure breakdown
  const fixedNotional = marketDetails?.pool?.lockedFixed ?? 0;
  const floatNotional = marketDetails?.pool?.lockedFloating ?? 0;
  const totalNotional = fixedNotional + floatNotional;
  const fixedPct =
    totalNotional > 0 ? (fixedNotional / totalNotional) * 100 : 62;
  const floatPct =
    totalNotional > 0 ? (floatNotional / totalNotional) * 100 : 38;
  const isNetShort = fixedPct > floatPct;
  const minNotional = marketDetails?.params?.minNotional ?? 0;
  const maxNotional = marketDetails?.params?.maxNotional ?? 1000000;
  const initialMarginPct =
    marketDetails?.params?.initialMarginMultiplierPct ?? 100;
  const maxAmount = walletBalance ?? 0;
  const maxLpshares = lpShares ?? 0;
  // Fetch balances
  useEffect(() => {
    if (!address || !isOpen || !marketDetails?.collateralToken || !marketDetails?.pairId) return;
    let cancelled = false;

    async function fetchWalletBalance() {
      try {
        const res = await getTokenBalance(
          marketDetails?.collateralToken as string,
          address as string,
        );
        if (!cancelled) setWalletBalance(res.formatted);
      } catch {
        if (!cancelled) setWalletBalance(null);
      }
    }

    async function fetchLpShares() {
      try {
        const res = await getLpPosition(
          String(marketDetails?.pairId),
          address as string,
        );
        if (!cancelled) {
          setLpShares(Number(res.shares) / 10 ** decimals);
          setLastDepositTime(Number(res.last_deposit_time));
        }
      } catch {
        if (!cancelled) setLpShares(null);
      }
    }

    fetchWalletBalance();
    fetchLpShares();

    return () => {
      cancelled = true;
    };
  }, [address, marketDetails?.collateralToken, marketDetails?.pairId, isOpen]);

  // Reset state when switching tabs
  useEffect(() => {
    setAmount(0);
    setAmountStr("");
    setTxHash(null);
    setError(null);
  }, [actionTab]);

  const handleAmountChange = (val: string) => {
    // allow digits + single dot
    let clean = val.replace(/[^0-9.]/g, "");

    // prevent multiple decimals
    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }

    if (clean === "" || clean === ".") {
      setAmount(0);
      return;
    }

    const parsed = Number(clean);
    if (Number.isNaN(parsed)) return;

    if (walletBalance === null) {
      setAmount(parsed);
      return;
    }
    if (actionTab === "deposit") {
      setAmount(Math.min(parsed, walletBalance));
    } else {
      if (lpShares) {
        setAmount(Math.min(parsed, lpShares));
      }
    }
  };

  const setPresetAmount = (value: number) => {
    setAmount(value);
    setAmountStr(value > 0 ? value.toString() : "");
  };

  const currentBalance = actionTab === "deposit" ? walletBalance : lpShares;

  const handleDeposit = async () => {
    try {
      setLoading(true);
      setError(null);
      const hash = await approveAndSupplyLp({
        tokenAddress: marketDetails?.collateralToken as string,
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        pairId: String(marketDetails?.pairId),
        amount: Number(amount),
        decimals: marketDetails?.decimals as number,
      });
      setTxHash(hash);
    } catch (e: any) {
      setError(e.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      setError(null);
      const hash = await withdrawLpLiquidity({
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        pairId: String(marketDetails?.pairId),
        shares: Number(amount),
        shareDecimals: decimals,
      });
      setTxHash(hash);
    } catch (e: any) {
      setError(e.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  // Preview calculations
  const sharesReceived = amount > 0 ? amount / sharePrice : 0;
  const newPoolShare =
    amount > 0 && tvl > 0 ? (amount / (tvl + amount)) * 100 : 0;
  const dailyEarnings = amount > 0 ? (amount * totalApy) / 365 : 0;

  const sharesToBurn = amount;
  const receiveAmount = amount * sharePrice;
  const remainingValue = lpShares ? (lpShares - amount) * sharePrice : 0;
  const tokens = extractTokensFromName(market.name);
  return (
    <FullModal isOpen={isOpen} onClose={onClose} maxWidth="1080px">
      <div
        className="flex flex-col h-full"
        style={{ maxHeight: "calc(100vh - 48px)" }}
      >
        {/* ========== MODAL HEADER ========== */}
        <div className="px-6 pt-5 pb-4 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3 pr-10">
            {(() => { const PL = getProtocolLogo(market.protocol); return <PL size={40} />; })()}
            <div>
              <h2 className="text-lg font-semibold text-[#e8e6ee] tracking-tight">
                {market.protocol} — Liquidity Pool
              </h2>
              <p className="text-[11px] text-[#9896a3] flex items-center gap-1">
                {market.name}
                {extractTokensFromName((meta?.collateralSymbol ?? "USDC")).map((token) => {
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

        {/* ========== APY STRIP ========== */}
        <div className="px-6 py-4 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-4 shrink-0 bg-[rgba(12,12,18,0.5)]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-semibold text-[#9896a3] uppercase tracking-wider">
                Estimated APY
              </span>
              <Info className="w-3 h-3 text-[#5C5A66] cursor-help" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-trade-up tracking-tighter">
                {(totalApy * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-[#9896a3]">
                Fees +{(feeApy * 100).toFixed(1)}% · PnL +
                {(pnlReturn * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-[#9896a3] uppercase tracking-wider mb-1">
              Share Price
            </div>
            <div className="font-mono text-lg font-bold text-[#e8e6ee]">
              {sharePrice.toFixed(4)}{" "}
              <span className="text-[#9896a3] text-xs">{tokenSymbol}</span>
            </div>
            <div className="text-[10px] text-trade-up">
              +{((sharePrice - 1.0) * 100).toFixed(1)}% since inception
            </div>
          </div>
        </div>

        {/* ========== TWO-COLUMN BODY ========== */}
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
                  Connect your wallet to view pool details, deposit liquidity, and manage your LP positions.
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

          {/* ===== LEFT COLUMN ===== */}
          <div className="overflow-y-auto p-6 space-y-5 border-r border-white/[0.04]">
            {/* Exposure Breakdown */}
            <div className="bg-[rgba(17,17,24,0.7)] border border-[#1e1e2a] rounded-[14px] p-[18px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#5c5a66]">
                  Exposure Breakdown
                </span>

                <span
                  className={`text-[0.6rem] px-2 py-0.5 rounded font-mono font-bold ${
                    isNetShort
                      ? "bg-[#34d399]/10 text-[#34d399] border border-[#34d399]/30"
                      : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  }`}
                >
                  {isNetShort ? "Net Short Rates" : "Net Long Rates"}
                </span>
              </div>

              {/* Stacked bar */}
              <div className="h-1.5 rounded-sm overflow-hidden flex bg-white/[0.05]">
                <div
                  className="bg-[#34d399]/80 transition-all duration-500"
                  style={{ width: `${fixedPct}%` }}
                />
                <div
                  className="bg-white/20 transition-all duration-500"
                  style={{ width: `${floatPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                {/* Fixed */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#34d399]" />
                  <span className="text-white/50">Fixed</span>
                  <span className="font-mono font-semibold text-white/80">
                    {fixedPct.toFixed(0)}%
                  </span>
                  <span className="text-white/30 ml-1">
                    ${numberFormatter(fixedNotional)}
                  </span>
                </div>

                {/* Float */}
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white/40" />
                  <span className="text-white/50">Float</span>
                  <span className="font-mono font-semibold text-white/80">
                    {floatPct.toFixed(0)}%
                  </span>
                  <span className="text-white/30 ml-1">
                    ${numberFormatter(floatNotional)}
                  </span>
                </div>
              </div>

              <p className="text-[0.75rem] text-[#5c5a66] leading-relaxed mt-3">
                The pool takes the opposite side of every swap. When more
                traders are fixed, the pool is net short rates (profits when
                rates fall).
              </p>
            </div>

            {/* Info Tabs */}
            <div>
              <div className="flex gap-1 p-1 bg-[rgba(17,17,24,0.7)] rounded-[10px] border border-[#1e1e2a] w-fit mb-3">
                {(
                  [
                    { key: "fees", label: "Fees & Params" },
                    { key: "how", label: "How It Works" },
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

              {infoTab === "fees" && (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      label: "Fee Spread",
                      value: `${marketDetails?.params?.feeSpreadPct ?? 0}%`,
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
                      label: "Liq. Bonus",
                      value: `${marketDetails?.params?.liquidationBonusPct ?? 0}%`,
                    },
                    {
                      label: "Max Utilization",
                      value: `${marketDetails?.params?.maxUtilizationPct ?? 0}%`,
                    },
                    {
                      label: "Cooldown",
                      value: `${marketDetails?.params?.minHoldPeriodMinutes ?? 0}m`,
                    },
                    {
                      label: "LP Permission",
                      value: marketDetails?.params?.isLpPermissioned
                        ? "Permissioned"
                        : "Open",
                    },
                    {
                      label: "Swap Term",
                      value: `${marketDetails?.params?.swapTermDays ?? 0}d`,
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

              {infoTab === "how" && (
                <div className="space-y-3 text-[12px] text-[#9896a3] leading-relaxed">
                  <p>
                    <span className="text-[#e8e6ee] font-semibold">
                      Share-based accounting.
                    </span>{" "}
                    When you deposit collateral, you receive LP shares proportional to
                    your contribution. The share price increases as the pool
                    earns swap fees and trader losses.
                  </p>
                  <p>
                    <span className="text-[#e8e6ee] font-semibold">
                      Counterparty role.
                    </span>{" "}
                    As an LP, you take the opposite side of every swap. You earn
                    80% of all swap entry fees plus the net PnL from trader
                    positions. When traders lose, LPs gain — and vice versa.
                  </p>
                  <p>
                    <span className="text-[#e8e6ee] font-semibold">
                      Withdrawals.
                    </span>{" "}
                    You can redeem shares for the underlying collateral at the current
                    share price, subject to available liquidity and cooldown
                    requirements.
                  </p>
                </div>
              )}

              {infoTab === "risks" && (
                <div className="space-y-3 text-[12px] text-[#9896a3] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-[#e8e6ee] font-semibold">
                        Directional risk.
                      </span>{" "}
                      If the majority of traders are profitable, LP share price
                      will decline. The pool can experience net losses during
                      strong trending markets.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-[#e8e6ee] font-semibold">
                        Utilization lock.
                      </span>{" "}
                      When pool utilization is high, you may not be able to
                      withdraw your full balance immediately. Liquidity becomes
                      available as swaps settle.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-[#e8e6ee] font-semibold">
                        Cooldown period.
                      </span>{" "}
                      After depositing, there is a minimum hold period before
                      you can withdraw. Check the Fees & Params tab for the
                      current cooldown.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Total TVL", value: `$${numberFormatter(tvl)}` },
                { label: "Available", value: `$${numberFormatter(available > 0 ? available : 0)}` },
                { label: "Utilization", value: `${utilization.toFixed(1)}%` },
                { label: "Active Swaps", value: String(activeSwaps) },
              ].map((s) => (
                <div key={s.label} className="bg-[rgba(17,17,24,0.7)] border border-[#1e1e2a] rounded-[10px] p-3.5">
                  <div className="font-mono text-[0.52rem] tracking-[0.1em] uppercase text-[#5c5a66] mb-1.5">{s.label}</div>
                  <div className="font-mono font-bold text-[0.85rem] text-[#e8e6ee]">{s.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="flex flex-col overflow-y-auto bg-gradient-to-b from-[rgba(12,12,18,0.7)] to-transparent">
            <div className="p-5 space-y-4 flex-1 flex flex-col">
              {/* Action Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <button
                  onClick={() => setActionTab("deposit")}
                  className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider
              transition-all cursor-pointer ${
                actionTab === "deposit"
                  ? "bg-[#34d399] text-black shadow-[0_0_20px_-5px_rgba(52,211,153,0.6)]"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
              }`}
                >
                  Deposit
                </button>

                <button
                  onClick={() => setActionTab("withdraw")}
                  className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    actionTab === "withdraw"
                      ? "bg-rose-600 text-white shadow-lg"
                      : "text-[#9896a3] hover:text-[#9896a3]"
                  }`}
                >
                  Withdraw
                </button>
              </div>

              {/* Input Section */}
              <div className="bg-[rgba(17,17,24,0.7)] border border-[#1e1e2a] rounded-[14px] p-[18px] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#5c5a66]">
                    {actionTab === "deposit"
                      ? "Deposit Amount"
                      : "Withdraw Amount"}
                  </span>
                  <button
                    onClick={() => setPresetAmount(actionTab === "deposit" ? maxAmount : maxLpshares)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] font-mono text-[0.6rem] font-bold text-[#34d399] cursor-pointer hover:bg-[rgba(52,211,153,0.12)]"
                  >
                    <Wallet className="w-3 h-3" />
                    {actionTab === "deposit"
                      ? `${numberFormatter(walletBalance ?? 0)} ${tokenSymbol}`
                      : `${numberFormatter(lpShares ?? 0)} Shares`}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="bg-transparent border-none outline-none font-serif font-bold text-[1.8rem] text-[#e8e6ee] tracking-tighter w-full focus:ring-0 placeholder:opacity-20"
                  />
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.15)] font-mono font-bold text-[0.75rem] text-[#34d399] shrink-0">
                    {tokenSymbol}
                  </span>
                </div>

                {/* Slider */}
                {(() => {
                  const sliderMax = actionTab === "deposit" ? maxAmount : maxLpshares;
                  const sliderStep = sliderMax > 0 ? sliderMax / 100 : 0.0001;
                  return (
                    <input
                      type="range"
                      min={0}
                      max={sliderMax}
                      step={sliderStep}
                      value={Math.min(amount, sliderMax)}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full h-2
               bg-white/10
               rounded-full
               appearance-none
               cursor-pointer
               accent-[#34d399]"
                      style={{ borderWidth: "3px", borderColor: "#0c0c12" }}
                    />
                  );
                })()}
                <div className="flex justify-between items-center text-[9px] font-mono text-[#5C5A66]">
                  {actionTab === "deposit" ? (
                    <div className="flex items-center gap-3">
                      <span>Min: {numberFormatter(minNotional)}</span>
                      <span>Max: {numberFormatter(maxNotional)}</span>
                    </div>
                  ) : (
                    <div />
                  )}
                  <button
                    onClick={() => setPresetAmount(actionTab === "deposit" ? maxAmount : maxLpshares)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[rgba(52,211,153,0.2)] bg-[rgba(52,211,153,0.06)] font-mono text-[0.6rem] font-bold text-[#34d399] cursor-pointer hover:bg-[rgba(52,211,153,0.12)]"
                  >
                    <Wallet className="w-3 h-3 text-[#34d399]" />
                    Wallet: {numberFormatter(walletBalance ? walletBalance : 0)}
                  </button>
                </div>
              </div>

              {/* Summary Rows */}
              <div>
                {actionTab === "deposit" ? (
                  <>
                    <PreviewRow
                      label="You'll Receive"
                      value={`${sharesReceived.toFixed(2)} Shares`}
                    />
                    <PreviewRow
                      label="Exchange Rate"
                      value={`1 Share = ${sharePrice.toFixed(4)} ${tokenSymbol}`}
                    />
                    <PreviewRow
                      label="New Pool Share"
                      value={`${newPoolShare.toFixed(3)}%`}
                    />
                    <PreviewRow
                      label="Est. Daily Earnings"
                      value={`$${dailyEarnings.toFixed(2)}`}
                      highlight
                    />
                  </>
                ) : (
                  <>
                    <PreviewRow
                      label="Shares to Burn"
                      value={`${sharesToBurn.toFixed(2)}`}
                    />
                    <PreviewRow
                      label="You'll Receive"
                      value={`$${numberFormatter(receiveAmount)}`}
                      highlight
                    />
                    <PreviewRow
                      label="Remaining Value"
                      value={`$${numberFormatter(remainingValue > 0 ? remainingValue : 0)}`}
                    />
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="text-red-400 text-xs p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  {error}
                </div>
              )}

              {/* Success */}
              {txHash && (
                <div className="p-4 rounded-xl bg-[#34d399]/[0.04] border border-[#34d399]/20 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4 text-[#34d399]" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#e8e6ee]">
                        {actionTab === "deposit" ? "Liquidity Deposited" : "Withdrawal Complete"}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {actionTab === "deposit"
                          ? `${numberFormatter(amount)} ${tokenSymbol} supplied to pool`
                          : `${numberFormatter(amount)} shares redeemed`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                    <span className="font-mono text-[10px] text-white/50 truncate">
                      {`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}
                    </span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(txHash);
                          setCopiedTx(true);
                          setTimeout(() => setCopiedTx(false), 2000);
                        }}
                        className="p-1 rounded-md hover:bg-white/[0.05] text-white/40 hover:text-white transition-colors cursor-pointer"
                      >
                        {copiedTx ? <Check className="w-3 h-3 text-[#34d399]" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <a
                        href={`https://sepolia.voyager.online/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md hover:bg-white/[0.05] text-white/40 hover:text-[#34d399] transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <a
                    href={`https://sepolia.voyager.online/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg
                      bg-[#34d399]/10 border border-[#34d399]/20
                      text-[#34d399] text-[10px] font-semibold uppercase tracking-wider
                      hover:bg-[#34d399]/20 transition-colors"
                  >
                    View on Explorer
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* CTA Button - pinned at bottom with mt-auto */}
              <div className="mt-auto pt-2">
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
                ) : actionTab === "deposit" ? (
                  <button
                    disabled={amount === 0 || loading}
                    onClick={handleDeposit}
                    className="w-full py-4 rounded-xl bg-[#34d399] text-[#060608] font-bold text-[0.95rem] hover:bg-[#6ee7b7] active:bg-[#059669] disabled:bg-[rgba(17,17,24,0.7)] disabled:text-[#5c5a66] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading
                      ? "Depositing..."
                      : `Deposit ${amount > 0 ? `${numberFormatter(amount)}` : ""} ${tokenSymbol}`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    disabled={amount === 0 || loading}
                    onClick={handleWithdraw}
                    className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-[0.15em] transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 border-2 border-rose-500/40 text-rose-400 hover:bg-rose-500/10 flex items-center justify-center gap-2"
                  >
                    {loading
                      ? "Withdrawing..."
                      : `Withdraw ${amount > 0 ? `${numberFormatter(amount)}` : ""} ${tokenSymbol}`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Position Card (shown when user has LP) */}
              {lpShares !== null && lpShares > 0 && (
                <div className="bg-[rgba(17,17,24,0.7)] border border-[rgba(52,211,153,0.2)] rounded-[14px] p-[18px] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-[0.78rem] text-[#34d399] tracking-[0.05em]">
                      Your Position
                    </span>

                    <span className="text-[0.72rem] px-2.5 py-1 rounded-md bg-[rgba(52,211,153,0.12)] text-[#34d399] font-mono font-bold">
                      +{((sharePrice - 1.0) * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Deposited */}
                    <div>
                      <div className="font-mono text-[0.5rem] tracking-[0.08em] uppercase text-[#5c5a66] mb-1">
                        Deposited
                      </div>
                      <div className="font-serif font-bold text-[0.95rem] text-[#e8e6ee]">
                        ${numberFormatter(lpShares * 1.0)}
                      </div>
                    </div>

                    {/* Value Now */}
                    <div>
                      <div className="font-mono text-[0.5rem] tracking-[0.08em] uppercase text-[#5c5a66] mb-1">
                        Value Now
                      </div>
                      <div className="font-serif font-bold text-[0.95rem] text-[#e8e6ee]">
                        ${numberFormatter(lpShares * sharePrice)}
                      </div>
                    </div>

                    {/* Pool Share */}
                    <div>
                      <div className="font-mono text-[0.5rem] tracking-[0.08em] uppercase text-[#5c5a66] mb-1">
                        Pool Share
                      </div>
                      <div className="font-serif font-bold text-[0.95rem] text-[#e8e6ee]">
                        {tvl > 0
                          ? (((lpShares * sharePrice) / tvl) * 100).toFixed(3)
                          : "0.000"}
                        %
                      </div>
                    </div>

                    {/* Cooldown */}
                    <div>
                      <div className="font-mono text-[0.5rem] tracking-[0.08em] uppercase text-[#5c5a66] mb-1">
                        Cooldown
                      </div>
                      {(() => {
                        const holdSeconds = (marketDetails?.params?.minHoldPeriodMinutes ?? 0) * 60;
                        if (!lastDepositTime || holdSeconds === 0) {
                          return <div className="font-serif font-bold text-[0.95rem] text-[#34d399]">Met</div>;
                        }
                        const nowSec = Math.floor(Date.now() / 1000);
                        const unlockTime = lastDepositTime + holdSeconds;
                        const remaining = unlockTime - nowSec;
                        if (remaining <= 0) {
                          return <div className="font-serif font-bold text-[0.95rem] text-[#34d399]">Met</div>;
                        }
                        const mins = Math.ceil(remaining / 60);
                        return (
                          <div className="font-serif font-bold text-[0.95rem] text-amber-400">
                            {mins}m left
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </FullModal>
  );
};

function PreviewRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-[11px] border-b border-[rgba(30,30,42,0.5)] last:border-b-0">
      <span className="text-[0.8rem] text-[#9896a3]">{label}</span>
      <span
        className={`font-mono font-bold text-[0.8rem] ${highlight ? "text-[#34d399]" : "text-[#e8e6ee]"}`}
      >
        {value}
      </span>
    </div>
  );
}
