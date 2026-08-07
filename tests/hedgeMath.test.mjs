import test from "node:test";
import assert from "node:assert/strict";
import { rmSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const outDir = "/tmp/asceswap-client-landing-tests";

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const compile = spawnSync("./node_modules/.bin/tsc", [
  "--target",
  "ES2020",
  "--module",
  "CommonJS",
  "--moduleResolution",
  "node",
  "--esModuleInterop",
  "--skipLibCheck",
  "--outDir",
  outDir,
  "app/landing/hedgeMath.ts",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (compile.status !== 0) {
  throw new Error("Landing math test compile failed.");
}

const math = await import(pathToFileURL(`${outDir}/hedgeMath.js`));

const BORROW = math.BORROW_SCENARIO;
const PRICE = math.PRICE_SCENARIO;

/* Both scenarios must satisfy the same properties — that is the point of
   generalising the model, so every invariant is checked against each. */
for (const scenario of [BORROW, PRICE]) {
  const name = scenario.id;
  const step = (scenario.levelMax - scenario.levelMin) / 30;

  test(`${name}: clamps the level to the draggable range`, () => {
    assert.equal(math.clampLevel(-1e6, scenario), scenario.levelMin);
    assert.equal(math.clampLevel(1e6, scenario), scenario.levelMax);
    assert.equal(math.clampLevel(Number.NaN, scenario), scenario.defaultLevel);
  });

  test(`${name}: moving the level out of the money always lowers the premium`, () => {
    let previous = Infinity;

    for (let i = 0; i <= 30; i += 1) {
      // Out of the money means up for a cap, down for a floor.
      const level = scenario.kind === "cap"
        ? scenario.levelMin + i * step
        : scenario.levelMax - i * step;
      const premium = math.premiumFor(level, scenario);
      assert.ok(premium <= previous + 1e-9, `premium rose at level ${level}`);
      previous = premium;
    }
  });

  test(`${name}: maximum payout does not move with the level`, () => {
    assert.equal(
      math.maxPayout(scenario),
      scenario.scale * scenario.band,
    );
  });

  test(`${name}: cover pays nothing at the level and caps out at the bound`, () => {
    const level = scenario.defaultLevel;
    const bound = math.boundFor(level, scenario);
    const beyond = scenario.kind === "cap" ? bound + scenario.band : bound - scenario.band;

    assert.equal(math.payoutAt(level, level, scenario), 0);
    assert.ok(Math.abs(math.payoutAt(bound, level, scenario) - math.maxPayout(scenario)) < 1e-9);
    assert.ok(Math.abs(math.payoutAt(beyond, level, scenario) - math.maxPayout(scenario)) < 1e-9);
  });

  test(`${name}: outcome is flat across the covered band and slopes outside it`, () => {
    const level = scenario.defaultLevel;
    const bound = math.boundFor(level, scenario);
    const inside = (level + bound) / 2;

    const atLevel = math.hedgedAt(level, level, scenario);
    const atBound = math.hedgedAt(bound, level, scenario);
    const atInside = math.hedgedAt(inside, level, scenario);

    assert.ok(Math.abs(atLevel - atBound) < 1e-6, "band should be flat");
    assert.ok(Math.abs(atLevel - atInside) < 1e-6, "band should be flat throughout");

    // Past the far bound the cover is exhausted, so exposure resumes.
    const past = scenario.kind === "cap" ? bound + 1 * (scenario.band / 4) : bound - scenario.band / 4;
    const pastValue = math.hedgedAt(past, level, scenario);
    if (scenario.kind === "cap") {
      assert.ok(pastValue > atBound, "cost should rise again past the bound");
    } else {
      assert.ok(pastValue < atBound, "value should fall again past the bound");
    }
  });

  test(`${name}: settlement splits the escrowed collateral exactly`, () => {
    const level = scenario.defaultLevel;
    const bound = math.boundFor(level, scenario);
    const probes = [scenario.current, level, (level + bound) / 2, bound];

    for (const value of probes) {
      const s = math.settlementSummary(value, level, scenario);
      assert.ok(
        Math.abs(s.payout + s.residual - s.escrowed) < 1e-9,
        `payout + residual must equal escrowed at ${value}`,
      );
      assert.ok(s.payout >= 0 && s.residual >= 0);
    }
  });

  test(`${name}: converts values and x positions consistently`, () => {
    const width = 640;
    const probe = scenario.defaultLevel;

    assert.ok(
      Math.abs(math.xToValue(math.valueToX(probe, scenario, width), scenario, width) - probe) < 1e-6,
    );
    assert.ok(
      math.valueToX(scenario.domainMax, scenario, width) >
        math.valueToX(scenario.domainMin, scenario, width),
    );
  });
}

test("a cap nets cover off a cost; a floor adds it to a value", () => {
  // Borrow rate settling above the cap should make the hedge worth having.
  const capped = math.settlementSummary(7.4, 6.2, BORROW);
  assert.ok(capped.payout > 0);
  assert.ok(capped.hedged < capped.baseline, "cover should reduce realised cost");

  // ETH settling below the floor should hold the value up.
  const floored = math.settlementSummary(2200, 2400, PRICE);
  assert.ok(floored.payout > 0);
  assert.ok(floored.hedged > floored.baseline, "cover should lift realised value");
});

test("an unused hedge costs exactly the premium", () => {
  const s = math.settlementSummary(5, 6.2, BORROW);

  assert.equal(s.payout, 0);
  assert.ok(Math.abs(s.residual - s.escrowed) < 1e-9);
  assert.ok(Math.abs(s.hedged - (s.baseline + s.premium)) < 1e-9);
});

test("the borrow example still prices at the documented figures", () => {
  const s = math.settlementSummary(7.4, 6.2, BORROW);

  assert.equal(math.formatMoney(s.premium), "$148");
  assert.equal(math.formatMoney(s.payout), "$247");
  assert.equal(math.formatMoney(s.residual), "$164");
  assert.equal(math.formatMoney(s.escrowed), "$411");
});

test("formats money and rates for the readout", () => {
  assert.equal(math.formatMoney(147.9), "$148");
  assert.equal(math.formatMoney(1234.5), "$1,235");
  assert.equal(math.formatRate(6.25), "6.3%");
});
