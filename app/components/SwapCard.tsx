import React, { useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Info, Clock, Wallet } from "lucide-react";
import { Duration, MarketData, SwapDirection } from "../interface/types";
import { Dialog } from "./Dialog";
import { SwapDialogContent } from "./SwapDialogContent";
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";
import { PROTOCOL_LOGOS } from "../lib/helpers/dappLogos";
import { LiquidityDialogContent } from "./LiquidityDialogContent";

interface SwapCardProps {
  market: MarketData;
}

export const SwapCard: React.FC<SwapCardProps> = ({ market }) => {
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showLiquidityDialog, setShowLiquidityDialog] = useState(false);
  const [activeDirection, setActiveDirection] =
    useState<SwapDirection>("FLOATING");
  const [timeLeft, setTimeLeft] = useState("");
  const ProtocolIcon = PROTOCOL_LOGOS[market?.protocol];
  const tokens = extractTokensFromName(market.name);

  /* ---------------- Countdown ---------------- */
  useEffect(() => {
    const updateCountdown = () => {
      const diff = market.maturityTimestamp - Date.now();

      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      parts.push(
        `${hours.toString().padStart(2, "0")}h`,
        `${mins.toString().padStart(2, "0")}m`,
        `${secs.toString().padStart(2, "0")}s`,
      );

      setTimeLeft(parts.join(" "));
    };

    updateCountdown();
    const i = setInterval(updateCountdown, 1000);
    return () => clearInterval(i);
  }, [market.maturityTimestamp]);

  /* ---------------- Pricing ---------------- */
  const impliedFixedRate = useMemo(() => {
    const termPremium =
      market.fixedDuration === Duration.D1
        ? 0.2
        : market.fixedDuration === Duration.D7
          ? 0.8
          : 1.6;

    return market.oracleRate - termPremium;
  }, [market.oracleRate, market.fixedDuration]);

  const handleOpenSwap = (direction: SwapDirection) => {
    setActiveDirection(direction);
    setShowSwapDialog(true);
  };

  return (
    <>
      <div className="relative group transition-all duration-500 h-full">
        <div className="absolute -inset-0.5 bg-linear-to-br from-blue-500/20 to-purple-500/20 rounded-[2rem] blur opacity-0 group-hover:opacity-100 transition duration-500" />

        <div className="relative bg-[#11141d] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col shadow-2xl h-full">
          {/* ================= HEADER ================= */}
          <div className="p-6 pb-3">
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-start gap-3">
                {/* Protocol icon */}
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  <ProtocolIcon size={20} />
                </div>

                {/* -------- Title + tokens -------- */}
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-slate-100 tracking-tight leading-none">
                    {market.protocol}
                  </h3>

                  {/* Tokens + Market Name */}
                  <div className="flex gap-1.5 items-center">
                    {/* Token logos */}
                    <div className="flex items-center gap-1">
                      {tokens.map((token) => {
                        const Logo = TOKEN_LOGOS[token];
                        return <Logo key={token} size={16} />;
                      })}
                    </div>

                    {/* Market name */}
                    <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">
                      {market.name}
                    </p>
                  </div>
                </div>
              </div>

              <Info className="w-4 h-4 text-slate-500 mt-1" />
            </div>

            {/* ================= RATE ================= */}
            <div className="text-center py-8">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">
                Current Fixed Rate
              </div>

              <div className="text-6xl font-mono font-bold text-white mb-2 tracking-tighter">
                {impliedFixedRate.toFixed(2)}%
              </div>

              <div className="text-xs text-slate-400 font-medium">
                Spot APR: {market.oracleRate.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* ================= TERM BAR ================= */}
          <div className="px-6 py-4 border-y border-white/5 bg-black/40 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">
                Market Term
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {market.fixedDuration}
              </span>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-0.5">
                Settlement Deadline
              </span>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-blue-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-blue-400">
                  {timeLeft}
                </span>
              </div>
            </div>
          </div>

          {/* ================= ACTIONS ================= */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleOpenSwap("FLOATING")}
                className="bg-[#1de9b6] cursor-pointer hover:bg-[#14cbad] text-black p-5 rounded-[1.5rem] shadow-xl shadow-[#1de9b6]/10 active:scale-95 transition-all group/btn"
              >
                <TrendingUp className="w-5 h-5 mx-auto mb-2 group-hover/btn:scale-110 transition-transform" />
                <div className="text-xs font-black uppercase tracking-tighter">
                  Receive Floating
                </div>
                <div className="text-[9px] text-black/50 mt-1 font-bold">
                  BULLISH YIELD
                </div>
              </button>

              <button
                onClick={() => handleOpenSwap("FIXED")}
                className="bg-[#00e5ff] cursor-pointer hover:bg-[#00d1e8] text-black p-5 rounded-[1.5rem] shadow-xl shadow-[#00e5ff]/10 active:scale-95 transition-all group/btn"
              >
                <TrendingDown className="w-5 h-5 mx-auto mb-2 group-hover/btn:scale-110 transition-transform" />
                <div className="text-xs font-black uppercase tracking-tighter">
                  Receive Fixed
                </div>
                <div className="text-[9px] text-black/50 mt-1 font-bold">
                  BEARISH YIELD
                </div>
              </button>
            </div>

                        <button 
              onClick={() => setShowLiquidityDialog(true)}
              className="w-full cursor-pointer py-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all hover:border-indigo-500/50"
            >
              <Wallet className="w-4 h-4" />
              Provide Liquidity
            </button>

            <div className="text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">
              Smart Contract Enforced • Atomic Execution
            </div>
          </div>
        </div>
      </div>

      <Dialog isOpen={showSwapDialog} onClose={() => setShowSwapDialog(false)}>
        <SwapDialogContent
          market={market}
          direction={activeDirection}
          duration={market.fixedDuration}
          onClose={() => setShowSwapDialog(false)}
        />
      </Dialog>
            <Dialog isOpen={showLiquidityDialog} onClose={() => setShowLiquidityDialog(false)}>
        <LiquidityDialogContent 
          market={market}
          onClose={() => setShowLiquidityDialog(false)}
        />
      </Dialog>
    </>
  );
};
