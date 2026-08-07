import {
  BORROW_SCENARIO,
  boundFor,
  formatMoney,
  formatRate,
  settlementSummary,
} from "./hedgeMath";

/**
 * A settled market as an object. Every figure is computed from the same module
 * the calculator uses, so the receipt and the interaction can never disagree.
 * The reading sits mid-band on purpose — a partial payout is the honest case,
 * and a maximum payout would misrepresent a linear curve as a cliff.
 */
const SETTLED_RATE = 7.4;

function Stamp() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-5 top-24 -rotate-[14deg] select-none"
    >
      <div className="rounded-sm border-[3px] border-[#047857]/35 px-3 py-1.5 opacity-90">
        <div className="font-mono text-[15px] font-bold tracking-[0.2em] text-[#047857]/45">
          SETTLED
        </div>
        <div className="mt-0.5 text-center font-mono text-[8px] tracking-[0.18em] text-[#047857]/35">
          ORACLE READ ONCE
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={`text-sm ${muted ? "text-[#8aa096]" : "text-[#5c6b64]"}`}>{label}</dt>
      <dd
        className={`font-mono text-sm tabular-nums ${
          muted ? "text-[#b4715a]" : "text-[#0c1a15]"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

export function SettlementReceipt() {
  const scenario = BORROW_SCENARIO;
  const cap = scenario.defaultLevel;
  const s = settlementSummary(SETTLED_RATE, cap, scenario);

  return (
    <div className="group mx-auto max-w-md">
      <div className="transition-transform duration-300 ease-out group-hover:-translate-y-1">
        <div className="receipt-perf" aria-hidden="true" />

        <div className="relative border border-t-0 border-[#cfe0d8] bg-[#fffefb] px-6 pb-6 pt-5 shadow-[0_10px_30px_rgba(64,86,74,0.08)] transition-shadow duration-300 group-hover:shadow-[0_22px_50px_rgba(64,86,74,0.16)]">
          <Stamp />

          <div className="flex items-center justify-between gap-3 font-mono text-[10px] tracking-[0.22em]">
            <span className="text-[#5c6b64]">SETTLEMENT RECEIPT</span>
            <span className="text-[#a8b8b0]">EXAMPLE</span>
          </div>

          <p className="mt-4 font-mono text-[11px] leading-relaxed tracking-[0.1em] text-[#a8b8b0]">
            {scenario.header} · {scenario.termDays}-DAY COVER
          </p>

          <dl className="mt-5 space-y-2.5 border-t border-dashed border-[#cfe0d8] pt-5">
            <Line label="Oracle reading at maturity" value={formatRate(SETTLED_RATE)} />
            <Line label="Your cap" value={formatRate(cap)} />
            <Line label="Cover ended" value={formatRate(boundFor(cap, scenario))} />
          </dl>

          <dl className="mt-5 space-y-2.5 border-t border-dashed border-[#cfe0d8] pt-5">
            <Line label="Cover paid you" value={formatMoney(s.payout)} />
            <Line label="Premium you paid" value={`−${formatMoney(s.premium)}`} />
            <div className="flex items-baseline justify-between gap-4 border-t border-[#cfe0d8] pt-2.5">
              <dt className="text-sm font-semibold text-[#0c1a15]">Net</dt>
              <dd className="font-mono text-xl font-semibold text-[#047857] tabular-nums">
                +{formatMoney(s.net)}
              </dd>
            </div>
          </dl>

          <dl className="mt-5 space-y-2 border-t border-dashed border-[#cfe0d8] pt-5">
            <Line label="Your borrow cost, capped" value={formatMoney(s.hedged)} />
            <Line label="Without cover" value={formatMoney(s.baseline)} muted />
          </dl>

          <p className="mt-5 border-t border-[#cfe0d8] pt-4 font-mono text-[10px] leading-relaxed tracking-[0.12em] text-[#a8b8b0]">
            {formatMoney(s.payout)} TO COVER · {formatMoney(s.residual)} TO THE OTHER SIDE ·
            SUMS TO THE {formatMoney(s.escrowed)} ESCROWED AT CREATION
          </p>

          {/* Revealed on hover / keyboard focus — the receipt doubles as a CTA. */}
          <div className="mt-5 max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:mt-5 group-hover:max-h-24 group-hover:opacity-100 group-focus-within:mt-5 group-focus-within:max-h-24 group-focus-within:opacity-100">
            <a
              href="#early-access"
              className="flex items-center justify-center rounded-sm bg-[#059669] px-5 py-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-white transition hover:bg-[#047857]"
            >
              COVER YOUR RATE →
            </a>
          </div>
        </div>

        <div className="receipt-perf rotate-180" aria-hidden="true" />
      </div>
    </div>
  );
}
