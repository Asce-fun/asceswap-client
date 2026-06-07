import { WAD } from "./order";

export function formatUnits(value: bigint, decimals = 18, maxFractionDigits = 6) {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;
  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = absolute % base;

  if (fraction === 0n || maxFractionDigits === 0) {
    return `${sign}${whole.toString()}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, maxFractionDigits)
    .replace(/0+$/, "");

  return fractionText ? `${sign}${whole.toString()}.${fractionText}` : `${sign}${whole.toString()}`;
}

export function bpsToWad(bps: bigint) {
  return (bps * WAD) / 10_000n;
}

export function applySlippage(priceWad: bigint, slippageBps: bigint, direction: "up" | "down") {
  const delta = (priceWad * slippageBps) / 10_000n;
  return direction === "up" ? priceWad + delta : priceWad - delta;
}

export function priceWadToCentsLabel(priceWad: bigint) {
  const cents = (priceWad * 100n * 10_000n) / WAD;
  const whole = cents / 10_000n;
  const fraction = (cents % 10_000n).toString().padStart(4, "0").replace(/0+$/, "");

  return `${whole.toString()}${fraction ? `.${fraction}` : ""}c`;
}

export function ratioWad(numerator: bigint, denominator: bigint) {
  if (denominator <= 0n) {
    throw new Error("Cannot divide by zero.");
  }

  return (numerator * WAD) / denominator;
}
