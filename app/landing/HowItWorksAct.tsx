import { Fuel, Gauge, Landmark, TrendingUp } from "lucide-react";

import { FadeUp } from "./FadeUp";

function BoundaryDiagrams() {
  return (
    <div className="flex items-end gap-3" aria-hidden="true">
      {[
        { label: "Cap", path: "M2 26 L 20 26 L 34 8 L 50 8" },
        { label: "Floor", path: "M2 8 L 20 8 L 34 26 L 50 26" },
        { label: "Range", path: "M2 26 L 14 26 L 22 8 L 32 8 L 40 26 L 50 26" },
      ].map((curve) => (
        <div key={curve.label} className="text-center">
          <svg viewBox="0 0 52 32" className="h-8 w-14" fill="none">
            <path
              d={curve.path}
              stroke="#059669"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-[#8aa096]">
            {curve.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function SettlementDiagram() {
  return (
    <div aria-hidden="true">
      <div className="flex h-8 w-full overflow-hidden rounded-md">
        <div className="flex w-[62%] items-center justify-center bg-[#059669] text-[10px] font-bold uppercase tracking-wide text-white">
          Payoff
        </div>
        <div className="flex w-[38%] items-center justify-center bg-[#d8e9e0] text-[10px] font-bold uppercase tracking-wide text-[#41514a]">
          Residual
        </div>
      </div>
      <p className="mt-1.5 text-center font-mono text-[11px] text-[#8aa096]">
        always sums to 1 unit of collateral
      </p>
    </div>
  );
}

const steps = [
  {
    number: "01",
    title: "Pick a rate",
    body: "Gas fees, lending APR, staking yield, RWA benchmarks — any rate an oracle can observe.",
    figure: (
      <div className="flex gap-3 text-[#059669]" aria-hidden="true">
        <Fuel className="h-6 w-6" />
        <TrendingUp className="h-6 w-6" />
        <Gauge className="h-6 w-6" />
        <Landmark className="h-6 w-6" />
      </div>
    ),
  },
  {
    number: "02",
    title: "Set your boundary",
    body: "A cap, a floor, or a range — the payoff curve is fixed when the market is created and never changes.",
    figure: <BoundaryDiagrams />,
  },
  {
    number: "03",
    title: "Settle by oracle",
    body: "At maturity the oracle reports the realized rate. Collateral splits between the two sides — fully prefunded, no counterparty risk.",
    figure: <SettlementDiagram />,
  },
];

export function HowItWorksAct() {
  return (
    <section id="how-it-works" className="scroll-mt-20 px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <h2 className="max-w-2xl font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
            Three steps. No fine print.
          </h2>
        </FadeUp>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => (
            <FadeUp key={step.number} delay={index * 0.12}>
              <div className="flex h-full flex-col rounded-xl border border-[#cfe0d8] bg-[#f7fbf9] p-6">
                <span className="font-mono text-xs font-semibold text-[#8aa096]">
                  {step.number}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-[#0c1a15]">
                  {step.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[#5c6b64]">
                  {step.body}
                </p>
                <div className="mt-6">{step.figure}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
