import { uint256 } from "starknet";
import type { StarknetAccount } from "../../utils/getStarknetAccount";

/* -------------------- helpers -------------------- */

function toU256ArrayFromDecimal(amount: number, decimals: number): string[] {
  const v = BigInt(Math.round(amount * 10 ** decimals));
  const u = uint256.bnToUint256(v);
  return [u.low.toString(), u.high.toString()];
}

function toU256Array(value: number): string[] {
  const u = uint256.bnToUint256(BigInt(value));
  return [u.low.toString(), u.high.toString()];
}

/* -------------------- main -------------------- */

export async function approveAndBuySwap({
  tokenAddress,
  asceSwapAddress,
  pairId,
  side,
  notional,
  collateral,
  maxRateBps,
  decimals,
  account,
}: {
  tokenAddress: string;
  asceSwapAddress: string;
  pairId: string; // felt252
  side: "FIXED" | "FLOATING";
  notional: number;
  collateral: number;      // total deposit (margin + fee) — used for both approve and buy_swap
  maxRateBps: number;
  decimals: number;
  account: StarknetAccount;
}) {

  /* -------- enum (DO NOT TOUCH) -------- */
  const sideValue = side === "FIXED" ? "0" : "1";

  /* -------- amounts -------- */
  const notionalArr = toU256ArrayFromDecimal(notional, decimals);
  const collateralArr = toU256ArrayFromDecimal(collateral, decimals);
  const maxRateArr = toU256Array(maxRateBps);

  /* -------- multicall -------- */
  const calls = [
    // 1️⃣ approve collateral (total deposit the contract will pull)
    {
      contractAddress: tokenAddress,
      entrypoint: "approve",
      calldata: [
        asceSwapAddress,
        ...collateralArr,
      ],
    },

    // 2️⃣ buy swap (collateral = total deposit, contract deducts fee internally)
    {
      contractAddress: asceSwapAddress,
      entrypoint: "buy_swap",
      calldata: [
        pairId,
        sideValue,
        ...notionalArr,
        ...collateralArr,
        ...maxRateArr,
      ],
    },
  ];

  console.log("[approveAndBuySwap] wallet address:", account.address);
  console.log("[approveAndBuySwap] calls:", JSON.stringify(calls, null, 2));

  const tx = await account.execute(calls);
  return tx.transaction_hash;
}
