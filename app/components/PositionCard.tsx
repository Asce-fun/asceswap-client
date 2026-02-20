import React from "react";
import { Lock, Waves, CheckCircle } from "lucide-react";
import { Position, PositionSide } from "../interface/types";
import { MARKETS, MARKET_META } from "../constants/markets";

interface PositionCardProps {
  position: Position;
  onClick: () => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClick,
}) => {
  const isFixed = position.side === PositionSide.FIXED;
  const isActive = position.status === "ACTIVE";
  const isSettled = !isActive; // SETTLED, LIQUIDATED, EXITEDEARLY
  const pnlColor = position.pnl >= 0 ? "text-[#34d399]" : "text-[#f87171]";

  const meta = MARKET_META[String(position.pairId)];
  const market = MARKETS.find((m) => m.id === String(position.pairId));
  const marketName = market?.name ?? `Market #${position.pairId}`;
  const tokenSymbol = (meta?.collateralSymbol ?? "USDC").replace(/^mock/i, "");

  const remainingSeconds = position.remainingSeconds ?? 0;
  const isExpired = remainingSeconds <= 0;

  // Compute time-based progress
  let timeProgressPct = 0;

  if (isExpired || isSettled) {
    timeProgressPct = 100;
  } else {
    const financialProgressBps =
      typeof position.progressPct === "number"
        ? position.progressPct * 100
        : 0;

    if (financialProgressBps < 10000) {
      const totalSeconds =
        remainingSeconds / (1 - financialProgressBps / 10000);
      const elapsedSeconds = totalSeconds - remainingSeconds;
      timeProgressPct = Math.min(
        100,
        Math.max(0, (elapsedSeconds / totalSeconds) * 100)
      );
    }
  }

  // Fixed rate display
  const fixedRateDisplay =
    position.fixedRatePct != null && position.fixedRatePct > 0
      ? `${position.fixedRatePct.toFixed(2)}%`
      : "--";

  // Status badge config
  const statusBadge = (() => {
    switch (position.status) {
      case "ACTIVE":
        return { label: "ACTIVE", bg: "bg-[#34d399]/10", text: "text-[#34d399]", border: "border-[#34d399]/20" };
      case "SETTLED":
        return { label: "SETTLED", bg: "bg-white/5", text: "text-[#9896a3]", border: "border-white/10" };
      case "LIQUIDATED":
        return { label: "LIQUIDATED", bg: "bg-[#f87171]/10", text: "text-[#f87171]", border: "border-[#f87171]/20" };
      case "EXITEDEARLY":
        return { label: "EXITED", bg: "bg-amber-400/10", text: "text-amber-400", border: "border-amber-400/20" };
      default:
        return { label: position.status, bg: "bg-white/5", text: "text-[#9896a3]", border: "border-white/10" };
    }
  })();

  return (
    <div
      onClick={onClick}
      className={`
        group relative cursor-pointer rounded-2xl p-px
        bg-linear-to-br
        ${isSettled
          ? "from-white/5 via-white/[0.02] to-transparent hover:from-white/10 hover:via-white/5"
          : "from-white/10 via-white/5 to-transparent hover:from-[#34d399]/30 hover:via-[#34d399]/20"
        }
        transition-all duration-300
      `}
    >
      <div
        className={`
          relative rounded-2xl p-5
          bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
          border border-[#1e1e2a]
          shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]
          hover:-translate-y-0.5
          hover:shadow-[0_30px_80px_-25px_rgba(0,0,0,1)]
          transition-all duration-300
          overflow-hidden
          ${isSettled ? "opacity-75" : ""}
        `}
      >
        {/* TOP GLOW */}
        {!isSettled && (
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-[#34d399]/10 to-transparent pointer-events-none" />
        )}

        <div className="relative z-10">
          {/* TOP ROW: Swap ID + Status */}
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-mono text-[#4B5563] tracking-wide">
              #{position.swapId}
            </span>
            <span className={`px-1.5 py-px rounded text-[9px] font-semibold ${statusBadge.bg} ${statusBadge.text} border ${statusBadge.border}`}>
              {statusBadge.label}
            </span>
          </div>

          {/* HEADER: Icon + Market */}
          <div className="flex items-center gap-2.5 mb-5">
            <div className={`p-2 rounded-lg ${isSettled ? "bg-white/5 text-[#6B7280]" : "bg-[#34d399]/10 text-[#34d399]"}`}>
              {isFixed ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Waves className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-[9px] font-semibold text-[#4B5563] uppercase tracking-widest">
                {position.side} Side
              </p>
              <p className={`text-[13px] font-semibold leading-tight ${isSettled ? "text-[#9896a3]" : "text-[#e8e6ee]"}`}>
                {marketName}
              </p>
            </div>
          </div>

          {/* FIXED RATE */}
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-xs text-[#6B7280]">Fixed Rate</span>
            <span className={`text-xl font-semibold tabular-nums ${isSettled ? "text-[#9896a3]" : "text-[#e8e6ee]"}`}>{fixedRateDisplay}</span>
          </div>

          {/* DIVIDER */}
          <div className="h-px bg-white/5 mb-3" />

          {/* NOTIONAL */}
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-[#6B7280]">Notional</span>
            <span className="text-[13px] font-medium text-[#9896a3] tabular-nums">
              {position.notional.toFixed(4)} {tokenSymbol}
            </span>
          </div>

          {/* PNL */}
          <div className="flex justify-between items-center mb-4">
            <span className="text-[11px] text-[#6B7280]">{isSettled ? "Final P&L" : "Unrealized P&L"}</span>
            <span className={`text-[13px] font-semibold tabular-nums ${isSettled ? "text-[#9896a3]" : pnlColor}`}>
              {position.pnl >= 0 ? "+" : ""}{position.pnl.toFixed(4)} {tokenSymbol}
            </span>
          </div>

          {/* PROGRESS — only show for active */}
          {isActive && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] text-[#4B5563] font-semibold uppercase tracking-wider">
                <span>Progress</span>
                {isExpired ? (
                  <span className="flex items-center gap-1 text-[#34d399]">
                    <CheckCircle className="w-3 h-3" />
                    Ready to Settle
                  </span>
                ) : (
                  <span className="text-[#9896a3]">{position.remainingLabel}</span>
                )}
              </div>

              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`
                    h-full rounded-full transition-all duration-1000
                    ${
                      isExpired
                        ? "bg-[#34d399]"
                        : "bg-linear-to-r from-[#34d399] to-[#6ee7b7]"
                    }
                  `}
                  style={{ width: `${timeProgressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* SETTLED LABEL — show for non-active */}
          {isSettled && (
            <div className="flex justify-between items-center text-[9px] text-[#4B5563] font-semibold uppercase tracking-wider">
              <span>Status</span>
              <span className={`${statusBadge.text}`}>
                {position.status === "SETTLED" ? "Settled" : position.status === "LIQUIDATED" ? "Liquidated" : "Exited Early"}
              </span>
            </div>
          )}
        </div>

        {/* DECORATIVE GLOW — only for active */}
        {!isSettled && (
          <div className="absolute -right-6 -bottom-6 w-24 h-24 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity bg-[#34d399]" />
        )}
      </div>
    </div>
  );
};
