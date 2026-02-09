// earlyExitSwap.ts

import { Contract, uint256, Account } from "starknet";
import AsceSwapABI from "../../abis/AsceSwap.json";
import { Wallet } from "@dynamic-labs/sdk-react-core";

function toU256(value: number) {
  return uint256.bnToUint256(BigInt(value));
}

function toU256Array(value: number): string[] {
  const u = uint256.bnToUint256(BigInt(value));
  return [u.low.toString(), u.high.toString()];
}

/**
 * Early exit an active swap
 */
export async function earlyExitSwap({
  asceSwapAddress,
  oracleAddress,
  swapId,
}: {
  asceSwapAddress: string;
  oracleAddress: string;
  swapId: number; // swap_id (u256)
}) {
  // 1️⃣ Get Starknet account
  const starknet = (window as any).starknet;

  if (!starknet) {
    throw new Error(
      "Starknet wallet not found. Please install Braavos or Argent X.",
    );
  }

  // Make sure wallet is connected and enabled
  if (!starknet.isConnected) {
    await starknet.enable({ starknetVersion: "v5" });
  }

  // Wait a bit for the account to be ready
  await new Promise((resolve) => setTimeout(resolve, 100));

  const account = starknet.account;

  if (!account || !account.address) {
    throw new Error(
      "Wallet account not available. Please connect your wallet.",
    );
  }

  // 2️⃣ Convert swapId → u256
  const swapIdU256 = toU256(swapId);
  const oracleRateArr = toU256Array(500);
  const block = await account.getBlock("latest");
  const chainTimestamp = Number(block.timestamp);
  // 3️⃣ Contract instance
  const asceSwap = new Contract({
    abi: AsceSwapABI,
    address: asceSwapAddress,
    providerOrAccount: account,
  });

  const calls = [
    {
      contractAddress: oracleAddress,
      entrypoint: "set_rate",
      calldata: [
        ...oracleRateArr, // u256 rate
        chainTimestamp.toString(), // u64 timestamp (SAFE)
      ],
    },
    {
      contractAddress: asceSwapAddress,
      entrypoint: "early_exit",
      calldata: [swapIdU256],
    },
  ];
  // 5️⃣ Execute
  const tx = await account.execute(calls);
  return tx.transaction_hash;
}
