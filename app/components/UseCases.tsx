"use client";

import React from "react";
import { Lock, TrendingUp, Building2, Droplets } from "lucide-react";

const useCases = [
  {
    icon: Lock,
    title: "Yield Farmers",
    description:
      "Lock in staking yield today. Eliminate uncertainty on future returns by going Fixed on your favorite yield source.",
  },
  {
    icon: TrendingUp,
    title: "Funding Rate Traders",
    description:
      "Speculate on rate movements. Go Floating when you think funding will spike, or Fixed to fade a rate rally.",
  },
  {
    icon: Building2,
    title: "DeFi Treasuries",
    description:
      "Hedge variable revenue streams. Convert floating protocol income into predictable fixed cash flows.",
  },
  {
    icon: Droplets,
    title: "Liquidity Providers",
    description:
      "Earn swap fees across all markets. Provide collateral and collect 80% of trading fees as the global counterparty.",
  },
];

export const UseCases: React.FC = () => {
  return (
    <section className="mt-28 mb-16">
      <div className="text-center mb-14">
        <h2
          className="font-serif font-normal text-[#e8e6ee] mb-4 leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Built{" "}
          <em className="italic text-transparent bg-clip-text bg-gradient-to-br from-[#6ee7b7] to-[#34d399]">
            For You
          </em>
        </h2>
        <p className="text-[#9896a3] text-sm max-w-md mx-auto">
          Whether you&apos;re hedging, speculating, or earning — there&apos;s a
          strategy for you.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {useCases.map((uc) => {
          const Icon = uc.icon;
          return (
            <div
              key={uc.title}
              className="group p-6 rounded-[24px] bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
        border border-[#1e1e2a]
        hover:border-[rgba(52,211,153,0.15)]
        transition-all duration-300"
            >
              <div
                className="w-10 h-10 rounded-xl
          bg-[#34d399]/10
          flex items-center justify-center mb-5
          text-[#6ee7b7]
          group-hover:bg-[#34d399]/20
          transition-colors"
              >
                <Icon className="w-5 h-5" />
              </div>

              <h3 className="text-[#e8e6ee] font-bold text-sm mb-2 tracking-tight">
                {uc.title}
              </h3>

              <p className="text-[#9896a3] text-xs leading-relaxed">
                {uc.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
