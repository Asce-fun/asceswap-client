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
  const pnlColor = position.pnl >= 0 ? "text-[#34d399]" : "text-[#f43f5e]";

  const remainingSeconds = position.remainingSeconds ?? 0;
  const financialProgressBps =
    typeof position.progressPct === "number"
      ? position.progressPct * 100
      : 0;

  let timeProgressPct = 0;

  if (remainingSeconds > 0 && financialProgressBps < 10000) {
    const totalSeconds =
      remainingSeconds / (1 - financialProgressBps / 10000);
    const elapsedSeconds = totalSeconds - remainingSeconds;
    timeProgressPct = Math.min(
      100,
      Math.max(0, (elapsedSeconds / totalSeconds) * 100)
    );
  }

  return (
    <div
      onClick={onClick}
      className="
        group relative cursor-pointer rounded-2xl p-px
        bg-linear-to-br from-white/10 via-white/5 to-transparent
        hover:from-[#10b981]/30 hover:via-[#34d399]/20
        transition-all duration-300
      "
    >
      <div
        className="
          relative rounded-2xl p-6
          bg-[#0f1115]
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
            ${isFixed ? "from-[#10b981]/10" : "from-[#34d399]/10"}
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
                      ? "bg-[#10b981]/10 text-[#10b981]"
                      : "bg-[#34d399]/10 text-[#34d399]"
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
                <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
                  {position.side} SIDE
                </p>
                <p className="text-sm font-semibold text-[#C7D2FE]">
                  #{position.swapId}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md bg-[#34d399]/10 text-[#34d399] text-[10px] font-bold border border-[#34d399]/20">
              {position.status}
            </span>
          </div>

          {/* RATE */}
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[#6B7280] text-sm">
              {isFixed ? "Rate" : "Current APR"}
            </span>
            <span className="text-3xl font-medium text-white">16%</span>
          </div>

          {/* PNL */}
          <div className="flex justify-between items-center mb-6">
            <span className="text-[#6B7280] text-sm">Unrealized P&L</span>
            <span className={`text-lg font-semibold ${pnlColor}`}>
              {position.pnl >= 0 ? "+" : ""}${position.pnl}
            </span>
          </div>

          {/* PROGRESS */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-[#4B5563] font-bold uppercase tracking-wider">
              <span>Progress</span>
              <span>{position.remainingDays}d left</span>
            </div>

            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className={`
                  h-full rounded-full transition-all duration-1000
                  ${
                    isFixed
                      ? "bg-linear-to-r from-[#10b981] to-[#34d399]"
                      : "bg-linear-to-r from-[#34d399] to-[#6ee7b7]"
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
            ${isFixed ? "bg-[#10b981]" : "bg-[#34d399]"}
          `}
        />
      </div>
    </div>
  );
};
