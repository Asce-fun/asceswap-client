"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { FormattedMarket, MarketData } from "../interface/types";
import { MARKET_META } from "../constants/markets";
import numberFormatter from "../blockchain/utils/numberFormatter";

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
    iconColor: "#a78bfa",
    oracleSource: market.protocol,
    termLabel: "30d",
    collateralSymbol: "USDC",
  };

  const collateralSymbol = meta?.collateralSymbol ?? "USDC";
  const tvl = marketDetails?.pool?.totalCollateral ?? 0;
  const swapFeeBps = (marketDetails?.params?.swapFeePct ?? 0) * 100;
  const termDays = marketDetails?.params?.swapTermDays ?? 30;
  const lockedTotal = marketDetails
    ? marketDetails.pool.lockedFixed + marketDetails.pool.lockedFloating
    : 0;
  const utilization = tvl > 0 ? (lockedTotal / tvl) * 100 : 0;
  const utilizationFraction = utilization / 100;

  const apy = marketDetails
    ? (swapFeeBps * utilizationFraction * (365 / termDays)) / 10000
    : null;

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left group/card transition-all duration-400 hover:-translate-y-1 cursor-pointer"
    >
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

      <div className="relative bg-[#111114] border border-[rgba(180,175,200,0.06)] rounded-2xl overflow-hidden flex flex-col group-hover/card:border-[rgba(180,175,200,0.12)] group-hover/card:shadow-[0_8px_32px_rgba(167,139,250,0.22),0_0_0_1px_rgba(167,139,250,0.22)] transition-all duration-400">
        {/* Top accent line */}
        <div className="h-[2px] w-full bg-linear-to-r from-[#a78bfa] via-[#c4a6ff] to-[#e8b4b8] opacity-60 group-hover/card:opacity-100 transition-opacity duration-400" />

        {/* Your LP Badge */}
        {hasPosition && (
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[rgba(167,139,250,0.10)] border border-[rgba(167,139,250,0.22)] text-[9px] font-bold text-[#c4b5fd] uppercase tracking-wider z-10">
            Your LP
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="px-5 pt-5 pb-0">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
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
                  {market.name}
                </h3>
                <p className="text-[10px] text-[#8A8894] font-semibold tracking-[0.1em] mt-1.5">
                  {meta?.oracleSource ?? market.protocol} ·{" "}
                  {meta?.termLabel ?? ""} Term
                </p>
              </div>
            </div>
            {!hasPosition && (
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-md text-[#c4b5fd] border border-[rgba(167,139,250,0.22)] bg-[rgba(167,139,250,0.10)]">
                Live
              </span>
            )}
          </div>
        </div>

        {/* ── APY ── */}
        <div className="px-5 pt-5 pb-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#5C5A66] mb-2">
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
            {hasPosition && positionValue !== undefined && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md text-[#a78bfa] bg-[#a78bfa]/10">
                ${numberFormatter(positionValue)}
              </span>
            )}
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

        {/* ── TVL + UTILIZATION ── */}
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#5C5A66] mb-0.5">
              TVL
            </div>
            <div className="text-xs font-mono font-bold text-[#BAB8C4]">
              ${numberFormatter(tvl)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#5C5A66] mb-0.5">
              Utilization
            </div>
            <div className="text-xs font-mono font-bold text-[#BAB8C4]">
              {utilization.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="px-5 pb-5 pt-0">
          <div className="w-full py-3 rounded-xl bg-[rgba(167,139,250,0.08)] border border-[rgba(167,139,250,0.10)] flex items-center justify-center gap-2 group-hover/card:bg-[rgba(167,139,250,0.12)] group-hover/card:border-[rgba(167,139,250,0.22)] transition-all">
            <span className="text-[12px] font-bold text-[#c4b5fd] uppercase tracking-wider">
              {hasPosition ? "Manage Position" : "Provide Liquidity"}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#c4b5fd] group-hover/card:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </button>
  );
};
