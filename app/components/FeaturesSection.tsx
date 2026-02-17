"use client";

import React from "react";
import {
  ShieldCheck,
  TrendingUp,
  Coins,
  Layers,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: ShieldCheck,
    title: "Institutional Grade",
    description:
      "Battle-tested smart contracts with multi-layer risk management, margin enforcement, and real-time health monitoring.",
  },
  {
    icon: TrendingUp,
    title: "Leverage Up to 120x",
    description:
      "Amplify your yield exposure with capital-efficient margin trading. Go long or short on interest rates with precision.",
  },
  {
    icon: Coins,
    title: "Earn Fees as LP",
    description:
      "Supply liquidity and earn 80% of all swap fees. Act as the global counterparty and benefit from trader activity.",
  },
  {
    icon: Layers,
    title: "NFT Positions",
    description:
      "Every swap is minted as a transferable NFT. Manage, transfer, or compose your positions permissionlessly.",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="mt-28 mb-16">
      <div className="text-center mb-14">
        <h2
          className="font-serif font-normal text-white mb-4 leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Why{" "}
          <em className="italic text-transparent bg-clip-text bg-gradient-to-br from-[#99f6e4] to-[#2dd4bf]">
            AsceSwap
          </em>
        </h2>

        <p className="text-[#8A8894] text-sm max-w-md mx-auto">
          The first permissionless interest rate derivatives protocol on
          Starknet.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f) => {
          const Icon = f.icon;

          return (
            <div
              key={f.title}
              className="group p-6 rounded-[24px] bg-[#111114] 
        border border-[rgba(94,234,212,0.06)] 
        hover:border-[rgba(94,234,212,0.18)] 
        transition-all duration-300"
            >
              <div
                className="w-10 h-10 rounded-xl 
          bg-[#14b8a6]/10 
          flex items-center justify-center mb-5 
          text-[#5eead4] 
          group-hover:bg-[#14b8a6]/20 
          transition-colors"
              >
                <Icon className="w-5 h-5" />
              </div>

              <h3 className="text-white font-bold text-sm mb-2 tracking-tight">
                {f.title}
              </h3>

              <p className="text-[#8A8894] text-xs leading-relaxed">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-14">
        <Link
          href="/markets"
          className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[20px] 
    border border-white/10 
    text-[#BAB8C4] 
    hover:text-white 
    hover:border-[rgba(94,234,212,0.20)] 
    hover:bg-[rgba(94,234,212,0.08)] 
    font-semibold text-[15px] 
    transition-all duration-200 
    group"
        >
          Explore Markets
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </section>
  );
};
