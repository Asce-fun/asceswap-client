import { uint256 } from "starknet";
import type { StarknetAccount } from "../../utils/getStarknetAccount";

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
  account,
}: {
  asceSwapAddress: string;
  pairId: number;
  swapId: number; // swap_id (u256)
  account: StarknetAccount;
}) {

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
      calldata: [String(swapIdU256.low), String(swapIdU256.high)],
    },
  ];

  // 4️⃣ Execute
  const tx = await account.execute(calls);
  return tx.transaction_hash;
}
