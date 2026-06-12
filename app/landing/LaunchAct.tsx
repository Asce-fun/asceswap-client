import Link from "next/link";

import { FadeUp } from "./FadeUp";

export function LaunchAct() {
  return (
    <section className="px-5 pb-12 pt-24 sm:px-8">
      <div className="mx-auto max-w-6xl text-center">
        <FadeUp>
          <h2 className="font-serif text-4xl text-[#f2f5f3] sm:text-5xl">
            The markets are open.
          </h2>
          <p className="mt-4 text-[#8a96a3]">
            Pick a rate. Draw your line. Settle by oracle.
          </p>
          <Link
            href="/markets"
            className="mt-9 inline-block rounded-lg bg-[#2ee59d] px-8 py-3.5 text-sm font-bold text-[#04231a] transition hover:bg-[#6fdcb4]"
          >
            Launch app
          </Link>
        </FadeUp>

        <footer className="mt-24 flex flex-wrap items-center justify-between gap-3 border-t border-[#15231f] pt-8 text-sm text-[#66756f]">
          <span>© 2026 AsceSwap</span>
          <a
            href="/Technical_Whitepaper.md"
            className="transition hover:text-[#d7ddd9]"
          >
            Technical whitepaper
          </a>
        </footer>
      </div>
    </section>
  );
}
