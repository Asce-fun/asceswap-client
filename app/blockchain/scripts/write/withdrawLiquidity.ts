import { Contract, uint256 } from "starknet";
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
  shareDecimals = 18, // LP shares are usually 18 decimals
}: {
  asceSwapAddress: string;
  pairId: string; // felt252
  shares: number; // number of LP shares to withdraw
  shareDecimals?: number;
}) {
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

  const sharesU256 = toU256(shares, shareDecimals);

  const asceSwap = new Contract({
    abi: AsceSwapABI,
    address: asceSwapAddress,
    providerOrAccount: account,
  });

  const call = asceSwap.populate("withdraw_lp_collateral", [
    pairId,
    sharesU256,
  ]);

  const tx = await account.execute([call]);
  return tx.transaction_hash;
}
