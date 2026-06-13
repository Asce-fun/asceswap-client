import test from "node:test";
import assert from "node:assert/strict";
import { rmSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const outDir = "/tmp/asceswap-client-markets-copy-tests";

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
  "app/markets/copy.ts",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (compile.status !== 0) {
  throw new Error("Markets copy test compile failed.");
}

const copy = await import(pathToFileURL(`${outDir}/copy.js`));

test("formats dollar and contract amounts for ticket copy", () => {
  assert.equal(copy.formatUsd(1234.5), "$1,234.50");
  assert.equal(copy.formatContracts(2500.125), "2,500.13");
});

test("explains buy outcomes from collateral and entry price", () => {
  assert.equal(
    copy.dealSentence({
      side: "buy",
      condition: "borrow APR finishes above 12%",
      amount: 50,
      priceLabel: "25c",
      entryPrice: 0.25,
    }),
    "Pay $50.00 now. If borrow APR finishes above 12%, you collect $200.00.",
  );
});

test("explains sell proceeds and suppresses invalid input", () => {
  const sentence = copy.dealSentence({
    side: "sell",
    condition: "borrow APR finishes above 12%",
    amount: 200,
    priceLabel: "25c",
    entryPrice: 0.25,
  });

  assert.ok(sentence.startsWith("Sell 200 contracts at 25c"));
  assert.ok(sentence.endsWith("you receive $50.00 now."));
  assert.equal(
    copy.dealSentence({
      side: "buy",
      condition: "borrow APR finishes above 12%",
      amount: 0,
      priceLabel: "25c",
      entryPrice: 0.25,
    }),
    "",
  );
});
