// transferSwapNFT.ts

import { Contract, uint256 } from "starknet";
import AsceSwapABI from "../../abis/AsceSwap.json";

/**
 * Convert number / bigint to u256
 */
function toU256(value: number | bigint) {
  return uint256.bnToUint256(BigInt(value));
}

/**
 * Transfer swap NFT (ERC721 transfer_from)
 */
export async function transferSwapNFT({
  asceSwapAddress,
  from,
  to,
  tokenId,
}: {
  asceSwapAddress: string;
  from: string;      // current owner
  to: string;        // recipient
  tokenId: number;   // swapId / token_id
}) {
  const starknet = (window as any).starknet;

  if (!starknet) {
    throw new Error("Starknet wallet not found. Install Argent X or Braavos.");
  }

  // Ensure wallet is connected
  if (!starknet.isConnected) {
    await starknet.enable({ starknetVersion: "v5" });
  }

  // Small delay so account is hydrated
  await new Promise((r) => setTimeout(r, 100));

  const account = starknet.account;

  if (!account || !account.address) {
    throw new Error("Wallet account not available.");
  }

  // Contract instance
  const asceSwap = new Contract({
    abi: AsceSwapABI,
    address: asceSwapAddress,
    providerOrAccount: account,
  });

  // Convert tokenId → u256
  const tokenIdU256 = toU256(tokenId);

  // Populate call
  const call = asceSwap.populate("transfer_from", [
    from,
    to,
    tokenIdU256,
  ]);

  // Execute transaction
  const tx = await account.execute([call]);

  return tx.transaction_hash;
}
