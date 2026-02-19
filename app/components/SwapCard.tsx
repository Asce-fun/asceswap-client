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
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";
import { getOracleRateHistory } from "../blockchain/scripts/oracleContract";
import { compute24hChange } from "../blockchain/utils/utils";

interface SwapCardProps {
  market: MarketData;
  batchMarketDetails?: FormattedMarket;
}

export function getProtocolLogo(
  protocol: ProtocolSymbol | string,
): React.FC<{ size?: number }> {
  return PROTOCOL_LOGOS[protocol as ProtocolSymbol] ?? DefaultProtocolLogo;
}

export const SwapCard: React.FC<SwapCardProps> = ({ market, batchMarketDetails }) => {
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [activeDirection, setActiveDirection] =
    useState<SwapDirection>("FLOATING");
  const [marketDetails, setMarketDetails] = useState<FormattedMarket | null>(
    null,
  );
  const [dayChange, setDayChange] = useState<number>(0);

  const meta = MARKET_META?.[market.id];
  const collateralSymbol = meta?.collateralSymbol ?? "USDC";

  // Use batch data if provided by parent, otherwise fetch individually
  useEffect(() => {
    if (batchMarketDetails) {
      setMarketDetails(batchMarketDetails);
    }
  }, [batchMarketDetails]);

  useEffect(() => {
    const fetchData = async () => {
      // Skip market fetch if batch data already provided
      const res = batchMarketDetails ?? await getMarket(market.id);
      const history = meta?.oracleAddress
        ? await getOracleRateHistory(meta.oracleAddress, 24).catch(() => [])
        : [];
      if (res) {
        if (!batchMarketDetails) setMarketDetails(res as any);
        const currentBps = (res as any).rate?.currentPct
          ? (res as any).rate.currentPct * 100
          : 0;
        if (history && history.length > 0) {
          setDayChange(
            parseFloat(compute24hChange(history, currentBps).toFixed(2))
          );
        }
      }
    };
    fetchData();
  }, [batchMarketDetails]);

  const handleOpenSwap = (direction: SwapDirection) => {
    setActiveDirection(direction);
    setShowSwapDialog(true);
  };

  const currentRate = marketDetails?.rate?.currentPct ?? 0;
  const termDays = marketDetails?.params?.swapTermDays ?? "--";
  const tokens = extractTokensFromName(market.name);
  const collateralTokens = extractTokensFromName(collateralSymbol);

  return (
    <>
      <div className="relative h-full group/card transition-all duration-400 hover:-translate-y-1">
        
        {/* Mint Glow */}
        <div className="absolute -inset-px rounded-2xl bg-[#6ee7b7]/0 group-hover/card:bg-[#6ee7b7]/[0.04] transition-all duration-500 pointer-events-none blur-xl" />

        {/* Gradient Border */}
        <div
          className="absolute inset-0 rounded-2xl p-px 
          bg-gradient-to-br from-transparent via-transparent to-[#6ee7b7] 
          opacity-0 group-hover/card:opacity-100 
          transition-opacity duration-400 pointer-events-none"
          style={{
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          }}
        />

        <div className="relative bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] border border-[rgba(52,211,153,0.06)] rounded-2xl overflow-hidden flex flex-col h-full group-hover/card:border-[rgba(52,211,153,0.18)] group-hover/card:shadow-[0_8px_32px_rgba(52,211,153,0.18),0_0_0_1px_rgba(52,211,153,0.18)] transition-all duration-400">

          {/* Top Accent Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-[#059669] via-[#34d399] to-[#059669] opacity-50 group-hover/card:opacity-90 transition-opacity duration-400" />

          {/* HEADER */}
          <div className="px-5 pt-5 pb-0">
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-3">
                {(() => { const PL = getProtocolLogo(market.protocol); return <PL size={40} />; })()}
                <div>
                  <h3 className="text-[17px] font-bold text-[#e8e6ee] tracking-tight leading-none">
                    {market.protocol}
                  </h3>
                  <p className="text-[10px] text-[#7A8792] uppercase font-semibold tracking-[0.1em] mt-1.5 flex items-center gap-1">
                    {market.name}
                    {collateralTokens.map((token) => {
                      const Logo = TOKEN_LOGOS[token];
                      return <Logo key={token} size={12} />;
                    })}
                    {collateralSymbol.replace(/^mock/, '')}
                  </p>
                </div>
              </div>

              <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-md text-[#6ee7b7] border border-[rgba(52,211,153,0.20)] bg-[rgba(52,211,153,0.10)]">
                Live
              </span>
            </div>
          </div>

          {/* RATE */}
          <div className="px-5 pt-5 pb-4">
            <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280] mb-2">
              Current Rate
            </div>
            <div className="flex items-baseline gap-2.5">
              <span className="text-[42px] font-mono font-bold text-[#e8e6ee] tracking-tighter leading-none">
                {currentRate.toFixed(2)}
              </span>
              <span className="text-lg font-mono font-bold text-[#6B7280] -ml-1">
                %
              </span>

              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  dayChange >= 0
                    ? "text-[#34d399] bg-[#34d399]/10"
                    : "text-[#f87171] bg-[#f87171]/10"
                }`}
              >
                {dayChange >= 0 ? "+" : ""}
                {dayChange.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* STRIP */}
          <div className="px-5 py-3 bg-black/40 border-y border-[rgba(52,211,153,0.06)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                Duration
              </span>
              <span className="text-xs font-mono font-bold text-[#9896a3]">
                {termDays}d
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                {collateralTokens.map((token) => {
                  const Logo = TOKEN_LOGOS[token];
                  return <Logo key={token} size={20} />;
                })}
              </div>
              <span className="text-xs font-mono font-bold text-[#9896a3]">
                {collateralSymbol}
              </span>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="px-5 pb-4 pt-1 mt-auto">
            <div className="grid grid-cols-2 gap-2">

              {/* UP */}
              <button
                onClick={() => handleOpenSwap("FLOATING")}
                className="bg-gradient-to-br from-[#6ee7b7] to-[#34d399] 
                text-[#030305] py-2.5 rounded-lg 
                active:scale-[0.97] transition-all duration-200 
                hover:shadow-[0_4px_20px_rgba(52,211,153,0.30)] 
                group/btn cursor-pointer"
              >
                <ArrowUp className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover/btn:scale-110 transition-transform" />
                <div className="text-[11px] font-bold tracking-tight">Up</div>
                <div className="text-[8px] text-[#030305]/40 mt-0.5 font-semibold">
                  rates go up
                </div>
              </button>

              {/* DOWN */}
              <button
                onClick={() => handleOpenSwap("FIXED")}
                className="bg-white/6 cursor-pointer 
                hover:bg-[rgba(52,211,153,0.10)] 
                text-[#9896a3] hover:text-[#6ee7b7] 
                py-2.5 rounded-lg active:scale-[0.97] 
                transition-all duration-200 
                border border-[rgba(52,211,153,0.06)] 
                hover:border-[rgba(52,211,153,0.20)] 
                group/btn"
              >
                <ArrowDown className="w-3.5 h-3.5 mx-auto mb-0.5 group-hover/btn:scale-110 transition-transform" />
                <div className="text-[11px] font-bold tracking-tight">Down</div>
                <div className="text-[8px] text-[#7A8792] mt-0.5 font-semibold">
                  rates go down
                </div>
              </button>

            </div>
          </div>
        </div>
      </div>

      {showSwapDialog && (
        <SwapModal
          isOpen={showSwapDialog}
          onClose={() => setShowSwapDialog(false)}
          market={market}
          direction={activeDirection}
          marketDetails={marketDetails}
        />
      )}
    </>
  );
};
