/**
 * A departure-board strip of what the product guarantees, drifting past.
 * Under prefers-reduced-motion the animation is suppressed in CSS and the
 * track simply sits still, so every item is still reachable and readable.
 */

const features = [
  "FULLY COLLATERALIZED",
  "NO MARGIN",
  "NO LIQUIDATIONS",
  "NO PATH DEPENDENCY",
  "COST KNOWN AT ENTRY",
  "EXIT ANY TIME",
  "SETTLES ON A PUBLISHED ORACLE",
  "MAKERS PAY NO FEES",
];

function Run({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {features.map((feature) => (
        <span key={feature} className="flex items-center whitespace-nowrap">
          <span className="px-7 font-mono text-[11px] tracking-[0.24em] text-[#41514a]">
            {feature}
          </span>
          <span className="h-1 w-1 shrink-0 rounded-full bg-[#9fcfba]" />
        </span>
      ))}
    </div>
  );
}

export function FeatureTicker() {
  return (
    <div className="overflow-hidden border-y border-[#cfe0d8] bg-white/45 py-3.5">
      <div className="ticker-drift flex w-max">
        <Run />
        <Run hidden />
      </div>
    </div>
  );
}
