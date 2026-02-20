"use client";

import React from "react";
import { PageLayout } from "../components/PageLayout";
import Image from "next/image";

export default function HooksPage() {
  return (
    <PageLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        {/* Cover Banner */}
        <div className="relative w-full max-w-3xl mb-12 rounded-2xl overflow-hidden border border-[#1e1e2a]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent z-10 pointer-events-none" />
          <Image
            src="/images/cover_hooks.png"
            alt="Hooks"
            width={1200}
            height={400}
            className="w-full h-auto"
            priority
          />
        </div>

        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#34d399]/10 border border-[#34d399]/20 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#34d399]">
            Coming Soon
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e8e6ee] mb-4">
          Hooks
        </h1>

        {/* Description */}
        <p className="text-sm text-[#9896a3] max-w-lg leading-relaxed mb-8">
          Build custom strategies on top of Asceswap. Integrate Troves, Vesu
          for additional yield, dynamic fees, Dark swaps and more.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl w-full">
          {[
            { label: "Troves", desc: "Leverage yield with Trove integrations" },
            { label: "Vesu", desc: "Compound yield across protocols" },
            { label: "Dynamic Fees", desc: "Adaptive fee mechanisms" },
            { label: "Dark Swaps", desc: "Private, MEV-resistant trades" },
          ].map(({ label, desc }) => (
            <div
              key={label}
              className="p-4 rounded-xl bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] border border-[#1e1e2a]"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#34d399] mb-1">
                {label}
              </p>
              <p className="text-[12px] text-[#6B7280]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
