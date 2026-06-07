import test from "node:test";
import assert from "node:assert/strict";
import { rmSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const outDir = "/tmp/asceswap-client-protocol-tests";

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
  "app/protocol/order.ts",
  "app/protocol/eip712.ts",
  "app/trading/buildOrder.ts",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (compile.status !== 0) {
  throw new Error("Protocol test compile failed.");
}

const orderModule = await import(pathToFileURL(`${outDir}/protocol/order.js`));
const eip712Module = await import(pathToFileURL(`${outDir}/protocol/eip712.js`));
const buildOrderModule = await import(pathToFileURL(`${outDir}/trading/buildOrder.js`));

const {
  WAD,
  deriveOrderAmounts,
  outcomeToClaimSide,
  parseCentsLabelToPriceWad,
  parseDecimalToUnits,
} = orderModule;
const { buildOrderTypedData } = eip712Module;
const { buildBuyOrderFromCollateral } = buildOrderModule;

const maker = "0x1111111111111111111111111111111111111111";
const exchange = "0x2222222222222222222222222222222222222222";

test("derives BUY and SELL amounts with bigint price math", () => {
  const priceWad = parseCentsLabelToPriceWad("34c");
  const claimAmount = 100n * WAD;

  assert.deepEqual(deriveOrderAmounts("buy", priceWad, claimAmount), {
    makerAmount: 34n * WAD,
    takerAmount: claimAmount,
  });
  assert.deepEqual(deriveOrderAmounts("sell", priceWad, claimAmount), {
    makerAmount: claimAmount,
    takerAmount: 34n * WAD,
  });
});

test("maps prediction UI outcomes to contract claim sides", () => {
  assert.equal(outcomeToClaimSide.yes, "payoff");
  assert.equal(outcomeToClaimSide.no, "residual");
});

test("builds immutable canonical buy order from collateral", () => {
  const order = buildBuyOrderFromCollateral({
    maker,
    marketId: "aave-usdc-borrow-cap",
    outcome: "yes",
    priceWad: parseCentsLabelToPriceWad("25c"),
    collateralAmount: parseDecimalToUnits("50", 18),
    expiration: 1_800_000_000n,
    epoch: 0n,
    maxFeeRateBps: 50,
    salt: 123n,
  });

  assert.equal(Object.isFrozen(order), true);
  assert.equal(order.side, "buy");
  assert.equal(order.claim, "payoff");
  assert.equal(order.maker_amount, "50000000000000000000");
  assert.equal(order.taker_amount, "200000000000000000000");
  assert.match(order.market_id, /^0x[0-9a-f]{64}$/);
});

test("builds EIP-712 typed data with contract casing only", () => {
  const order = buildBuyOrderFromCollateral({
    maker,
    marketId: "aave-usdc-borrow-cap",
    outcome: "yes",
    priceWad: parseCentsLabelToPriceWad("50c"),
    collateralAmount: parseDecimalToUnits("10", 18),
    expiration: 1_800_000_000n,
    epoch: 2n,
    maxFeeRateBps: 25,
    salt: 456n,
  });
  const typedData = buildOrderTypedData(order, {
    name: "AsceSwap",
    version: "1",
    chainId: 1,
    verifyingContract: exchange,
  });

  assert.equal(typedData.message.marketId, order.market_id);
  assert.equal(typedData.message.makerAmount, order.maker_amount);
  assert.equal(typedData.message.takerAmount, order.taker_amount);
  assert.equal(typedData.message.maxFeeRateBps, 25);
  assert.equal("market_id" in typedData.message, false);
  assert.equal("maker_amount" in typedData.message, false);
  assert.equal("max_fee_rate_bps" in typedData.message, false);
});
