import { FadeUp } from "./FadeUp";
import { markets } from "../markets/data";

function PreviewCard({ marketIndex }: { marketIndex: number }) {
  const market = markets[marketIndex];
  const Icon = market.icon;

  return (
    <div className="w-72 shrink-0 rounded-[10px] border border-[#1b2d28] bg-[#070d0d] p-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#15231f] bg-[#0a1211]">
          <Icon className="h-4 w-4" style={{ color: market.iconTone }} />
        </div>
        <span className="line-clamp-1 text-sm font-semibold text-[#f2f5f3]">
          {market.title}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md border border-[#2ee59d]/30 bg-[rgba(18,48,38,0.6)] py-1.5">
          <span className="block text-[10px] font-semibold text-[#72e6b8]">
            YES
          </span>
          <span className="font-mono text-sm font-semibold text-[#f2f5f3]">
            {market.primaryPrice}
          </span>
        </div>
        <div className="rounded-md border border-[#ff5c7a]/25 bg-[rgba(37,21,26,0.6)] py-1.5">
          <span className="block text-[10px] font-semibold text-[#ff9cad]">
            NO
          </span>
          <span className="font-mono text-sm font-semibold text-[#f2f5f3]">
            {market.secondaryPrice}
          </span>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[#66756f]">
        <span>{market.categoryLabel}</span>
        <span className="font-mono">{market.volume} vol</span>
      </div>
    </div>
  );
}

export function MarketsPreviewAct() {
  const indices = markets.map((_, index) => index);

  return (
    <section className="overflow-hidden py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <FadeUp>
          <h2 className="max-w-2xl font-serif text-3xl leading-snug text-[#f2f5f3] sm:text-4xl">
            Markets are live right now.
          </h2>
          <p className="mt-4 max-w-xl leading-relaxed text-[#8a96a3]">
            Real boundaries on real rates — gas, borrow costs, yields, and
            more, each one fully collateralized.
          </p>
        </FadeUp>
      </div>

      <div className="mt-12">
        <div className="marquee-drift flex w-max gap-4 pl-5">
          {indices.map((index) => (
            <PreviewCard key={`a-${index}`} marketIndex={index} />
          ))}
          <div aria-hidden="true" className="flex gap-4">
            {indices.map((index) => (
              <PreviewCard key={`b-${index}`} marketIndex={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
