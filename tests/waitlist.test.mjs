import test from "node:test";
import assert from "node:assert/strict";
import { rmSync, mkdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const outDir = "/tmp/asceswap-client-waitlist-tests";
const storeFile = `${outDir}/waitlist.json`;

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
  "app/waitlist/store.ts",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (compile.status !== 0) {
  throw new Error("Waitlist store test compile failed.");
}

process.env.WAITLIST_FILE = storeFile;
delete process.env.WAITLIST_SHEET_URL;

const store = await import(pathToFileURL(`${outDir}/store.js`));

test("accepts well-formed addresses and rejects the rest", () => {
  assert.ok(store.isValidEmail("desk@fund.xyz"));
  assert.ok(store.isValidEmail("a.b+tag@sub.domain.io"));

  for (const invalid of ["", "nope", "no@domain", "no domain@x.com", "@x.com", "a@b.c"]) {
    assert.ok(!store.isValidEmail(invalid), `${invalid} should be rejected`);
  }
});

test("normalizes an address the way the route must before validating", () => {
  // The pattern rejects surrounding whitespace, so a pasted address with a
  // trailing space was turned away as invalid before it reached the store.
  assert.equal(store.normalizeEmail("  DESK@Fund.XYZ  "), "desk@fund.xyz");
  assert.equal(store.normalizeEmail("Treasury@Vault.io"), "treasury@vault.io");
});

test("rejects addresses that are not usable", () => {
  for (const invalid of ["", "   ", "nope", "no@domain", "a b@x.com", undefined, null, 42]) {
    assert.equal(store.normalizeEmail(invalid), null, `${String(invalid)} should be rejected`);
  }
});

test("saves an address once and reports repeats", async () => {
  assert.equal(await store.saveEmail("desk@fund.xyz"), "added");
  assert.equal(await store.saveEmail("desk@fund.xyz"), "exists");
});

test("normalizes case and surrounding whitespace before storing", async () => {
  assert.equal(await store.saveEmail("Treasury@Vault.io"), "added");
  assert.equal(await store.saveEmail("  treasury@vault.io  "), "exists");
});

test("keeps the exposure a signup names alongside their email", async () => {
  assert.equal(await store.saveEmail("basis@desk.xyz", "ETH perp funding"), "added");

  const entries = JSON.parse(await readFile(storeFile, "utf8"));
  const entry = entries.find((row) => row.email === "basis@desk.xyz");

  assert.equal(entry.exposure, "ETH perp funding");
});

test("treats blank or non-string exposure as absent", () => {
  assert.equal(store.normalizeExposure("   "), undefined);
  assert.equal(store.normalizeExposure(""), undefined);
  assert.equal(store.normalizeExposure(undefined), undefined);
  assert.equal(store.normalizeExposure(42), undefined);
  assert.equal(store.normalizeExposure("  gas  "), "gas");
});

test("caps a long exposure rather than storing unbounded text", () => {
  const capped = store.normalizeExposure("x".repeat(500));

  assert.equal(capped.length, store.MAX_EXPOSURE_LENGTH);
});
