import { FadeUp } from "./FadeUp";
import { PositionTicket } from "./PositionTicket";

const clauses = [
  {
    title: "The collateral is escrowed before the market exists",
    body: "Maximum payout is funded at creation. The side that owes you has already posted it.",
  },
  {
    title: "There is no margin to call and no price to be liquidated at",
    body: "The payoff is bounded, so your position cannot be closed against your will.",
  },
  {
    title: "The oracle and the curve are published before you trade",
    body: "You can verify the market you are buying is the one you were quoted.",
  },
];

export function GuaranteeAct() {
  return (
    <section className="px-5 py-28 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)]">
          <FadeUp>
            <p className="font-mono text-[11px] tracking-[0.28em] text-[#8aa096]">
              THE GUARANTEE
            </p>
            <h2 className="mt-4 max-w-lg font-serif text-3xl leading-snug text-[#0c1a15] sm:text-4xl">
              A hedge that can be liquidated is not a hedge.
            </h2>
            <p className="mt-5 max-w-md leading-relaxed text-[#5c6b64]">
              Hedge a rate on margin and a move against you can close the position
              at precisely the moment it was supposed to pay. Full collateral costs
              more capital. That is the trade, and for protection it is the right
              one.
            </p>

            <dl className="mt-10 border-t border-[#bcd5c9]">
              {clauses.map((clause) => (
                <div key={clause.title} className="border-b border-[#bcd5c9] py-5">
                  <dt className="text-base font-semibold leading-snug text-[#0c1a15]">
                    {clause.title}
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-[#5c6b64]">
                    {clause.body}
                  </dd>
                </div>
              ))}
            </dl>
          </FadeUp>

          <FadeUp delay={0.1}>
            <PositionTicket />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
