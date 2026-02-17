"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { FormattedMarket, MarketData } from "../interface/types";
import { MARKET_META } from "../constants/markets";
import numberFormatter from "../blockchain/utils/numberFormatter";
import { extractTokensFromName } from "../lib/helpers/helpers";
import { TOKEN_LOGOS } from "../lib/helpers/tokenLogos";

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
    iconColor: "#14b8a6",
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

  const tokens = extractTokensFromName(market.name);
  const collateralTokens = extractTokensFromName(collateralSymbol);

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left group transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative bg-[#0f1115] border border-white/5 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 group-hover:border-[rgba(94,234,212,0.20)] group-hover:shadow-[0_10px_30px_rgba(94,234,212,0.20)]">

        {/* Accent Line */}
        <div
          className="h-[2px] w-full opacity-80"
          style={{
            background:
              "linear-gradient(90deg,#0d9488,#14b8a6,#0d9488)",
          }}
        />

        {/* Your LP Badge */}
        {hasPosition && (
          <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-[rgba(94,234,212,0.08)] border border-[rgba(94,234,212,0.20)] text-[9px] font-bold text-[#5eead4] uppercase tracking-wider">
            Your LP
          </div>
        )}

        {/* HEADER */}
        <div className="px-5 pt-5">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              <div className="flex items-center gap-1">
                {tokens.map((token) => {
                  const Logo = TOKEN_LOGOS[token];
                  return <Logo key={token} size={38} />;
                })}
              </div>

              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight leading-none">
                  {market.name}
                </h3>
                <p className="text-[10px] text-[#6b7280] font-semibold tracking-[0.1em] mt-1.5">
                  {meta?.oracleSource ?? market.protocol} ·{" "}
                  {meta?.termLabel ?? ""} Term
                </p>
              </div>
            </div>

            {!hasPosition && (
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-md text-[#5eead4] border border-[rgba(94,234,212,0.20)] bg-[rgba(94,234,212,0.08)]">
                Live
              </span>
            )}
          </div>
        </div>

        {/* APY */}
        <div className="px-5 pt-5 pb-4">
          <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#6b7280] mb-2">
            Estimated APY
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="text-[40px] font-mono font-bold tracking-tighter leading-none text-[#14b8a6]">
              {apy !== null ? (apy * 100).toFixed(1) : "—"}
            </span>

            {apy !== null && (
              <span className="text-lg font-mono font-bold text-[#14b8a6]/40 -ml-1">
                %
              </span>
            )}

            {hasPosition && positionValue !== undefined && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md text-[#042f2e] bg-[#5eead4]">
                ${numberFormatter(positionValue)}
              </span>
            )}
          </div>
        </div>

        {/* Duration + Collateral Strip */}
        <div className="px-5 py-3 bg-black/30 border-y border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
              Duration
            </span>
            <span className="text-xs font-mono font-bold text-zinc-300">
              {termDays}d
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              {collateralTokens.map((token) => {
                const Logo = TOKEN_LOGOS[token];
                return <Logo key={token} size={18} />;
              })}
            </div>
            <span className="text-xs font-mono font-bold text-zinc-300">
              {collateralSymbol}
            </span>
          </div>
        </div>

        {/* TVL + Utilization */}
        <div className="px-5 py-3.5 flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7280] mb-0.5">
              TVL
            </div>
            <div className="text-xs font-mono font-bold text-zinc-300">
              ${numberFormatter(tvl)}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#6b7280] mb-0.5">
              Utilization
            </div>
            <div className="text-xs font-mono font-bold text-zinc-300">
              {utilization.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-5">
          <div
            className="w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            style={{
              background:
                "linear-gradient(135deg,#5eead4,#14b8a6)",
              color: "#0A0A0C",
            }}
          >
            <span className="text-[12px] font-bold uppercase tracking-wider">
              {hasPosition ? "Manage Position" : "Provide Liquidity"}
            </span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>
    </button>
  );
};
