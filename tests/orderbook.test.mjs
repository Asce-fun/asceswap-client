import test from "node:test";
import assert from "node:assert/strict";
import { rmSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const outDir = "/tmp/asceswap-client-orderbook-tests";

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
  "app/orderbook/client.ts",
  "app/orderbook/schemas.ts",
  "app/protocol/order.ts",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (compile.status !== 0) {
  throw new Error("Orderbook test compile failed.");
}

const clientModule = await import(pathToFileURL(`${outDir}/orderbook/client.js`));
const schemas = await import(pathToFileURL(`${outDir}/orderbook/schemas.js`));

const maker = "0x1111111111111111111111111111111111111111";
const marketId = `0x${"22".repeat(32)}`;
const orderHash = `0x${"33".repeat(32)}`;
const txHash = `0x${"55".repeat(32)}`;
const signature = `0x${"44".repeat(65)}`;

const order = {
  salt: "123456789",
  maker,
  market_id: marketId,
  claim: "payoff",
  maker_amount: "1000000",
  taker_amount: "2000000",
  side: "buy",
  expiration: "0",
  epoch: "1",
  max_fee_rate_bps: 100,
};

test("builds submit order request with production API validation defaults", () => {
  const originalDateNow = Date.now;
  Date.now = () => 1_780_000_000_999;

  try {
    const request = schemas.buildSubmitOrderRequest(order, signature);

    assert.equal(request.validation.now, 1_780_000_000);
    assert.equal("expected_order_hash" in request.validation, false);
    assert.equal(request.validation.maker_epoch, "1");
    assert.equal(request.validation.fee_rate_bps, 100);
    assert.equal(request.validation.signature, "unchecked");
    assert.equal(request.validation.require_signature, true);
    assert.equal(request.post_only, false);
    assert.equal(request.rest_on_no_match, true);
    assert.equal(request.reservation_ttl_secs, 300);
    assert.equal(request.signature_bytes, signature);
  } finally {
    Date.now = originalDateNow;
  }
});

test("posts signed orders and parses rested response", async () => {
  const calls = [];
  const client = new clientModule.OrderbookClient({
    baseUrl: "https://asceswap-orderbook-production.up.railway.app",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(JSON.stringify({
        outcome: "rested",
        order_hash: orderHash,
        resting_claim_amount: "2000000",
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  const response = await client.submitSignedOrder(order, signature, {
    postOnly: false,
    restOnNoMatch: true,
  });
  const body = JSON.parse(calls[0].init.body);

  assert.equal(calls[0].url, "https://asceswap-orderbook-production.up.railway.app/orders");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(body.order.market_id, marketId);
  assert.equal(body.order.claim, "payoff");
  assert.equal(body.order.side, "buy");
  assert.equal("expected_order_hash" in body.validation, false);
  assert.equal(body.post_only, false);
  assert.equal(body.rest_on_no_match, true);
  assert.equal(body.reservation_ttl_secs, 300);
  assert.deepEqual(response, {
    outcome: "rested",
    order_hash: orderHash,
    resting_claim_amount: "2000000",
  });
});

test("parses nested submit outcomes from backend response shape", () => {
  const response = schemas.parseSubmitOrderResponse({
    order_hash: orderHash,
    outcome: {
      type: "rejected",
      reason: "InvalidSignature",
    },
    events: [{
      sequence: 12,
      kind: "order.rejected",
      order_hash: orderHash,
      market_id: marketId,
    }],
  });

  assert.deepEqual(response, {
    outcome: "rejected",
    reason: "InvalidSignature",
    order_hash: orderHash,
  });
});

test("builds GET order query URLs with supported filters", async () => {
  const calls = [];
  const client = new clientModule.OrderbookClient({
    baseUrl: "https://example.test/api",
    fetcher: async (url, init) => {
      calls.push({ url: String(url), init });
      const path = new URL(String(url)).pathname;
      const body = path.endsWith("/events")
        ? { events: [] }
        : path.endsWith("/reservations")
          ? { reservations: [] }
          : { orders: [] };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    },
  });

  await client.getOrders({ maker, resting: true });
  await client.getMarketOrders(marketId, { resting: false });
  await client.getEvents({ fromSequence: 12, limit: 100 });
  await client.getReservations({ orderHash, limit: 10 });

  assert.equal(calls[0].url, `https://example.test/api/orders?maker=${maker}&resting=true`);
  assert.equal(calls[1].url, `https://example.test/api/markets/${marketId}/orders?resting=false`);
  assert.equal(calls[2].url, "https://example.test/api/events?from_sequence=12&limit=100");
  assert.equal(calls[3].url, `https://example.test/api/reservations?order_hash=${orderHash}&limit=10`);
});

test("parses order lists, reservation tx hashes, status responses, and event kind fields", () => {
  const orderList = schemas.parseOrderListResponse({
    orders: [{
      order_hash: orderHash,
      state: "rejected",
      order,
      remaining_claim_amount: "2000000",
    }],
  });
  const orderStatus = schemas.parseOrderStatusResponse({
    order_hash: orderHash,
    state: "rejected",
    order,
    remaining_claim_amount: "2000000",
  });
  const reservations = schemas.parseReservationListResponse({
    reservations: [{
      reservation_id: "reservation-1",
      order_hash: orderHash,
      market_id: marketId,
      tx_hash: txHash,
    }],
  });
  const event = schemas.parseApiEvent({
    sequence: 7,
    kind: "reservation_submitted",
    order_hash: orderHash,
    reservation_id: "reservation-1",
    market_id: marketId,
    tx_hash: txHash,
  });

  assert.equal(orderList.orders[0].order_hash, orderHash);
  assert.equal(orderList.orders[0].status, "rejected");
  assert.equal(orderList.orders[0].order.claim, "payoff");
  assert.equal(orderStatus.status, "rejected");
  assert.equal(orderStatus.order?.maker, maker);
  assert.equal(reservations.reservations[0].tx_hash, txHash);
  assert.equal(event.kind, "reservation_submitted");
  assert.equal(event.type, "reservation_submitted");
  assert.equal(event.tx_hash, txHash);
});
