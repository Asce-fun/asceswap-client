"use client";

import React, { useState, useEffect } from "react";
import { Info, Wallet, ArrowRight, AlertTriangle } from "lucide-react";
import { FormattedMarket, MarketData } from "../interface/types";
import { MARKET_META } from "../constants/markets";
import { FullModal } from "./FullModal";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getTokenBalance } from "../blockchain/scripts/tokenBalance";
import { getLpPosition } from "../blockchain/scripts/markets";
import { approveAndSupplyLp } from "../blockchain/scripts/write/approveAndSupplyLp";
import { withdrawLpLiquidity } from "../blockchain/scripts/write/withdrawLiquidity";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";

interface LpModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: MarketData;
  marketDetails: FormattedMarket | null;
}

type ActionTab = "deposit" | "withdraw";
type InfoTab = "fees" | "how" | "risks";

export const LpModal: React.FC<LpModalProps> = ({
  isOpen,
  onClose,
  market,
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

  const [actionTab, setActionTab] = useState<ActionTab>("deposit");
  const [infoTab, setInfoTab] = useState<InfoTab>("fees");
  const [amount, setAmount] = useState(0);
  const [amountStr, setAmountStr] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lpShares, setLpShares] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Market data
  const tvl = marketDetails?.pool?.totalCollateral ?? 0;
  const lockedTotal = marketDetails
    ? marketDetails.pool.lockedFixed + marketDetails.pool.lockedFloating
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

  // Mock PnL APY
  const pnlApy = 0.018;
  const totalApy = feeApy + pnlApy;

  // Mock share price
  const sharePrice = 1.016;

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
    if (!address || !isOpen) return;
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
          setLpShares(Number(res.shares) / 10 ** 6);
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
        shareDecimals: 6,
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
            <div className="flex items-center gap-1">
              {tokens.map((token) => {
                const Logo = TOKEN_LOGOS[token];
                return <Logo key={token} size={40} />;
              })}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                {market.name} — Liquidity Pool
              </h2>
              <p className="text-[11px] text-[#8A8894]">
                {meta?.oracleSource} · {meta?.termLabel} Term
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

        {/* ========== APY STRIP ========== */}
        <div className="px-6 py-4 border-b border-white/[0.04] flex flex-wrap items-center justify-between gap-4 shrink-0 bg-[#0d0d10]">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-semibold text-[#8A8894] uppercase tracking-wider">
                Estimated APY
              </span>
              <Info className="w-3 h-3 text-[#5C5A66] cursor-help" />
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-3xl font-bold text-trade-up tracking-tighter">
                {(totalApy * 100).toFixed(1)}%
              </span>
              <span className="text-[11px] text-[#8A8894]">
                Fees +{(feeApy * 100).toFixed(1)}% · PnL +
                {(pnlApy * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold text-[#8A8894] uppercase tracking-wider mb-1">
              Share Price
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {sharePrice.toFixed(4)}{" "}
              <span className="text-[#8A8894] text-xs">USDC</span>
            </div>
            <div className="text-[10px] text-trade-up">
              +1.6% since inception
            </div>
          </div>
        </div>

        {/* ========== TWO-COLUMN BODY ========== */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 min-[960px]:grid-cols-[1fr_360px]">
          {/* ===== LEFT COLUMN ===== */}
          <div className="overflow-y-auto p-6 space-y-5 border-r border-white/[0.04]">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total TVL", value: `$${numberFormatter(tvl)}` },
                {
                  label: "Available",
                  value: `$${numberFormatter(available > 0 ? available : 0)}`,
                },
                { label: "Utilization", value: `${utilization.toFixed(1)}%` },
                { label: "Active Swaps", value: String(activeSwaps) },
              ].map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="text-[9px] font-semibold text-[#5C5A66] uppercase tracking-wider mb-1">
                    {s.label}
                  </div>
                  <div className="text-sm font-mono font-bold text-white">
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Exposure Breakdown */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  Exposure Breakdown
                </span>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    isNetShort
                      ? "bg-[#1FD6A3]/10 text-[#1FD6A3] border-[#1FD6A3]/30"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  }`}
                >
                  {isNetShort ? "Net Short Rates" : "Net Long Rates"}
                </span>
              </div>

              {/* Stacked bar */}
              <div className="h-3 rounded-full overflow-hidden flex bg-white/[0.05]">
                <div
                  className="bg-[#1FD6A3]/80 transition-all duration-500"
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
                  <span className="w-2 h-2 rounded-full bg-[#1FD6A3]" />
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

              <p className="text-[10px] text-white/30 leading-relaxed">
                The pool takes the opposite side of every swap. When more
                traders are fixed, the pool is net short rates (profits when
                rates fall).
              </p>
            </div>

            {/* Info Tabs */}
            <div>
              <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-white/[0.02] border border-white/[0.04] w-fit">
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
                      className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
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

              {infoTab === "how" && (
                <div className="space-y-3 text-[12px] text-[#8A8894] leading-relaxed">
                  <p>
                    <span className="text-white font-semibold">
                      Share-based accounting.
                    </span>{" "}
                    When you deposit USDC, you receive LP shares proportional to
                    your contribution. The share price increases as the pool
                    earns swap fees and trader losses.
                  </p>
                  <p>
                    <span className="text-white font-semibold">
                      Counterparty role.
                    </span>{" "}
                    As an LP, you take the opposite side of every swap. You earn
                    80% of all swap entry fees plus the net PnL from trader
                    positions. When traders lose, LPs gain — and vice versa.
                  </p>
                  <p>
                    <span className="text-white font-semibold">
                      Withdrawals.
                    </span>{" "}
                    You can redeem shares for the underlying USDC at the current
                    share price, subject to available liquidity and cooldown
                    requirements.
                  </p>
                </div>
              )}

              {infoTab === "risks" && (
                <div className="space-y-3 text-[12px] text-[#8A8894] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                    <p>
                      <span className="text-white font-semibold">
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
                      <span className="text-white font-semibold">
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
                      <span className="text-white font-semibold">
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
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="flex flex-col overflow-y-auto bg-gradient-to-b from-[#0f0f14] to-transparent">
            <div className="p-5 space-y-4 flex-1">
              {/* Action Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <button
                  onClick={() => setActionTab("deposit")}
                  className={`py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider 
              transition-all cursor-pointer ${
                actionTab === "deposit"
                  ? "bg-[#1FD6A3] text-black shadow-[0_0_20px_-5px_rgba(31,214,163,0.6)]"
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
                      : "text-[#8A8894] hover:text-[#BAB8C4]"
                  }`}
                >
                  Withdraw
                </button>
              </div>

              {/* Input Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#8A8894] uppercase tracking-wider">
                    {actionTab === "deposit"
                      ? "Deposit Amount"
                      : "Withdraw Amount"}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#8A8894]">
                    <Wallet className="w-3 h-3" />
                    {actionTab === "deposit"
                      ? `${numberFormatter(walletBalance ?? 0)} USDC`
                      : `${numberFormatter(lpShares ?? 0)} Shares`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-bold text-[#8A8894]">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="bg-transparent border-none outline-none text-3xl font-mono font-bold text-white tracking-tighter w-full focus:ring-0 placeholder:opacity-20"
                  />
                  <span className="px-2 py-1 rounded-md bg-[#2775ca]/10 text-[10px] font-bold text-[#2775ca] uppercase shrink-0">
                    USDC
                  </span>
                </div>

                {/* Preset Buttons */}
                {actionTab === "deposit" ? (
                  <input
                    type="range"
                    min={0}
                    max={maxAmount}
                    step={maxAmount > 100 ? maxAmount / 100 : 0.01}
                    value={Math.min(amount, maxAmount)}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 
             bg-white/10 
             rounded-full 
             appearance-none 
             cursor-pointer 
             accent-[#1FD6A3]"
                  />
                ) : (
                  <input
                    type="range"
                    min={0}
                    max={maxLpshares}
                    step={maxLpshares > 100 ? maxLpshares / 100 : 0.01}
                    value={Math.min(amount, maxLpshares)}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 
             bg-white/10 
             rounded-full 
             appearance-none 
             cursor-pointer 
             accent-[#1FD6A3]"
                  />
                )}
                <div className="flex justify-between text-[9px] font-mono text-[#5C5A66]">
                  {actionTab === "deposit" ? (
                    <div className="flex flex-col">
                      <span>Min: ${numberFormatter(minNotional)}</span>
                      <span>max :${numberFormatter(maxNotional)}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col"></div>
                  )}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full 
                bg-[#1FD6A3]/10 
                border border-[#1FD6A3]/20 
                text-[10px] font-semibold 
                text-[#1FD6A3] 
                uppercase tracking-widest 
                transition-colors 
                hover:bg-[#1FD6A3]/20 
                cursor-default"
                  >
                    <Wallet className="w-3 h-3 text-[#1FD6A3]" />
                    Wallet: $
                    {numberFormatter(walletBalance ? walletBalance : 0)}
                  </div>
                </div>

                {/* Preset Buttons */}
                <div className="flex gap-2 mt-2">
                  {[25, 50, 75, 100].map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        if (actionTab === "deposit") {
                          if (walletBalance !== null) {
                            const value = (walletBalance * p) / 100;
                            setAmount(Number(value.toFixed(2)));
                          }
                        } else {
                          if (lpShares !== null) {
                            const value = (lpShares * p) / 100;
                            setAmount(Number(value.toFixed(2)));
                          }
                        }
                      }}
                      className="px-2 cursor-pointer py-1 text-[9px] font-black rounded-md bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400"
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                {actionTab === "deposit" ? (
                  <>
                    <PreviewRow
                      label="You'll Receive"
                      value={`${sharesReceived.toFixed(2)} Shares`}
                    />
                    <PreviewRow
                      label="Exchange Rate"
                      value={`1 Share = ${sharePrice.toFixed(4)} USDC`}
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

              {/* Position Card (shown when user has LP) */}
              {lpShares !== null && lpShares > 0 && (
                <div
                  className="p-4 rounded-xl 
                bg-[#1FD6A3]/5 
                border border-[#1FD6A3]/20 
                space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#1FD6A3] uppercase tracking-wider">
                      Your Position
                    </span>

                    <span
                      className="text-[10px] font-mono font-semibold 
                     text-[#1FD6A3] 
                     px-2 py-0.5 
                     rounded-full 
                     bg-[#1FD6A3]/15 
                     border border-[#1FD6A3]/30"
                    >
                      +1.6%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Deposited */}
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">
                        Deposited
                      </div>
                      <div className="text-xs font-mono font-semibold text-white/70">
                        ${numberFormatter(lpShares * 1.0)}
                      </div>
                    </div>

                    {/* Value Now */}
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">
                        Value Now
                      </div>
                      <div className="text-xs font-mono font-semibold text-white">
                        ${numberFormatter(lpShares * sharePrice)}
                      </div>
                    </div>

                    {/* Pool Share */}
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">
                        Pool Share
                      </div>
                      <div className="text-xs font-mono font-semibold text-white/80">
                        {tvl > 0
                          ? (((lpShares * sharePrice) / tvl) * 100).toFixed(3)
                          : "0.000"}
                        %
                      </div>
                    </div>

                    {/* Cooldown */}
                    <div>
                      <div className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">
                        Cooldown
                      </div>
                      <div className="text-xs font-semibold text-[#1FD6A3]">
                        Met
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error / Success */}
              {error && (
                <div className="text-red-400 text-xs p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  {error}
                </div>
              )}
              {txHash && (
                <div className="text-trade-up text-xs p-3 rounded-lg bg-trade-up/5 border border-trade-up/10 break-all">
                  Transaction submitted: {txHash}
                </div>
              )}
            </div>

            {/* CTA Button */}
            <div className="p-5 pt-0">
              {actionTab === "deposit" ? (
                <button
                  disabled={amount === 0 || loading}
                  onClick={handleDeposit}
                  className="w-full py-4 rounded-xl font-semibold text-xs uppercase tracking-[0.15em]
               transition-all active:scale-[0.98] cursor-pointer
               disabled:cursor-not-allowed disabled:opacity-40
               bg-[#1FD6A3] hover:bg-[#19c495]
               text-black
               shadow-lg shadow-[#1FD6A3]/20 hover:shadow-[#1FD6A3]/40
               flex items-center justify-center gap-2"
                >
                  {loading
                    ? "Depositing..."
                    : `Deposit ${amount > 0 ? `$${numberFormatter(amount)}` : ""} USDC`}
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
                    : `Withdraw ${amount > 0 ? `$${numberFormatter(amount)}` : ""} USDC`}
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
    <div className="flex items-center justify-between py-1">
      <span className="text-[11px] text-[#8A8894]">{label}</span>
      <span
        className={`text-[11px] font-mono font-semibold ${highlight ? "text-trade-up" : "text-[#BAB8C4]"}`}
      >
        {value}
      </span>
    </div>
  );
}
