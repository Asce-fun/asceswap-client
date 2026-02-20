"use client";

import React from "react";
import { PageLayout } from "../components/PageLayout";
import Image from "next/image";

export default function CuratorPage() {
  return (
    <PageLayout showFooter={false}>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
        {/* Cover Banner */}
        <div className="relative w-full max-w-3xl mb-12 rounded-2xl overflow-hidden border border-[#1e1e2a]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-transparent to-transparent z-10 pointer-events-none" />
          <Image
            src="/images/cover-curators.png"
            alt="Curators"
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
          Curators
        </h1>

        {/* Description */}
        <p className="text-sm text-[#9896a3] max-w-md leading-relaxed mb-8">
          Deploy your own markets. Become a curator and create custom interest
          rate swap markets with your own parameters, fee structures, and
          oracle configurations.
        </p>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl w-full">
          {[
            { label: "Custom Markets", desc: "Define your own swap pairs" },
            { label: "Fee Control", desc: "Set custom fee structures" },
            { label: "Oracle Config", desc: "Choose your data sources" },
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
