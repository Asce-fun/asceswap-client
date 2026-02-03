import { uint256 } from "starknet";

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
  oracleAddress,
  pairId,
  side,
  notional,
  collateral,
  maxRateBps,
  decimals,
}: {
  tokenAddress: string;
  asceSwapAddress: string;
  oracleAddress: string;
  pairId: string; // felt252
  side: "FIXED" | "FLOATING";
  notional: number;
  collateral: number;
  maxRateBps: number;
  decimals: number;
}) {
  /* -------- wallet -------- */
  const starknet = (window as any).starknet;

  if (!starknet) {
    throw new Error("Starknet wallet not found. Please install Braavos or Argent X.");
  }

  // Make sure wallet is connected and enabled
  if (!starknet.isConnected) {
    await starknet.enable({ starknetVersion: "v5" });
  }

  // Wait a bit for the account to be ready
  await new Promise(resolve => setTimeout(resolve, 100));

  const account = starknet.account;

  if (!account || !account.address) {
    throw new Error("Wallet account not available. Please connect your wallet.");
  }

  /* -------- enum (DO NOT TOUCH) -------- */
  const sideValue = side === "FIXED" ? "0" : "1";

  /* -------- amounts -------- */
  const notionalArr = toU256ArrayFromDecimal(notional, decimals);
  const collateralArr = toU256ArrayFromDecimal(collateral, decimals);
  const maxRateArr = toU256Array(maxRateBps);

  /* -------- 🔥 ORACLE FIX --------
     IMPORTANT:
     - NEVER use Date.now()
     - Use chain timestamp to avoid u64 overflow
  */
  const block = await account.getBlock("latest");
  const chainTimestamp = Number(block.timestamp);

  // Same rate as tests (5% = 500 bps)
  const oracleRateArr = toU256Array(500);

  /* -------- multicall -------- */
  const calls = [
    // 0️⃣ refresh oracle (fixes ORACLE STALE + u64 overflow)
    {
      contractAddress: oracleAddress,
      entrypoint: "set_rate",
      calldata: [
        ...oracleRateArr,            // u256 rate
        chainTimestamp.toString(),   // u64 timestamp (SAFE)
      ],
    },

    // 1️⃣ approve collateral
    {
      contractAddress: tokenAddress,
      entrypoint: "approve",
      calldata: [
        asceSwapAddress,
        ...collateralArr,
      ],
    },

    // 2️⃣ buy swap
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

  const tx = await account.execute(calls);
  return tx.transaction_hash;
}
