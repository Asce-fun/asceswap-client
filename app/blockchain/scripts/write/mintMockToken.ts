import { Contract } from "starknet";
import type { StarknetAccount } from "../../utils/getStarknetAccount";
import { ERC20_ABI } from "../../abis/erc20";

export async function mintMockToken(
  tokenAddress: string,
  account: StarknetAccount
) {

  const erc20 = new Contract({
    abi: ERC20_ABI,
    address: tokenAddress,
    providerOrAccount: account as any,
  });

  const tx = await erc20.mint();
  return tx.transaction_hash;
}
