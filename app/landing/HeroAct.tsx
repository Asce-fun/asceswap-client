import { CoverBoard } from "./CoverBoard";
import { EarlyAccessButton } from "./EarlyAccessButton";

export function HeroAct() {
  return (
    <section className="px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-[0.28em] text-[#059669]">
            PROTECTION FOR YOUR EXPOSURE AND VIEWS
          </p>
          <h1 className="mt-6 font-serif text-[42px] leading-[1.12] text-[#0c1a15] sm:text-[58px] lg:text-[66px]">
            Hedge
            <br />
            <em className="text-[#4d7a68]">any number.</em>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#5c6b64] sm:text-lg">
            Funding rates, borrow costs, gas, prices — anything an oracle can
            read. Pay a premium once and cap what it can cost you.
          </p>
          <div className="mt-8">
            <EarlyAccessButton />
          </div>
        </div>

        <CoverBoard />
      </div>
    </section>
  );
}
