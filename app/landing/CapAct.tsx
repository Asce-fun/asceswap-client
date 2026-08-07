import { FadeUp } from "./FadeUp";
import { HedgeCalculator } from "./HedgeCalculator";

export function CapAct() {
  return (
    // The page's centre of gravity — earned through scale and space rather
    // than a background colour that would break the scroll's light-to-dark arc.
    <section className="px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#059669]">
            SO CAP IT
          </p>
          <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
            Pick the level you never want to pay beyond.
          </h2>
        </FadeUp>

        <FadeUp delay={0.1}>
          <div className="mt-10">
            <HedgeCalculator />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
