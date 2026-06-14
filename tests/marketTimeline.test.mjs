import test from "node:test";
import assert from "node:assert/strict";
import { rmSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const outDir = "/tmp/asceswap-client-market-timeline-tests";

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
  "app/markets/timeline.ts",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (compile.status !== 0) {
  throw new Error("Market timeline test compile failed.");
}

const timeline = await import(pathToFileURL(`${outDir}/timeline.js`));

const market = {
  startTimestamp: 1_781_345_978,
  endTimestamp: 1_783_937_978,
};

test("counts down to market open before the start timestamp", () => {
  const state = timeline.getMarketTimeline(market, (market.startTimestamp - 90) * 1000);

  assert.equal(state.phase, "upcoming");
  assert.equal(state.status, "Opening");
  assert.equal(state.targetTimestamp, market.startTimestamp);
  assert.equal(state.remainingSeconds, 90);
});

test("counts down to market stop while live", () => {
  const state = timeline.getMarketTimeline(market, (market.startTimestamp + 120) * 1000);

  assert.equal(state.phase, "live");
  assert.equal(state.status, "Live");
  assert.equal(state.targetTimestamp, market.endTimestamp);
  assert.equal(state.remainingSeconds, market.endTimestamp - market.startTimestamp - 120);
  assert.equal(state.elapsedSeconds, 120);
});

test("marks market as closing soon inside the last day", () => {
  const state = timeline.getMarketTimeline(market, (market.endTimestamp - 3600) * 1000);

  assert.equal(state.phase, "live");
  assert.equal(state.status, "Closing soon");
  assert.equal(state.remainingSeconds, 3600);
});

test("marks market ended at or after stop", () => {
  const state = timeline.getMarketTimeline(market, market.endTimestamp * 1000);

  assert.equal(state.phase, "ended");
  assert.equal(state.status, "Settles soon");
  assert.equal(state.remainingSeconds, 0);
  assert.equal(state.elapsedSeconds, state.totalSeconds);
});

test("formats countdowns and UTC market dates", () => {
  assert.equal(timeline.formatCountdown(90_061), "1d 01:01:01");
  assert.equal(timeline.formatCountdown(59), "00:00:59");
  assert.equal(timeline.formatMarketDate(market.endTimestamp), "Jul 13, 2026");
});
