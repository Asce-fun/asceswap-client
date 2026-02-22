import { Contract, uint256 } from "starknet";
import type { StarknetAccount } from "../../utils/getStarknetAccount";
import AsceSwapABI from "../../abis/AsceSwap.json";

function toU256(amount: number, decimals: number) {
  return uint256.bnToUint256(
    BigInt(Math.round(amount * 10 ** decimals))
  );
}

export async function withdrawLpLiquidity({
  asceSwapAddress,
  pairId,
  shares,
  shareDecimals = 6,
  account,
}: {
  asceSwapAddress: string;
  pairId: string; // felt252
  shares: number; // number of LP shares to withdraw
  shareDecimals?: number;
  account: StarknetAccount;
}) {

  const sharesU256 = toU256(shares, shareDecimals);

  const asceSwap = new Contract({
    abi: AsceSwapABI,
    address: asceSwapAddress,
    providerOrAccount: account as any,
  });

  const call = asceSwap.populate("withdraw_lp_collateral", [
    pairId,
    sharesU256,
  ]);

  const tx = await account.execute([call]);
  return tx.transaction_hash;
}
