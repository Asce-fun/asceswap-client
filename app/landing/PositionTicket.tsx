import { BORROW_SCENARIO, boundFor, formatMoney, formatRate, premiumFor } from "./hedgeMath";

/**
 * What a hedger actually holds. Deliberately shows a margin row reading "none"
 * — the absence is the product argument.
 */
export function PositionTicket() {
  const scenario = BORROW_SCENARIO;
  const cap = scenario.defaultLevel;

  const rows = [
    { label: "COVER FROM", value: formatRate(cap) },
    { label: "COVER TO", value: formatRate(boundFor(cap, scenario)) },
    { label: "PREMIUM PAID", value: formatMoney(premiumFor(cap, scenario)) },
    { label: "FURTHER CALLS", value: "None" },
    { label: "LIQUIDATION PRICE", value: "None" },
  ];

  return (
    <div className="rounded border border-[#bcd5c9] bg-white/80">
      <div className="flex items-center justify-between gap-3 border-b border-[#cfe0d8] px-4 py-2.5 font-mono text-[10px] tracking-[0.22em]">
        <span className="text-[#5c6b64]">POSITION</span>
        <span className="text-[#047857]">OPEN · 18D LEFT</span>
      </div>

      <dl className="divide-y divide-[#eaf2ee]">
        {rows.map((row) => {
          const isNone = row.value === "None";
          return (
            <div key={row.label} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <dt className="font-mono text-[10px] tracking-[0.16em] text-[#a8b8b0]">
                {row.label}
              </dt>
              <dd
                className={`font-mono text-sm tabular-nums ${
                  isNone ? "text-[#047857]" : "text-[#0c1a15]"
                }`}
              >
                {row.value}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
