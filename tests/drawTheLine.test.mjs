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
  "app/landing/drawTheLineMath.ts",
], {
  cwd: process.cwd(),
  stdio: "inherit",
});

if (compile.status !== 0) {
  throw new Error("Landing math test compile failed.");
}

const math = await import(pathToFileURL(`${outDir}/drawTheLineMath.js`));

test("clamps cap values to the draggable range", () => {
  assert.equal(math.clampCap(-2), math.CAP_MIN);
  assert.equal(math.clampCap(12), math.CAP_MAX);
  assert.equal(math.clampCap(Number.NaN), math.DEFAULT_CAP);
});

test("converts cap values and chart y positions consistently", () => {
  const height = 320;
  const cap = 4.2;
  const y = math.capToY(cap, height);

  assert.equal(math.yToCap(y, height), cap);
  assert.ok(math.capToY(math.CAP_MAX, height) < math.capToY(math.CAP_MIN, height));
});

test("describes the selected hedge threshold", () => {
  assert.equal(
    math.coverageLabel(6.25),
    "If the rate finishes above 6.3%, your hedge pays.",
  );
});
