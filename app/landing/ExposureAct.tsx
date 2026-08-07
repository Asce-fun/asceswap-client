import { FadeUp } from "./FadeUp";

const positions = [
  {
    statement: "My P&L is the funding rate.",
    role: "Basis desks",
    points: "0,10 12,8 24,14 36,12 48,20 60,26 72,30",
  },
  {
    statement: "I borrow at a floating rate.",
    role: "Loopers",
    points: "0,28 12,26 24,29 36,22 48,18 60,10 72,6",
  },
  {
    statement: "My burn moves with a price I don't set.",
    role: "Protocol treasuries",
    points: "0,8 12,11 24,13 36,17 48,19 60,24 72,28",
  },
];

export function ExposureAct() {
  return (
    <section className="px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <FadeUp>
          <p className="font-mono text-[11px] tracking-[0.28em] text-[#8aa096]">
            THE EXPOSURE
          </p>
          <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
            You already know which number hurts you.
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-10 border-t border-[#cfe0d8] pt-10 md:grid-cols-3 md:gap-0">
          {positions.map((position, index) => (
            <FadeUp key={position.statement} delay={index * 0.12}>
              <div className={index > 0 ? "md:border-l md:border-[#cfe0d8] md:pl-8" : "md:pr-8"}>
                <svg
                  viewBox="0 0 72 36"
                  className="h-10 w-24"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <polyline
                    points={position.points}
                    stroke="#b4715a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-6 font-serif text-2xl leading-snug text-[#0c1a15]">
                  {position.statement}
                </p>
                <div className="mt-3 font-mono text-[11px] tracking-[0.2em] text-[#8aa096]">
                  {position.role.toUpperCase()}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
