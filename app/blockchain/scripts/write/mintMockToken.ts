import { Contract } from "starknet";
import { ERC20_ABI } from "../../abis/erc20";

export async function mintMockToken(tokenAddress: string) {
  const starknet = (window as any).starknet;

  if (!starknet) {
    throw new Error("Starknet wallet not found. Please install Braavos or Argent X.");
  }

  if (!starknet.isConnected) {
    await starknet.enable({ starknetVersion: "v5" });
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  const account = starknet.account;

  if (!account || !account.address) {
    throw new Error("Wallet account not available. Please connect your wallet.");
  }

  const erc20 = new Contract({
    abi: ERC20_ABI,
    address: tokenAddress,
    providerOrAccount: account,
  });

  const tx = await erc20.mint();
  return tx.transaction_hash;
}
