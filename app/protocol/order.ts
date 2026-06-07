export type Hex = `0x${string}`;
export type Address = Hex;
export type Bytes32 = Hex;

export type ClaimSide = "residual" | "payoff";
export type Side = "buy" | "sell";
export type Outcome = "yes" | "no";

export type ApiOrder = Readonly<{
  salt: string;
  maker: Address;
  market_id: Bytes32;
  claim: ClaimSide;
  maker_amount: string;
  taker_amount: string;
  side: Side;
  expiration: string;
  epoch: string;
  max_fee_rate_bps: number;
}>;

export const WAD = 1_000_000_000_000_000_000n;

export const claimSideToContractValue: Record<ClaimSide, 0 | 1> = {
  residual: 0,
  payoff: 1,
};

export const sideToContractValue: Record<Side, 0 | 1> = {
  buy: 0,
  sell: 1,
};

export const outcomeToClaimSide: Record<Outcome, ClaimSide> = {
  yes: "payoff",
  no: "residual",
};

const UINT_256_MAX = (1n << 256n) - 1n;

export function isHex(value: string): value is Hex {
  return /^0x[0-9a-fA-F]*$/.test(value);
}

export function isAddress(value: string): value is Address {
  return /^0x[0-9a-fA-F]{40}$/.test(value);
}

export function isBytes32(value: string): value is Bytes32 {
  return /^0x[0-9a-fA-F]{64}$/.test(value);
}

export function parseDecimalToUnits(value: string, decimals = 18): bigint {
  const normalized = value.trim();

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error("Enter a positive decimal amount.");
  }

  const [whole, fraction = ""] = normalized.split(".");
  const paddedFraction = fraction.padEnd(decimals, "0").slice(0, decimals);
  const units = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(paddedFraction || "0");

  if (units <= 0n) {
    throw new Error("Order amount must be greater than zero.");
  }

  return units;
}

export function parseCentsLabelToPriceWad(priceLabel: string): bigint {
  const normalized = priceLabel.trim().replace(/c$/i, "");
  const centsWad = parseDecimalToUnits(normalized, 18);
  const priceWad = centsWad / 100n;

  if (priceWad <= 0n || priceWad > WAD) {
    throw new Error("Price must be between 0c and 100c.");
  }

  return priceWad;
}

export function deriveOrderAmounts(
  side: Side,
  priceWad: bigint,
  claimAmount: bigint,
): { makerAmount: bigint; takerAmount: bigint } {
  if (priceWad <= 0n || priceWad > WAD) {
    throw new Error("Price must be between 0 and 1 WAD.");
  }

  if (claimAmount <= 0n) {
    throw new Error("Claim amount must be greater than zero.");
  }

  const collateralAmount = side === "buy"
    ? mulDivRoundUp(claimAmount, priceWad, WAD)
    : (claimAmount * priceWad) / WAD;

  return side === "buy"
    ? { makerAmount: collateralAmount, takerAmount: claimAmount }
    : { makerAmount: claimAmount, takerAmount: collateralAmount };
}

export function deriveBuyClaimAmount(collateralAmount: bigint, priceWad: bigint): bigint {
  if (collateralAmount <= 0n) {
    throw new Error("Collateral amount must be greater than zero.");
  }

  if (priceWad <= 0n || priceWad > WAD) {
    throw new Error("Price must be between 0 and 1 WAD.");
  }

  const claimAmount = (collateralAmount * WAD) / priceWad;

  if (claimAmount <= 0n) {
    throw new Error("Order amount is too small for this price.");
  }

  return claimAmount;
}

export function makeUint256Salt(): string {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure browser randomness is unavailable.");
  }

  const words = new BigUint64Array(4);
  crypto.getRandomValues(words);
  const salt = words.reduce((accumulator, word) => (accumulator << 64n) + word, 0n);

  if (salt <= 0n || salt > UINT_256_MAX) {
    return makeUint256Salt();
  }

  return salt.toString();
}

export function marketIdToBytes32(marketId: string): Bytes32 {
  const bytes = new TextEncoder().encode(marketId);
  const hex = Array.from(bytes)
    .slice(0, 32)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .padEnd(64, "0");

  const value = `0x${hex}`;

  if (!isBytes32(value)) {
    throw new Error("Market id could not be encoded as bytes32.");
  }

  return value;
}

export function freezeOrder(order: ApiOrder): ApiOrder {
  return Object.freeze({ ...order });
}

function mulDivRoundUp(value: bigint, numerator: bigint, denominator: bigint): bigint {
  const product = value * numerator;
  return (product + denominator - 1n) / denominator;
}
