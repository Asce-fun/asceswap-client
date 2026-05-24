# AsceSwap Design Skill

Use this file as the design operating guide for AsceSwap client-v2. The goal is to avoid generic AI-generated UI and build a market interface that feels specific, data-rich, and credible.

## Product Frame

AsceSwap is a scalar payoff market interface.

Users trade exposure to observable numeric outcomes:

- rates
- prices
- gas fees
- yields
- volatility
- protocol metrics
- real-world benchmarks

Do not present AsceSwap as a generic swap app, DeFi dashboard, or marketing landing page. The first screen should feel like a live market surface.

## Design References

Study the structure, not the brand:

- Polymarket: market feed density, category navigation, featured market cards, right-side trending rail, compact card actions.
- Kalshi: event-contract trading clarity, order book credibility, price/depth language.
- TradingView: chart-first market detail pages, time controls, annotations, visible target lines.
- Robinhood event contracts: simple retail trading actions, approachable contract framing.
- IBM/Carbon data visualization: concise chart labels, controlled grid density, meaningful color.

## Homepage Structure

Preferred layout:

1. Header with AsceSwap brand, search, and minimal account action.
2. Horizontal category navigation:
   - Trending
   - Rates
   - Crypto
   - Gas
   - Yields
   - RWA
   - Protocol Metrics
   - Expiring Soon
3. Above-the-fold featured market area:
   - large chart card on the left
   - right rail for breaking/trending/high-volume markets
4. Below-the-fold market grid:
   - compact cards grouped by category or all markets
   - sort controls and filters

Avoid a giant hero. The product itself is the hero.

## Large Market Card

Every large market card must show the underlying scalar metric, not only market price.

Required content:

- market title
- category
- countdown timer
- current underlying value
- strike/cap/floor/target value
- dashed boundary line on the chart
- resolution type
- observation window
- maturity
- oracle/source label
- payoff type
- volume and liquidity
- buy/sell or long/short action

Chart requirements:

- Show the underlying metric as the primary line.
- Show strike/cap/floor/target as a dashed horizontal line.
- Annotate the current value near the latest point.
- Use subtle grid lines; do not over-label axes.
- Use direct labels where possible instead of a detached legend.
- Color should carry meaning:
  - Asce mint for primary positive/buy states.
  - Red for sell/down/risk states.
  - Amber for target/strike/reference lines.
  - Blue for neutral/current metric emphasis.

## Small Market Card

Every small market card should be scannable in under three seconds.

Required content:

- icon or category marker
- title
- countdown timer
- mini underlying chart or sparkline
- dashed strike/cap/floor/target marker
- current market price or implied payout
- resolution tag
- maturity
- volume
- quick action buttons

Do not create text-only cards for scalar markets. The user needs to see how the observed variable relates to the payoff boundary.

## Countdown Rules

Countdowns are mandatory for active markets.

Use compact formats:

- `03:40` for minutes and seconds
- `4h 12m` for intraday
- `2d 6h` for multi-day
- `Jun 30` only when far away and countdown is less useful

Sorting:

- `Expiring Soon` sorts by lowest remaining time.
- Featured urgent markets can surface when the countdown is below a meaningful threshold.
- Avoid noisy ticking across the entire page. Animate only critical countdowns or update quietly.

## Scalar Market Vocabulary

Use consistent settlement language.

Resolution tags:

- `Spot`: value at maturity.
- `TWA`: time-weighted average over an observation window.
- `TWAP`: time-weighted average price over an observation window.
- `Cumulative`: total over the window, useful for fees, revenue, or volume.
- `Max`: highest observed value during the window.
- `Min`: lowest observed value during the window.
- `Range`: payoff depends on the final or average value landing within a band.

Payoff tags:

- `Cap`
- `Floor`
- `Above`
- `Below`
- `Range`
- `Linear`
- `Binary`

Action labels:

- Rate caps: `Buy Cap`, `Sell Cap`
- Yield floors: `Buy Floor`, `Sell Floor`
- Threshold markets: `Above`, `Below`
- Directional markets: `Long`, `Short`
- Binary markets: `Yes`, `No`

Pick action labels based on market type. Do not force every market into Yes/No.

## Market Detail Page

The market detail page should resemble a trading screen.

Primary layout:

- left/main: large interactive chart
- right: order ticket
- lower section: order book, market rules, activity, positions
- optional right rail: related markets or expiring markets

Chart must show:

- current underlying value
- target/strike/cap/floor line
- historical metric path
- observation window
- market price overlay only if it does not confuse the underlying metric

Order ticket must show:

- selected side
- price
- quantity
- estimated cost
- max payout
- break-even or payoff explanation
- settlement summary

## Visual Style

Target feel:

- serious
- dense but readable
- exchange-like
- modern but not decorative
- high-trust
- chart-forward

Avoid:

- oversized marketing hero sections
- generic gradient glow cards
- fake-looking charts
- decorative orbs/blobs
- excessive empty space
- one-note green theme
- vague copy like "Trade anything"
- UI text explaining obvious controls

Preferred palette direction:

- background: near-black charcoal
- surfaces: layered neutral panels
- borders: low-contrast cool grey
- primary accent: Asce mint
- secondary accent: market blue
- target/strike: amber
- negative/sell: red

Use Asce mint sparingly. It should identify the brand and primary action, not flood the whole interface.

## Typography And Density

Use compact financial-product typography.

- Do not use hero-scale text inside cards.
- Use tabular/monospace numerals for prices, rates, countdowns, and sizes.
- Keep headings specific and short.
- Keep card titles readable but compact.
- Avoid negative letter spacing.
- Prefer 8px radii or smaller for market cards and controls.

## AI Design Prompt Template

Use this structure before generating or implementing a new screen:

```text
Task:
Design [screen/component] for AsceSwap, a scalar payoff market interface.

Context:
The user is browsing/trading markets on observable numeric outcomes such as rates, gas fees, BTC price, yields, and protocol metrics. The UI should feel like a live market product, inspired by Polymarket/Kalshi/TradingView structure but branded as AsceSwap.

Elements:
- [list required sections]
- [list required market data fields]
- [list required chart annotations]
- [list required actions and states]

Behavior:
- Cards show countdowns and sort by relevance.
- Charts show underlying metric plus dashed target/strike/cap/floor line.
- Resolution tags are visible: Spot, TWA, TWAP, Cumulative, Max, Min, Range.
- Trade actions adapt to payoff type.

Constraints:
- No generic hero landing page.
- No decorative blobs/orbs.
- No text-only scalar market cards.
- No fake chart decoration without market meaning.
- Use Asce mint sparingly.
- Keep the interface dense, readable, and professional.
- Support desktop and mobile without overlapping text.
```

## Quality Checklist

Before accepting a design:

- Does the first screen look like a real market product?
- Can a user identify what variable is being traded?
- Can a user see the current value and target boundary?
- Is the resolution method visible?
- Is time to maturity visible?
- Are actions appropriate for the payoff type?
- Are charts informative rather than decorative?
- Are volume/liquidity/price shown where trading confidence needs them?
- Is the screen visually dense without becoming cluttered?
- Does it avoid generic AI-generated landing-page patterns?

## Source Notes

- Figma prompt structure: Task, Context, Elements, Behavior, Constraints.
- Figma Guidelines.md pattern: keep AI rules concise, explicit, and scoped.
- IBM data visualization guidance: concise labels, direct chart labeling, meaningful color, controlled grid density.
- Polymarket/Kalshi market structure: market price, bid/ask liquidity, order book, settlement clarity.
- TradingView chart layout: chart as the central decision surface.
