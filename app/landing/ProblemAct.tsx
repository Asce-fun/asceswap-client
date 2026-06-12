import { FadeUp } from "./FadeUp";

const pains = [
  {
    title: "Borrow APR spiked",
    stat: "9.8% → 14.2%",
    caption: "Aave USDC borrow cost, one volatile week.",
    points: "0,28 12,26 24,30 36,22 48,24 60,12 72,8",
  },
  {
    title: "Gas tripled overnight",
    stat: "18 → 61 gwei",
    caption: "One hyped mint, and every settlement got expensive.",
    points: "0,30 12,28 24,29 36,26 48,14 60,10 72,6",
  },
  {
    title: "Yield quietly decayed",
    stat: "5.1% → 3.4%",
    caption: "A vault's staking yield drifted down for two months.",
    points: "0,8 12,10 24,14 36,16 48,20 60,24 72,28",
  },
];

export function ProblemAct() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <h2 className="max-w-2xl font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
            Every onchain position lives on a rate.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-[#5c6b64]">
            Borrowing, staking, settling, farming — each one quietly depends on
            a number you don&apos;t control.
          </p>
        </FadeUp>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pains.map((pain, index) => (
            <FadeUp key={pain.title} delay={index * 0.12}>
              <div className="rounded-xl border border-[#cfe0d8] bg-white/60 p-6">
                <svg
                  viewBox="0 0 72 36"
                  className="h-9 w-full"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <polyline
                    points={pain.points}
                    stroke="#b4715a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-5 font-mono text-lg font-semibold text-[#9c5743]">
                  {pain.stat}
                </div>
                <h3 className="mt-2 text-base font-semibold text-[#0c1a15]">
                  {pain.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#5c6b64]">
                  {pain.caption}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
