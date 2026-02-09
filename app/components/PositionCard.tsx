import React from "react";
import { Lock, Waves } from "lucide-react";
import { Position, PositionSide } from "../interface/types";

interface PositionCardProps {
  position: Position;
  onClick: () => void;
}

export const PositionCard: React.FC<PositionCardProps> = ({
  position,
  onClick,
}) => {
  const isFixed = position.side === PositionSide.FIXED;
  const pnlColor = position.pnl >= 0 ? "text-green-400" : "text-red-400";

  /* ---------------- TIME-BASED PROGRESS (NO CONSTANTS) ---------------- */

  const remainingSeconds = position.remainingSeconds ?? 0;
  const financialProgressBps =
    typeof position.progressPct === "number"
      ? position.progressPct * 100 // convert % → bps-like
      : 0;

  let timeProgressPct = 0;

  if (remainingSeconds > 0 && financialProgressBps < 10000) {
    const totalSeconds =
      remainingSeconds / (1 - financialProgressBps / 10000);

    const elapsedSeconds =
      totalSeconds - remainingSeconds;

    timeProgressPct = Math.min(
      100,
      Math.max(0, (elapsedSeconds / totalSeconds) * 100)
    );
  }

  /* -------------------------------------------------------------------- */

  return (
    <div
      onClick={onClick}
      className="
        group relative cursor-pointer rounded-2xl p-px
        bg-linear-to-br from-white/10 via-white/5 to-transparent
        hover:from-blue-500/30 hover:via-purple-500/20
        transition-all duration-300
      "
    >
      <div
        className="
          relative rounded-2xl p-6
          bg-[#0b0f16]/90
          backdrop-blur-xl
          border border-white/5
          shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]
          hover:-translate-y-0.5
          hover:shadow-[0_30px_80px_-25px_rgba(0,0,0,1)]
          transition-all duration-300
          overflow-hidden
        "
      >
        {/* TOP GLOW */}
        <div
          className={`
            absolute inset-x-0 top-0 h-24
            bg-linear-to-b
            ${isFixed ? "from-blue-500/10" : "from-purple-500/10"}
            to-transparent
            pointer-events-none
          `}
        />

        <div className="relative z-10">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-3">
              <div
                className={`
                  p-2.5 rounded-xl
                  ${
                    isFixed
                      ? "bg-blue-600/10 text-blue-400"
                      : "bg-purple-600/10 text-purple-400"
                  }
                `}
              >
                {isFixed ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Waves className="w-5 h-5" />
                )}
              </div>

              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  {position.side} SIDE
                </p>
                <p className="text-sm font-semibold text-zinc-300">
                  #{position.swapId}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">
              {position.status}
            </span>
          </div>

          {/* RATE */}
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-zinc-500 text-sm">
              {isFixed ? "Rate" : "Current APR"}
            </span>
            <span className="text-3xl font-medium text-white">16</span>
          </div>

          {/* PNL */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-zinc-500 text-sm">Unrealized P&L</span>
            <span className={`text-lg font-semibold ${pnlColor}`}>
              {position.pnl >= 0 ? "+" : ""}$
              {position.pnl}
            </span>
          </div>

          {/* PROGRESS */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
              <span>Progress</span>
              <span>{position.remainingDays}d left</span>
            </div>

            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`
                  h-full rounded-full transition-all duration-1000
                  ${
                    isFixed
                      ? "bg-linear-to-r from-blue-500 to-cyan-400"
                      : "bg-linear-to-r from-purple-500 to-pink-400"
                  }
                `}
                style={{ width: `${timeProgressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* DECORATIVE GLOW */}
        <div
          className={`
            absolute -right-6 -bottom-6 w-24 h-24
            blur-3xl opacity-20 group-hover:opacity-40 transition-opacity
            ${isFixed ? "bg-blue-500" : "bg-purple-500"}
          `}
        />
      </div>
    </div>
  );
};