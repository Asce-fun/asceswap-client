import { uint256 } from "starknet";
import type { StarknetAccount } from "../../utils/getStarknetAccount";

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
  account,
}: {
  asceSwapAddress: string;
  pairId: number;
  swapId: number;
  account: StarknetAccount;
}) {

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
      calldata: [String(swapIdU256.low), String(swapIdU256.high)],
    },
  ];

  const tx = await account.execute(calls);
  return tx.transaction_hash;
}
