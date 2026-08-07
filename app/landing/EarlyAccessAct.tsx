import { FadeUp } from "./FadeUp";

export function EarlyAccessAct() {
  return (
    <section id="early-access" className="px-5 py-32 text-center sm:px-8">
      <div className="mx-auto max-w-3xl">
        <FadeUp>
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#2ee59d]">
            EARLY ACCESS
          </p>
          <h2 className="mt-5 font-serif text-3xl leading-snug text-[#f2f5f3] sm:text-4xl">
            The first markets open soon.
          </h2>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-[#8a96a3]">
            Funding rates, borrow costs, gas and prices — cover on the numbers
            people are most exposed to, first.
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
