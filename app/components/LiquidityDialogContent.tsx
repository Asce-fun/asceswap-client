import React, { useState, useMemo, useEffect } from "react";
import {
  Info,
  Wallet,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Activity,
  Percent,
  Scale,
  Coins,
  BarChart3,
} from "lucide-react";
import { MarketData } from "../interface/types";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getTokenBalance } from "../blockchain/scripts/tokenBalance";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { PROTOCOL_LOGOS } from "../lib/helpers/dappLogos";

interface LiquidityDialogContentProps {
  market: MarketData;
  onClose: () => void;
}

export const LiquidityDialogContent: React.FC<LiquidityDialogContentProps> = ({
  market,
  onClose,
}) => {
  const [amount, setAmount] = useState(0);
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [balanceSymbol, setBalanceSymbol] = useState<string>("");
  const [loadingBalance, setLoadingBalance] = useState(false);
    const ProtocolIcon = PROTOCOL_LOGOS[market?.protocol];
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
          "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D", // 👈 token for this market
          address as string,
        );

        if (!cancelled) {
          setWalletBalance(res.formatted);
          setBalanceSymbol(res.symbol);
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
  }, [address]);

  const maxAmount = walletBalance ?? 0;

  // Constants for the protocol mechanics
  const TOTAL_FEE_PERCENT = 2.0; // 2% total fee from swaps
  const LP_FEE_SHARE = 0.8; // 80% goes to LPs

  // The yield is shown as a "Target" or "Variable" based on protocol performance
  const displayYield = market.oracleRate;

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

    setAmount(Math.min(parsed, walletBalance));
  };

  const percentUsed = useMemo(() => {
    if (!walletBalance || walletBalance === 0) return 0;
    return Math.min(100, (amount / walletBalance) * 100);
  }, [amount, walletBalance]);

  return (
    <div className="flex flex-col bg-[#0d1017] text-slate-200">
      {/* Header Section */}
      <div className="p-8 pb-10 border-b border-white/5 bg-linear-to-br from-indigo-500/10 via-transparent to-transparent">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 rounded-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
            <h2 className="text-3xl font-black tracking-tighter text-white leading-none">
              Liquidity Engine
            </h2>
          </div>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.25em] ml-4 flex items-center gap-1 flex-wrap">
            COUNTERPARTY POOL <span className="mx-2 opacity-20">•</span>{" "}
            <ProtocolIcon size={14} />
            {market.protocol} {market.name}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-8 mt-10">
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              POOL TVL <Info className="w-2.5 h-2.5 opacity-50" />
            </div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              $4.2M
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              FEE TIER <Activity className="w-2.5 h-2.5 opacity-50" />
            </div>
            <div className="text-2xl font-mono font-bold text-white leading-none">
              {TOTAL_FEE_PERCENT}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              BASE APY <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-400 leading-none">
              {displayYield.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* Deposit Input & Slider */}
        <div className="bg-white/2 p-8 rounded-[2.5rem] border border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Scale className="w-32 h-32 text-indigo-500" />
          </div>

          <div className="flex justify-between items-end relative z-10">
            <div className="space-y-2 flex-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block">
                Supply Collateral
              </label>
              <div className="flex items-center gap-1 group">
                <span className="text-2xl text-slate-500 font-mono font-bold">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount === 0 ? "" : amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0"
                  className="bg-transparent border-none outline-none text-5xl font-mono font-bold text-white tracking-tighter w-full focus:ring-0 placeholder:opacity-20"
                />
              </div>
            </div>
            <div className="text-right pb-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-400 uppercase tracking-widest transition-colors hover:bg-indigo-500/20 cursor-default">
                <Wallet className="w-3 h-3" />
                Wallet: ${numberFormatter(walletBalance)}
              </div>
            </div>
          </div>

          <div className="relative pt-2">
            <input
              type="range"
              min={0}
              max={maxAmount}
              step={maxAmount > 100 ? maxAmount / 100 : 0.01}
              value={Math.min(amount, maxAmount)}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">
            <span>0%</span>
            <span className="text-indigo-400">{percentUsed.toFixed(1)}%</span>
            <span>100%</span>
          </div>

          <div className="flex gap-2 mt-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                onClick={() => {
                  if (walletBalance !== null) {
                    const value = (walletBalance * p) / 100;
                    setAmount(Number(value.toFixed(2)));
                  }
                }}
                className="px-2 cursor-pointer py-1 text-[9px] font-black rounded-md bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400"
              >
                {p}%
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Rewards Card */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-indigo-500/3 border border-indigo-500/10 rounded-3xl space-y-4 group">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Fee Structure
              </span>
              <Coins className="w-3 h-3 text-indigo-500" />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                80 / 20
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-widest">
                LP Share / Protocol Share
              </p>
            </div>
          </div>

          <div className="p-6 bg-white/3 border border-white/5 rounded-3xl space-y-4 hover:bg-white/5 transition-all group">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Earnings Model
              </span>
              <BarChart3 className="w-3 h-3 text-emerald-500" />
            </div>
            <div>
              <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                Variable
              </div>
              <p className="text-[9px] text-emerald-500/60 font-bold uppercase mt-1 tracking-widest">
                Real-time Trade Accrual
              </p>
            </div>
          </div>
        </div>

        {/* Risk Disclaimer Box */}
        <div className="p-5 bg-orange-500/4 border border-orange-500/10 rounded-2xl flex gap-4 items-start">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
            <Scale className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-100 uppercase tracking-tighter">
              Collective Risk Absorption
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              As an LP, you act as the global counterparty. You earn{" "}
              {LP_FEE_SHARE * 100}% of all swap fees and absorb trader PnL
              collectively. You gain when traders lose and lose when traders
              win.
            </p>
          </div>
        </div>

        {/* Benefits Box */}
        <div className="p-5 bg-indigo-500/4 border border-indigo-500/10 rounded-2xl flex gap-4 items-start">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-100 uppercase tracking-tighter">
              Market Maker Rewards
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
              In addition to trading fees, you earn the underlying protocol
              yield from the supplied collateral. All rewards are distributed
              pro-rata based on your share of the pool.
            </p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="flex gap-4 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] text-slate-500 hover:text-white hover:bg-white/5 transition-all border border-white/5"
          >
            Cancel
          </button>
          <button className="flex-1 py-5 rounded-2xl font-black uppercase tracking-[0.25em] text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-3 group/btn">
            Confirm Deposit
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
