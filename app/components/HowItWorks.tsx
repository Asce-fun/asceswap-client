"use client";

import React from "react";
import { Target, ArrowLeftRight, CheckCircle } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Target,
    title: "Pick a Rate",
    description:
      "Choose from funding rates, staking yields, lending APYs, or real-world benchmarks.",
  },
  {
    number: "02",
    icon: ArrowLeftRight,
    title: "Take a Side",
    description:
      "Go Fixed to lock in your rate. Go Floating to bet rates move in your favor.",
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Settle at Expiry",
    description:
      "P&L is the difference between your locked rate and the time-weighted average rate over the term.",
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="mt-28 mb-16">
      <div className="text-center mb-14">
        <h2
          className="font-serif font-normal text-[#e8e6ee] mb-4 leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          How It{" "}
          <em className="italic text-transparent bg-clip-text bg-gradient-to-br from-[#6ee7b7] to-[#34d399]">
            Works
          </em>
        </h2>
        <p className="text-[#9896a3] text-sm max-w-md mx-auto">
          Three steps to trade any interest rate on-chain.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.number}
              className="group p-6 rounded-[24px] bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
        border border-[#1e1e2a]
        hover:border-[rgba(52,211,153,0.15)]
        transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-mono font-bold text-[rgba(52,211,153,0.6)]">
                  {s.number}
                </span>
                <div
                  className="w-10 h-10 rounded-xl
          bg-[rgba(52,211,153,0.10)]
          flex items-center justify-center
          text-[#6ee7b7]
          group-hover:bg-[rgba(52,211,153,0.20)]
          transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <h3 className="text-[#e8e6ee] font-bold text-sm mb-2 tracking-tight">
                {s.title}
              </h3>
              <p className="text-[#9896a3] text-xs leading-relaxed">
                {s.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Worked Example */}
      <div
        className="mt-8 p-5 rounded-[20px] bg-[rgba(52,211,153,0.08)]
  border border-[#1e1e2a]"
      >
        <p className="text-xs text-[#9896a3] leading-relaxed">
          <span className="text-[#6ee7b7] font-semibold">Example:</span> You go
          Fixed at 10% on BTC Funding Rate. If the average rate ends up at 12%,
          you profit on the 2% difference &times; your notional.
        </p>
      </div>
    </section>
  );
};
