import { CoverBoard } from "./CoverBoard";

export function HeroAct() {
  return (
    <section className="px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div>
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#8aa096]">
            PROTECTION FOR YOUR EXPOSURE AND VIEWS
          </p>
          <h1 className="mt-6 max-w-[11ch] text-[40px] font-semibold leading-[1.05] tracking-tight text-[#0c1a15] sm:text-[56px] lg:text-[64px]">
            Hedge any number.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#5c6b64] sm:text-lg">
            Funding rates, borrow costs, gas, prices — anything an oracle can
            read. Pay a premium once and cap what it can cost you.
          </p>
          <div className="mt-8">
            <a
              href="#waitlist"
              className="inline-block rounded-lg bg-[#059669] px-7 py-3.5 font-mono text-[12px] font-semibold tracking-[0.16em] text-white shadow-[0_10px_30px_rgba(5,150,105,0.22)] transition hover:bg-[#047857]"
            >
              GET EARLY ACCESS
            </a>
          </div>
        </div>

        <CoverBoard />
      </div>
    </section>
  );
}
