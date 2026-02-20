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
      <div
        className="
          group/card relative h-full rounded-2xl p-px
          bg-linear-to-br from-white/10 via-white/5 to-transparent
          hover:from-[#34d399]/30 hover:via-[#34d399]/20
          transition-all duration-300
        "
      >
        <div
          className="
            relative rounded-2xl
            bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
            border border-[#1e1e2a]
            shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]
            hover:-translate-y-0.5
            hover:shadow-[0_30px_80px_-25px_rgba(0,0,0,1)]
            transition-all duration-300
            overflow-hidden flex flex-col h-full
          "
        >
          {/* TOP GLOW */}
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#34d399]/10 to-transparent pointer-events-none" />

          {/* HEADER */}
          <div className="relative z-10 px-5 pt-5 pb-0">
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
          <div className="relative z-10 px-5 pt-5 pb-4">
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

          {/* DURATION & COLLATERAL + BUTTONS */}
          <div className="relative z-10 px-5 pb-5 mt-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6B7280]">Duration</span>
                <span className="text-[11px] font-mono font-bold text-[#9896a3]">{termDays}d</span>
              </div>
              <div className="flex items-center gap-1.5">
                {collateralTokens.map((token) => {
                  const Logo = TOKEN_LOGOS[token];
                  return <Logo key={token} size={16} />;
                })}
                <span className="text-[11px] font-mono font-bold text-[#9896a3]">{collateralSymbol}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleOpenSwap("FLOATING")}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                  bg-[#34d399]/10 text-[#34d399] text-[13px] font-bold
                  border border-[#34d399]/20
                  hover:bg-[#34d399]/20 active:scale-[0.97]
                  transition-all duration-200 cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
                Rates Up
              </button>
              <button
                onClick={() => handleOpenSwap("FIXED")}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                  bg-white/[0.04] text-[#9896a3] text-[13px] font-bold
                  border border-white/[0.06]
                  hover:bg-white/[0.08] hover:text-[#e8e6ee] active:scale-[0.97]
                  transition-all duration-200 cursor-pointer"
              >
                <ArrowDown className="w-4 h-4" />
                Rates Down
              </button>
            </div>
          </div>

          {/* DECORATIVE GLOW */}
          <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-3xl opacity-20 group-hover/card:opacity-40 transition-opacity bg-[#34d399]" />
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
