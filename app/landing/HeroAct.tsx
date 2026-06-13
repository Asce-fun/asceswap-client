import Link from "next/link";

import { FloatingLogoField } from "./FloatingLogoField";

// One 600-unit segment, repeated at x=600 so the 200%-wide svg loops
// seamlessly with the .rate-drift (-50%) animation.
const SEGMENT =
  "M0 96 C 40 78, 80 118, 130 92 S 230 110, 290 84 S 390 116, 450 92 S 550 74, 600 96";

export function HeroAct() {
  return (
    <section className="relative overflow-hidden px-5 pb-28 pt-36 sm:px-8 sm:pt-44">
      <FloatingLogoField />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-56 opacity-70"
      >
        <svg
          className="rate-drift absolute bottom-4 left-0 h-44 w-[200%]"
          viewBox="0 0 1200 192"
          preserveAspectRatio="none"
          fill="none"
        >
          <path d={SEGMENT} stroke="#059669" strokeOpacity="0.3" strokeWidth="2" />
          <path
            d={SEGMENT}
            transform="translate(600 0)"
            stroke="#059669"
            strokeOpacity="0.3"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="relative mx-auto max-w-6xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#059669]">
          Programmable rate markets
        </p>
        <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.12] text-[#0c1a15] sm:text-6xl">
          Rates move.
          <br />
          <em className="text-[#4d7a68]">Your costs don&apos;t have to.</em>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#5c6b64] sm:text-lg">
          Hedge borrow rates, gas fees, and yields with fully collateralized
          markets. No margin calls. No liquidations. Ever.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link
            href="/markets"
            className="rounded-lg bg-[#059669] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(5,150,105,0.25)] transition hover:bg-[#047857]"
          >
            Start hedging
          </Link>
          <a
            href="#how-it-works"
            className="rounded-lg border border-[#cfe0d8] bg-white/70 px-6 py-3 text-sm font-semibold text-[#41514a] transition hover:border-[#059669]/40 hover:text-[#0c1a15]"
          >
            How it works
          </a>
        </div>
      </div>
    </section>
  );
}
