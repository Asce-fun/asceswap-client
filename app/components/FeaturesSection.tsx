"use client";

import React from "react";
import { Zap, Coins, Layers, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Capital Efficient",
    description:
      "Post collateral only for your rate exposure, not the full notional. Trade $10K notional with ~$3K margin.",
  },
  {
    icon: Coins,
    title: "Earn as LP",
    description:
      "Supply liquidity and earn 80% of all swap fees. Act as the global counterparty across every market.",
  },
  {
    icon: Layers,
    title: "NFT Positions",
    description:
      "Every swap is a transferable ERC-721 NFT. Manage, transfer, or compose your positions permissionlessly.",
  },
  {
    icon: ShieldCheck,
    title: "Real-Time Risk Engine",
    description:
      "Margin requirements decay over time as swap terms progress. Health monitoring on every block.",
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section className="mt-28 mb-16">
      <div className="text-center mb-14">
        <h2
          className="font-serif font-normal text-[#e8e6ee] mb-4 leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Why{" "}
          <em className="italic text-transparent bg-clip-text bg-gradient-to-br from-[#6ee7b7] to-[#34d399]">
            AsceSwap
          </em>
        </h2>

        <p className="text-[#9896a3] text-sm max-w-md mx-auto">
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
                {f.title}
              </h3>

              <p className="text-[#9896a3] text-xs leading-relaxed">
                {f.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
