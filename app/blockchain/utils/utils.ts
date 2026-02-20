import { uint256 } from "starknet";

export const u256ToBigInt = (v: any): bigint =>
  uint256.uint256ToBN(v);

export const SwapSide = {
  Fixed: 0,
  Floating: 1,
};

export const MarketStatus = {
  Active: 0,
  Paused: 1,
};

/* ---------- basics ---------- */

export const feltToHexAddress = (v: bigint | string) =>
  "0x" + BigInt(v).toString(16);

export const u256ToNumber = (v: any, decimals = 0) =>
  Number(u256ToBigInt(v)) / 10 ** decimals;

export const feltToNumber = (v: any) =>
  Number(BigInt(v));

export const bpsToPct = (v: any) =>
  Number(v) / 100;

/* ---------- signed pnl ---------- */

export const signedValue = (v: {
  value: any;
  is_negative: any;
}) => {
  const n = Number(v.value);
  return Number(v.is_negative) === 1 ? -n : n;
};

export const cairoEnumToString = (e: any): string => {
  if (!e || !e.variant) return "UNKNOWN";

  const entry = Object.entries(e.variant).find(
    ([_, value]) => value !== undefined
  );

  return entry ? entry[0].toUpperCase() : "UNKNOWN";
};

/* ---------- oracle history ---------- */

export const compute24hChange = (
  history: { rateBps: number; timestamp: number }[],
  currentRateBps: number
): number => {
  if (!history || history.length === 0) return 0;
  // history is chronological (oldest first), so index 0 is ~24h ago
  const oldest = history[0];
  if (!oldest || oldest.rateBps === 0) return 0;
  return ((currentRateBps - oldest.rateBps) / oldest.rateBps) * 100;
};

export const compute7dRange = (
  history: { rateBps: number; timestamp: number }[]
): { minPct: number; maxPct: number } => {
  if (!history || history.length === 0) return { minPct: 0, maxPct: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const entry of history) {
    const pct = entry.rateBps / 100;
    if (pct < min) min = pct;
    if (pct > max) max = pct;
  }
  return { minPct: min, maxPct: max };
};

