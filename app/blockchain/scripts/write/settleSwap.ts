import { uint256 } from "starknet";

function toU256(value: number) {
  return uint256.bnToUint256(BigInt(value));
}

/**
 * Settle an expired swap (remaining_seconds === 0)
 */
export async function settleSwap({
  asceSwapAddress,
  pairId,
  swapId,
}: {
  asceSwapAddress: string;
  pairId: number;
  swapId: number;
}) {
  const starknet = (window as any).starknet;

  if (!starknet) {
    throw new Error(
      "Starknet wallet not found. Please install Braavos or Argent X.",
    );
  }

  if (!starknet.isConnected) {
    await starknet.enable({ starknetVersion: "v5" });
  }

  await new Promise((resolve) => setTimeout(resolve, 100));

  const account = starknet.account;

  if (!account || !account.address) {
    throw new Error(
      "Wallet account not available. Please connect your wallet.",
    );
  }

  const swapIdU256 = toU256(swapId);

  const calls = [
    {
      contractAddress: asceSwapAddress,
      entrypoint: "poke_rate_index",
      calldata: [String(pairId)],
    },
    {
      contractAddress: asceSwapAddress,
      entrypoint: "settle_swap",
      calldata: [swapIdU256],
    },
  ];

  const tx = await account.execute(calls);
  return tx.transaction_hash;
}
