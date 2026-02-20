"use client";

import React from "react";

const stats = [
  { value: "6", label: "Markets" },
  { value: "3", label: "Collateral Types" },
  { value: "7D", label: "Rate History" },
  { value: "24/7", label: "On-Chain" },
];

export const NumbersStrip: React.FC = () => {
  return (
    <section className="mt-20 mb-8">
      <div
        className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4
  py-6 px-6 rounded-[20px]
  bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] border border-[#1e1e2a]"
      >
        {stats.map((s, i) => (
          <React.Fragment key={s.label}>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-mono font-bold text-[#34d399]">
                {s.value}
              </span>
              <span className="text-xs text-[#9896a3] font-medium">
                {s.label}
              </span>
            </div>
            {i < stats.length - 1 && (
              <span className="hidden sm:block text-[#3a3844] text-lg">&middot;</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};
