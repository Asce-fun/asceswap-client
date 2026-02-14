import React, { useState, useMemo, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  FormattedMarket,
  MarketData,
  ProtocolSymbol,
  SwapDirection,
} from "../interface/types";
import { SwapModal } from "./SwapModal";
import { PROTOCOL_LOGOS } from "../lib/helpers/dappLogos";
import { DefaultProtocolLogo } from "../lib/helpers/DefaultProtocolLogo";
import { getMarket } from "../blockchain/scripts/markets";
import { MARKET_META } from "../constants/markets";

interface SwapCardProps {
  market: MarketData;
}

export function getProtocolLogo(
  protocol: ProtocolSymbol | string,
): React.FC<{ size?: number }> {
  return PROTOCOL_LOGOS[protocol as ProtocolSymbol] ?? DefaultProtocolLogo;
}

export const SwapCard: React.FC<SwapCardProps> = ({ market }) => {
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [activeDirection, setActiveDirection] =
    useState<SwapDirection>("FLOATING");
  const [marketDetails, setMarketDetails] = useState<FormattedMarket | null>(
    null,
  );

  const meta = MARKET_META?.[market.id];
  const collateralSymbol = meta?.collateralSymbol ?? "USDC";

  useEffect(() => {
    const fetchData = async () => {
      const res = await getMarket(market.id);
      if (res) setMarketDetails(res as any);
    };
    fetchData();
  }, []);

  const handleOpenSwap = (direction: SwapDirection) => {
    setActiveDirection(direction);
    setShowSwapDialog(true);
  };

  const currentRate = marketDetails?.rate?.currentPct ?? 0;
  const termDays = marketDetails?.params?.swapTermDays ?? "--";

  const dayChange = useMemo(() => {
    const seed = Number(market.id) * 0.17;
    return parseFloat(((seed % 0.8) - 0.3).toFixed(2));
  }, [market.id]);

  return (
    <>
      <div className="relative h-full group/card transition-all duration-400 hover:-translate-y-1">
        {/* Glow effect */}
        <div className="absolute -inset-px rounded-2xl bg-[#a78bfa]/0 group-hover/card:bg-[#a78bfa]/[0.03] transition-all duration-500 pointer-events-none blur-xl" />
        {/* Gradient border on hover */}
        <div
          className="absolute inset-0 rounded-2xl p-px bg-linear-to-br from-transparent via-transparent to-[#c4b5fd] opacity-0 group-hover/card:opacity-100 transition-opacity duration-400 pointer-events-none"
          style={{
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          }}
        />
        <div className="relative bg-[#111114] border border-[rgba(180,175,200,0.06)] rounded-2xl overflow-hidden flex flex-col h-full group-hover/card:border-[rgba(180,175,200,0.12)] group-hover/card:shadow-[0_8px_32px_rgba(167,139,250,0.22),0_0_0_1px_rgba(167,139,250,0.22)] transition-all duration-400">
          {/* Top accent line */}
          <div className="h-[2px] w-full bg-linear-to-r from-[#7c3aed] via-[#8b5cf6] to-[#7c3aed] opacity-50 group-hover/card:opacity-90 transition-opacity duration-400" />

          {/* ── HEADER ── */}
          <div className="px-5 pt-5 pb-0">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {/* Market icon */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border border-white/[0.06]"
                  style={{
                    backgroundColor: `${meta?.iconColor ?? "#a78bfa"}12`,
                    color: meta?.iconColor ?? "#a78bfa",
                  }}
                >
                  {meta?.letter ?? "?"}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-white tracking-tight leading-none">
                    {market.protocol}
                  </h3>
                  <p className="text-[10px] text-[#8A8894] uppercase font-semibold tracking-[0.1em] mt-1.5">
                    {market.name}
                  </p>
                </div>
              </div>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-md text-[#c4b5fd] border border-[rgba(167,139,250,0.22)] bg-[rgba(167,139,250,0.10)]">
                Live
              </span>
            </div>
          </div>

          {/* ── RATE ── */}
          <div className="px-5 pt-5 pb-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#5C5A66] mb-2">
              Current Rate
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[42px] font-mono font-bold text-white tracking-tighter leading-none">
                {currentRate.toFixed(2)}
              </span>
              <span className="text-lg font-mono font-bold text-[#5C5A66] -ml-1">
                %
              </span>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  dayChange >= 0
                    ? "text-[#34d399] bg-[#34d399]/10"
                    : "text-[#f43f5e] bg-[#f43f5e]/10"
                }`}
              >
                {dayChange >= 0 ? "+" : ""}
                {dayChange.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* ── DURATION + COLLATERAL BLACK STRIP ── */}
          <div className="px-5 py-3 bg-black/40 border-y border-[rgba(180,175,200,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#5C5A66]">
                Duration
              </span>
              <span className="text-xs font-mono font-bold text-[#BAB8C4]">
                {termDays}d
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-[#2775ca]/15 flex items-center justify-center text-[8px] font-bold text-[#2775ca]">
                $
              </span>
              <span className="text-xs font-mono font-bold text-[#BAB8C4]">
                {collateralSymbol}
              </span>
            </div>
          </div>

          {/* ── BUTTONS ── */}
          <div className="px-5 pb-4 pt-1 mt-auto">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpenSwap("FLOATING")}
                className="bg-white cursor-pointer hover:bg-[#c4b5fd] text-[#0A0A0C] py-2.5 rounded-lg active:scale-[0.97] transition-all duration-200 hover:shadow-[0_4px_16px_rgba(167,139,250,0.22)] group/btn"
              >
                <ArrowUp className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover/btn:scale-110 transition-transform" />
                <div className="text-[11px] font-bold tracking-tight">Up</div>
                <div className="text-[8px] text-[#0A0A0C]/35 mt-0.5 font-semibold">
                  rates go up
                </div>
              </button>
              <button
                onClick={() => handleOpenSwap("FIXED")}
                className="bg-white/[0.06] cursor-pointer hover:bg-[rgba(167,139,250,0.10)] text-[#BAB8C4] hover:text-[#c4b5fd] py-2.5 rounded-lg active:scale-[0.97] transition-all duration-200 border border-[rgba(180,175,200,0.06)] hover:border-[rgba(167,139,250,0.22)] group/btn"
              >
                <ArrowDown className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover/btn:scale-110 transition-transform" />
                <div className="text-[11px] font-bold tracking-tight">
                  Down
                </div>
                <div className="text-[8px] text-[#8A8894] mt-0.5 font-semibold">
                  rates go down
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <SwapModal
        isOpen={showSwapDialog}
        onClose={() => setShowSwapDialog(false)}
        market={market}
        direction={activeDirection}
        marketDetails={marketDetails}
      />
    </>
  );
};
