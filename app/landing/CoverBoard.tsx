/**
 * The numbers you can buy cover on. Deliberately mixes rates, a gas price, an
 * asset price and a commodity — and shows floors alongside caps — because the
 * product is protection on any observable number, not a rates product.
 *
 * Static and deterministic. These are examples, not live quotes.
 */

const rows = [
  {
    name: "Aave USDC borrow",
    kind: "LENDING RATE",
    now: "5.4%",
    side: "CAP",
    level: "6.2%",
    premium: "$148",
    points: "0,22 10,20 20,23 30,17 40,14 50,9 60,7",
  },
  {
    name: "ETH perp funding",
    kind: "FUNDING RATE",
    now: "11.2%",
    side: "CAP",
    level: "14.0%",
    premium: "$392",
    points: "0,18 10,12 20,20 30,10 40,16 50,6 60,11",
  },
  {
    name: "Arbitrum gas",
    kind: "GAS PRICE",
    now: "0.020",
    side: "CAP",
    level: "0.030",
    premium: "$64",
    points: "0,20 10,19 20,21 30,15 40,17 50,11 60,13",
  },
  {
    name: "ETH price",
    kind: "ASSET PRICE",
    now: "$2,840",
    side: "FLOOR",
    level: "$2,400",
    premium: "$310",
    points: "0,8 10,12 20,9 30,15 40,13 50,19 60,17",
  },
  {
    name: "Henry Hub gas",
    kind: "COMMODITY",
    now: "$3.10",
    side: "CAP",
    level: "$4.00",
    premium: "$122",
    points: "0,21 10,17 20,19 30,13 40,15 50,10 60,8",
  },
];

export function CoverBoard() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#bcd5c9] bg-white/85 shadow-[0_14px_40px_rgba(64,86,74,0.09)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#cfe0d8] px-4 py-3">
        <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-[#5c6b64]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
          COVER ANY NUMBER
        </span>
        <span className="font-mono text-[10px] tracking-[0.16em] text-[#a8b8b0]">
          EXAMPLES
        </span>
      </div>

      <ul>
        {rows.map((row) => (
          <li key={row.name}>
            <a
              href="#waitlist"
              className="group/row relative flex items-center gap-3 border-b border-[#eaf2ee] py-3 pl-4 pr-3 transition-colors last:border-b-0 hover:bg-[#f4faf7] focus-visible:bg-[#f4faf7] focus-visible:outline-none sm:gap-4"
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-0 bg-[#059669] transition-transform duration-200 group-hover/row:scale-y-100 group-focus-visible/row:scale-y-100"
              />

              <svg
                viewBox="0 0 60 30"
                className="hidden h-7 w-14 shrink-0 sm:block"
                preserveAspectRatio="none"
                fill="none"
                aria-hidden="true"
              >
                <polyline
                  points={row.points}
                  stroke="#9fcfba"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors group-hover/row:stroke-[#059669]"
                />
              </svg>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[#0c1a15]">
                  {row.name}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] tracking-[0.14em] text-[#a8b8b0]">
                  {row.kind}
                </span>
              </span>

              <span className="hidden text-right sm:block">
                <span className="block font-mono text-[10px] tracking-[0.14em] text-[#a8b8b0]">
                  NOW
                </span>
                <span className="mt-0.5 block font-mono text-sm text-[#5c6b64] tabular-nums">
                  {row.now}
                </span>
              </span>

              <span className="shrink-0 rounded border border-[#cfe0d8] bg-[#f7fbf9] px-2 py-1 text-right">
                <span className="block font-mono text-[9px] tracking-[0.16em] text-[#8aa096]">
                  {row.side}
                </span>
                <span className="mt-0.5 block font-mono text-xs font-medium text-[#0c1a15] tabular-nums">
                  {row.level}
                </span>
              </span>

              <span className="w-[62px] shrink-0 text-right font-mono text-base font-semibold text-[#047857] tabular-nums">
                {row.premium}
              </span>

              <span
                aria-hidden="true"
                className="w-3 shrink-0 text-[#059669] opacity-0 transition-opacity group-hover/row:opacity-100 group-focus-visible/row:opacity-100"
              >
                →
              </span>
            </a>
          </li>
        ))}
      </ul>

      <div className="border-t border-[#cfe0d8] px-4 py-3 font-mono text-[10px] leading-relaxed tracking-[0.14em] text-[#a8b8b0]">
        PREMIUM IS THE MAXIMUM COST · CAP OR FLOOR, YOUR CHOICE
      </div>
    </div>
  );
}
