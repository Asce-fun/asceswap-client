// transferSwapNFT.ts

import { Contract, uint256 } from "starknet";
import type { StarknetAccount } from "../../utils/getStarknetAccount";
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
  account,
}: {
  asceSwapAddress: string;
  from: string;      // current owner
  to: string;        // recipient
  tokenId: number;   // swapId / token_id
  account: StarknetAccount;
}) {

  // Contract instance
  const asceSwap = new Contract({
    abi: AsceSwapABI,
    address: asceSwapAddress,
    providerOrAccount: account as any,
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
