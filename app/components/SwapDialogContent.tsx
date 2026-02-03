import React, { useState, useMemo, useEffect } from "react";
import {
  Info,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Activity,
  Zap,
  ShieldCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Wallet,
} from "lucide-react";
import {
  MarketData,
  Duration,
  SwapDirection,
  FormattedMarket,
} from "../interface/types";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getTokenBalance } from "../blockchain/scripts/tokenBalance";
import { approveAndBuySwap } from "../blockchain/scripts/write/approveAndBuySwap";

interface SwapDialogContentProps {
  market: MarketData;
  direction: SwapDirection;
  duration: Duration;
  onClose: () => void;
  marketDetails: FormattedMarket | null;
}

export const SwapDialogContent: React.FC<SwapDialogContentProps> = ({
  market,
  direction,
  duration,
  onClose,
  marketDetails,
}) => {
  const [collateral, setCollateral] = useState(0);
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Capital efficiency multipliers based on duration
  const efficiencyMultiplier = useMemo(() => {
    switch (duration) {
      case Duration.D1:
        return 120;
      case Duration.D7:
        return 45;
      case Duration.D30:
        return 15;
      default:
        return 10;
    }
  }, [duration]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const maxAmount = walletBalance ?? 0;

  const handleAmountChange = (val: string) => {
    // allow digits + single dot
    let clean = val.replace(/[^0-9.]/g, "");

    // prevent multiple decimals
    const parts = clean.split(".");
    if (parts.length > 2) {
      clean = parts[0] + "." + parts.slice(1).join("");
    }

    if (clean === "" || clean === ".") {
      setCollateral(0);
      return;
    }

    const parsed = Number(clean);
    if (Number.isNaN(parsed)) return;

    if (walletBalance === null) {
      setCollateral(parsed);
      return;
    }

    setCollateral(Math.min(parsed, walletBalance));
  };
  // Financial calculations
  const notional =
    (collateral *
      (marketDetails?.params.initialMarginMultiplierPct
        ? marketDetails?.params.initialMarginMultiplierPct
        : 0)) /
    100;
  const termPremium =
    duration === Duration.D1 ? 0.08 : duration === Duration.D7 ? 0.22 : 0.55;
  const effectiveRate = market.oracleRate - termPremium;

  // Specific requested fields
  const spreadValue = (termPremium * 100).toFixed(0) + " bps";
  const dailyEarnings = (notional * (effectiveRate / 100)) / 365;

  const expirationDate = useMemo(() => {
    const date = new Date();
    const days =
      duration === Duration.D1 ? 1 : duration === Duration.D7 ? 7 : 30;
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [duration]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  const [loadingBalance, setLoadingBalance] = useState(false);
  useEffect(() => {
    if (!address) {
      setWalletBalance(null);
      return;
    }

    let cancelled = false;

    async function fetchBalance() {
      try {
        setLoadingBalance(true);

        const res = await getTokenBalance(
          marketDetails?.collateralToken as string, // 👈 token for this market
          address as string,
        );

        if (!cancelled) {
          setWalletBalance(res.formatted);
        }
      } catch (err) {
        console.error("Failed to fetch balance", err);
        if (!cancelled) {
          setWalletBalance(null);
        }
      } finally {
        if (!cancelled) setLoadingBalance(false);
      }
    }

    fetchBalance();

    return () => {
      cancelled = true;
    };
  }, [address, marketDetails?.collateralToken]);

  const handleBuy = async () => {
    try {
      setLoading(true);
      const txHash = await approveAndBuySwap({
        tokenAddress: marketDetails?.collateralToken!,
        asceSwapAddress: process.env.NEXT_PUBLIC_ASCESWAP_ADDRESS!,
        oracleAddress: process.env.NEXT_PUBLIC_ORACLE_ADDRESS!,
        pairId: String(marketDetails?.pairId), // MUST be string
        side: direction,
        notional: notional,
        collateral: collateral,
        maxRateBps: 900, // 9%
        decimals: 6,
      });

      setTxHash(txHash);
    } catch (e: any) {
      console.log(e, "supply error");
      setError(e.message ?? "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-[#0d1017] text-slate-200">
      {/* Header Section */}
      <div
        className={`p-8 pb-10 border-b border-white/5 bg-linear-to-br transition-all duration-1000 ${
          direction === "FLOATING"
            ? "from-emerald-500/10 via-transparent to-transparent"
            : "from-cyan-500/10 via-transparent to-transparent"
        }`}
      >
        <div className="flex justify-between items-start pr-12">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div
                className={`w-1.5 h-8 rounded-full ${direction === "FLOATING" ? "bg-[#1de9b6]" : "bg-[#00e5ff]"} shadow-[0_0_15px_rgba(29,233,182,0.4)]`}
              />
              <h2 className="text-3xl font-black tracking-tighter text-white leading-none">
                Configure Swap
              </h2>
            </div>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] ml-4">
              {market.protocol} <span className="mx-2 opacity-20">•</span>{" "}
              {market.name}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-10">
          <div className="space-y-1 group">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              Spot APR <Info className="w-2.5 h-2.5 opacity-50" />
            </div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {marketDetails?.rate.currentPct.toFixed(2)}%
            </div>
          </div>
          <div className="space-y-1 group">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              Term <Calendar className="w-2.5 h-2.5 opacity-50" />
            </div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {marketDetails?.params.swapTermDays}Days
            </div>
          </div>
          <div className="space-y-1 group">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              Fixed Rate <BarChart3 className="w-2.5 h-2.5 opacity-50" />
            </div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {effectiveRate.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Collateral & Exposure Slider */}
        <div className="bg-white/2 p-8 rounded-[2.5rem] border border-white/5 space-y-8 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Zap className="w-32 h-32 text-blue-500" />
          </div>

          <div className="flex justify-between items-end relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">
                Collateral Amount
              </label>
              <div className="text-5xl font-mono font-bold text-white tracking-tighter flex items-baseline gap-1">
                <span className="text-2xl text-slate-500">$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={collateral === 0 ? "" : collateral}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="bg-transparent border-none outline-none text-5xl font-mono font-bold text-white tracking-tighter w-full focus:ring-0 placeholder:opacity-20"
                />
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                <Zap className="w-3 h-3 fill-current animate-pulse" />
                {marketDetails?.params.initialMarginMultiplierPct}% Leverage
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono text-slate-500 font-bold uppercase tracking-tighter">
                  Notional:{" "}
                  <span className="text-slate-300">
                    ${numberFormatter(notional)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative pt-2">
            <input
              type="range"
              min={0}
              max={maxAmount}
              step={maxAmount > 100 ? maxAmount / 100 : 0.01}
              value={Math.min(collateral, maxAmount)}
              onChange={(e) => setCollateral(Number(e.target.value))}
              className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
            <div className="flex justify-between mt-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
              <span></span>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest transition-colors hover:bg-indigo-500/20 cursor-default">
                <Wallet className="w-3 h-3" />
                Wallet: ${numberFormatter(walletBalance)}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    if (walletBalance !== null) {
                      const value = (walletBalance * p) / 100;
                      setCollateral(Number(value.toFixed(2)));
                    }
                  }}
                  className="px-2 cursor-pointer py-1 text-[9px] font-black rounded-md bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400"
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Market Data Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-black/40 border border-white/5 rounded-3xl space-y-5 hover:border-white/10 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-blue-500/50 group-hover:bg-blue-500 transition-colors" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Spread Value
                </span>
              </div>
              <span className="text-sm font-mono text-slate-200 font-bold">
                {spreadValue}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1 h-3 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Est. Daily Earnings
                </span>
              </div>
              <span className="text-sm font-mono text-[#1de9b6] font-black">
                +{formatCurrency(dailyEarnings)}
              </span>
            </div>
          </div>

          <div className="p-6 bg-white/3 border border-white/5 rounded-3xl flex flex-col justify-between hover:bg-white/5 transition-all relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity className="w-20 h-20 text-blue-500" />
            </div>
            <div className="flex justify-between items-center relative z-10">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Settlement
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-4 relative z-10">
              <div className="text-[9px] font-black text-slate-500 uppercase mb-1">
                Contract Expiry
              </div>
              <div className="text-sm font-mono font-black text-white">
                {expirationDate}
              </div>
            </div>
          </div>
        </div>

        {/* Safety Note */}
        <div className="p-5 bg-blue-500/4 border border-blue-500/10 rounded-2xl flex gap-4 items-start">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-100 uppercase tracking-tighter">
              Verified Protocol Implementation
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              Your collateral is held in a secure vault on Starknet. Swaps are
              executed via atomic multisig with real-time interest distribution.
            </p>
          </div>
        </div>
        {error && <div className="text-red-400 text-xs">{error}</div>}
        {txHash && (
          <div className="text-green-400 text-xs break-all">
            Success
            <br />
            {txHash}
          </div>
        )}
        {/* Action Footer */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] text-slate-500 hover:text-white hover:bg-white/5 transition-all border border-white/5 active:scale-95"
          >
            Cancel
          </button>
          <button
            className={`flex-1 cursor-pointer py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px]
  shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 group/btn
  disabled:cursor-not-allowed
  disabled:opacity-50
  disabled:bg-gray-400
  disabled:text-gray-700
  disabled:shadow-none
  ${
    direction === "FLOATING"
      ? "bg-[#1de9b6] hover:bg-[#20ffd4] text-black shadow-[#1de9b6]/30"
      : "bg-[#00e5ff] hover:bg-[#00f3ff] text-black shadow-[#00e5ff]/30"
  }`}
            disabled={collateral === 0 || loading}
            onClick={handleBuy}
          >
            {loading ? "Executing..." : "Execute Swap"}
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
