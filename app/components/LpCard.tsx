"use client";

import React from "react";
import { Plus, BarChart3 } from "lucide-react";
import { FormattedMarket, MarketData } from "../interface/types";
import { MARKET_META } from "../constants/markets";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";
import { getProtocolLogo } from "./SwapCard";

interface LpCardProps {
  market: MarketData;
  marketDetails: FormattedMarket | null;
  hasPosition: boolean;
  positionValue?: number;
  onClick: () => void;
}

export const LpCard: React.FC<LpCardProps> = ({
  market,
  marketDetails,
  hasPosition,
  positionValue,
  onClick,
}) => {
  const meta = MARKET_META?.[market.id] ?? {
    letter: "?",
    colorClass: "",
    iconColor: "#34d399",
    oracleSource: market.protocol,
    termLabel: "30d",
    collateralSymbol: "USDC",
  };

  const collateralSymbol = meta?.collateralSymbol ?? "USDC";
  const tvl = marketDetails?.pool?.totalCollateral ?? 0;
  const swapFeeBps = (marketDetails?.params?.swapFeePct ?? 0) * 100;
  const termDays = marketDetails?.params?.swapTermDays ?? 30;

  const lockedTotal = marketDetails?.pool
    ? (marketDetails.pool.lockedFixed ?? 0) + (marketDetails.pool.lockedFloating ?? 0)
    : 0;

  const utilization = tvl > 0 ? (lockedTotal / tvl) * 100 : 0;
  const utilizationFraction = utilization / 100;

  const apy = marketDetails
    ? (swapFeeBps * utilizationFraction * (365 / termDays)) / 10000
    : null;

  const collateralTokens = extractTokensFromName(collateralSymbol);

  return (
    <button
      onClick={onClick}
      className="
        relative w-full h-full text-left group/card rounded-2xl p-px
        bg-linear-to-br from-white/10 via-white/5 to-transparent
        hover:from-[#34d399]/30 hover:via-[#34d399]/20
        transition-all duration-300 cursor-pointer
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

        {/* Your LP Badge */}
        {hasPosition && (
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.20)] text-[9px] font-bold text-[#6ee7b7] uppercase tracking-wider z-10">
            Your LP
          </div>
        )}

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

            {!hasPosition && (
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-md text-[#6ee7b7] border border-[rgba(52,211,153,0.20)] bg-[rgba(52,211,153,0.10)]">
                Live
              </span>
            )}
          </div>
        </div>

        {/* APY */}
        <div className="relative z-10 px-5 pt-5 pb-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6B7280] mb-2">
            Estimated APY
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-[42px] font-mono font-bold text-[#34d399] tracking-tighter leading-none">
              {apy !== null ? (apy * 100).toFixed(1) : "—"}
            </span>
            {apy !== null && (
              <span className="text-lg font-mono font-bold text-[#34d399]/40 -ml-1">
                %
              </span>
            )}

          </div>
        </div>

        {/* DURATION & COLLATERAL + CTA */}
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
            <div
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                bg-[#34d399]/10 text-[#34d399] text-[13px] font-bold
                border border-[#34d399]/20
                hover:bg-[#34d399]/20 active:scale-[0.97]
                transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              {hasPosition ? "Deposit" : "Provide"}
            </div>
            <div
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl
                bg-white/[0.04] text-[#9896a3] text-[13px] font-bold
                border border-white/[0.06]
                hover:bg-white/[0.08] hover:text-[#e8e6ee] active:scale-[0.97]
                transition-all duration-200"
            >
              <BarChart3 className="w-4 h-4" />
              {hasPosition ? "Manage" : "Details"}
            </div>
          </div>
        </div>

        {/* DECORATIVE GLOW */}
        <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-3xl opacity-20 group-hover/card:opacity-40 transition-opacity bg-[#34d399]" />
      </div>
    </button>
  );
};
