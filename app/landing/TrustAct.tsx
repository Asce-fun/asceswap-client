import { FadeUp } from "./FadeUp";

const pillars = [
  {
    title: "Fully collateralized",
    body: "Every market is prefunded before it exists. The maximum payout is escrowed up front — solvent by construction.",
  },
  {
    title: "No liquidations",
    body: "Payoffs are bounded, so there are no margin calls, no forced closes, and no socialized losses. You can't lose more than you put in.",
  },
  {
    title: "Deterministic settlement",
    body: "An immutable payoff curve and a committed oracle methodology. Settlement is arithmetic, not a judgment call.",
  },
];

export function TrustAct() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <h2 className="max-w-2xl font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
            Why it&apos;s calm here.
          </h2>
        </FadeUp>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pillars.map((pillar, index) => (
            <FadeUp key={pillar.title} delay={index * 0.12}>
              <div className="h-full rounded-xl border border-[#bcd5c9] bg-[#f4faf7] p-6">
                <h3 className="text-lg font-semibold text-[#0c1a15]">
                  {pillar.title}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#41514a]">
                  {pillar.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={0.3}>
          <p className="mt-10 text-sm text-[#5c6b64]">
            Prefer the math?{" "}
            <a
              href="/Technical_Whitepaper.md"
              className="font-medium text-[#047857] underline decoration-[#9fcfba] underline-offset-4 transition hover:decoration-[#047857]"
            >
              Read the technical whitepaper
            </a>
            .
          </p>
        </FadeUp>
      </div>
    </section>
  );
}
