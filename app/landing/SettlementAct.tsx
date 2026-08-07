import { FadeUp } from "./FadeUp";
import { SettlementReceipt } from "./SettlementReceipt";

export function SettlementAct() {
  return (
    <section id="settlement" className="scroll-mt-20 px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)]">
          <FadeUp>
            <p className="font-mono text-[11px] tracking-[0.28em] text-[#8aa096]">
              SETTLEMENT
            </p>
            <h2 className="mt-4 max-w-md font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
              One reading. One payout. Done.
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-[#5c6b64]">
              At maturity the oracle is read once and the collateral splits along
              the curve. Anyone can trigger it, it happens a single time, and the
              market is then closed.
            </p>
            <p className="mt-6 font-mono text-[11px] leading-relaxed tracking-[0.14em] text-[#a8b8b0]">
              TRADING CLOSES AT MATURITY · SELL BACK ANY TIME BEFORE IT
            </p>
          </FadeUp>

          <FadeUp delay={0.1}>
            <SettlementReceipt />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
