import { uint256 } from "starknet";

function toU256(value: number) {
  return uint256.bnToUint256(BigInt(value));
}

/**
 * Early exit an active swap
 */
export async function earlyExitSwap({
  asceSwapAddress,
  pairId,
  swapId,
}: {
  asceSwapAddress: string;
  pairId: number;
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

  // 3️⃣ Multicall: poke rate index + early exit
  const calls = [
    {
      contractAddress: asceSwapAddress,
      entrypoint: "poke_rate_index",
      calldata: [String(pairId)],
    },
    {
      contractAddress: asceSwapAddress,
      entrypoint: "early_exit",
      calldata: [swapIdU256],
    },
  ];

  // 4️⃣ Execute
  const tx = await account.execute(calls);
  return tx.transaction_hash;
}
