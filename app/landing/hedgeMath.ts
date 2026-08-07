// Worked-example economics for the landing page.
//
// Generic over the number being covered: a cap protects you when the number
// rises (a cost you pay), a floor protects you when it falls (a value you
// hold). The two are mirror images, so one set of functions serves both.
//
// These are illustrative, not live quotes. The model only has to be
// transparent and monotonic: moving the level further out of the money must
// always lower the premium, because that is the trade-off being taught.

export type CoverKind = "cap" | "floor";

export type Scenario = Readonly<{
  id: string;
  /** Short label for the scenario switcher. */
  tab: string;
  kind: CoverKind;
  /** Mono strip above the readouts. */
  header: string;
  /** Where the number sits today. */
  current: number;
  /** Draggable bounds for the protection level. */
  levelMin: number;
  levelMax: number;
  defaultLevel: number;
  /** Width of the covered band, in units of the number. */
  band: number;
  /** Plot domain. */
  domainMin: number;
  domainMax: number;
  ticks: readonly number[];
  /** Money per one unit of the number. */
  scale: number;
  /** Price-of-cover curve, per $1 of cover. */
  atTheMoney: number;
  decayPerUnit: number;
  priceFloor: number;
  priceCeiling: number;
  /** Labels. */
  levelLabel: string;
  boundLabel: string;
  baselineLabel: string;
  hedgedLabel: string;
  outcomeLabel: string;
  termDays: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatScenarioValue(value: number, scenario: Scenario): string {
  return scenario.kind === "cap" && scenario.id === "borrow"
    ? formatRate(value)
    : formatMoney(value);
}

/* ── Scenarios ─────────────────────────────────────────────────────────── */

export const BORROW_SCENARIO: Scenario = {
  id: "borrow",
  tab: "Borrow rate",
  kind: "cap",
  header: "$250,000 BORROWED · NOW 5.4%",
  current: 5.4,
  levelMin: 5,
  levelMax: 8,
  defaultLevel: 6.2,
  band: 2,
  domainMin: 4.5,
  domainMax: 8.5,
  ticks: [5, 6, 7, 8],
  // $250,000 over 30/365 of a year, per percentage point.
  scale: (250_000 / 100) * (30 / 365),
  atTheMoney: 0.52,
  decayPerUnit: 0.2,
  priceFloor: 0.06,
  priceCeiling: 0.6,
  levelLabel: "CAP",
  boundLabel: "COVERED TO",
  baselineLabel: "UNHEDGED COST",
  hedgedLabel: "COST WITH COVER",
  outcomeLabel: "YOUR COST",
  termDays: 30,
};

export const PRICE_SCENARIO: Scenario = {
  id: "price",
  tab: "ETH price",
  kind: "floor",
  header: "100 ETH HELD · NOW $2,840",
  current: 2840,
  levelMin: 2200,
  levelMax: 2800,
  defaultLevel: 2400,
  band: 400,
  domainMin: 1900,
  domainMax: 3200,
  ticks: [2000, 2400, 2800, 3200],
  // 100 ETH, so a $1 move in price is $100 of exposure.
  scale: 100,
  atTheMoney: 0.24,
  decayPerUnit: 0.0003,
  priceFloor: 0.05,
  priceCeiling: 0.6,
  levelLabel: "FLOOR",
  boundLabel: "COVERED DOWN TO",
  baselineLabel: "UNPROTECTED VALUE",
  hedgedLabel: "VALUE WITH COVER",
  outcomeLabel: "YOUR HOLDING",
  termDays: 30,
};

export const SCENARIOS = [BORROW_SCENARIO, PRICE_SCENARIO] as const;

/* ── Economics ─────────────────────────────────────────────────────────── */

export function clampLevel(value: number, scenario: Scenario): number {
  if (!Number.isFinite(value)) return scenario.defaultLevel;
  return clamp(value, scenario.levelMin, scenario.levelMax);
}

/** The far edge of the covered band — where cover stops growing. */
export function boundFor(level: number, scenario: Scenario): number {
  return scenario.kind === "cap" ? level + scenario.band : level - scenario.band;
}

/** The most cover can ever pay. Constant across the drag range. */
export function maxPayout(scenario: Scenario): number {
  return scenario.scale * scenario.band;
}

/** How far out of the money the chosen level sits. */
export function moneyness(level: number, scenario: Scenario): number {
  const clamped = clampLevel(level, scenario);
  return scenario.kind === "cap"
    ? clamped - scenario.current
    : scenario.current - clamped;
}

/** Price per $1 of cover. Falls as the level moves further out of the money. */
export function premiumRate(level: number, scenario: Scenario): number {
  return clamp(
    scenario.atTheMoney - scenario.decayPerUnit * moneyness(level, scenario),
    scenario.priceFloor,
    scenario.priceCeiling,
  );
}

export function premiumFor(level: number, scenario: Scenario): number {
  return maxPayout(scenario) * premiumRate(level, scenario);
}

/** What cover pays if the number settles at `value`. */
export function payoutAt(value: number, level: number, scenario: Scenario): number {
  const clamped = clampLevel(level, scenario);
  const excess = scenario.kind === "cap" ? value - clamped : clamped - value;
  return scenario.scale * clamp(excess, 0, scenario.band);
}

/** Cost or holding value with no cover in place. */
export function baselineAt(value: number, scenario: Scenario): number {
  return scenario.scale * value;
}

/**
 * With cover: flat across the covered band, sloping outside it. A cap nets the
 * payout off a cost; a floor adds it to a value. Both pay the premium.
 */
export function hedgedAt(value: number, level: number, scenario: Scenario): number {
  const payout = payoutAt(value, level, scenario);
  const premium = premiumFor(level, scenario);

  return scenario.kind === "cap"
    ? baselineAt(value, scenario) - payout + premium
    : baselineAt(value, scenario) + payout - premium;
}

export type Settlement = Readonly<{
  premium: number;
  payout: number;
  residual: number;
  escrowed: number;
  net: number;
  baseline: number;
  hedged: number;
}>;

/**
 * A settled market, priced end to end. Payout and residual always sum to the
 * escrowed collateral — that invariant is the whole solvency argument, so it
 * is computed here rather than written into the artifact by hand.
 */
export function settlementSummary(
  settledValue: number,
  level: number,
  scenario: Scenario = BORROW_SCENARIO,
): Settlement {
  const premium = premiumFor(level, scenario);
  const payout = payoutAt(settledValue, level, scenario);
  const escrowed = maxPayout(scenario);

  return {
    premium,
    payout,
    residual: escrowed - payout,
    escrowed,
    net: payout - premium,
    baseline: baselineAt(settledValue, scenario),
    hedged: hedgedAt(settledValue, level, scenario),
  };
}

/* ── Plot geometry ─────────────────────────────────────────────────────── */

export function valueToX(
  value: number,
  scenario: Scenario,
  width: number,
  padLeft = 0,
  padRight = 0,
): number {
  const usable = width - padLeft - padRight;
  const fraction = (value - scenario.domainMin) / (scenario.domainMax - scenario.domainMin);
  return padLeft + clamp(fraction, 0, 1) * usable;
}

export function xToValue(
  x: number,
  scenario: Scenario,
  width: number,
  padLeft = 0,
  padRight = 0,
): number {
  const usable = width - padLeft - padRight;
  if (usable <= 0) return scenario.defaultLevel;
  return (
    scenario.domainMin +
    ((x - padLeft) / usable) * (scenario.domainMax - scenario.domainMin)
  );
}

export function costToY(
  cost: number,
  height: number,
  minCost: number,
  maxCost: number,
  padTop = 0,
  padBottom = 0,
): number {
  const usable = height - padTop - padBottom;
  const span = Math.max(maxCost - minCost, 1);
  return padTop + (1 - (cost - minCost) / span) * usable;
}
