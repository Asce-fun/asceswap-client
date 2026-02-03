import { Contract, uint256 } from "starknet";
import { ERC20_ABI } from "../../abis/erc20";

export async function mintMockToken(
  tokenAddress: string,
  decimals: number
) {
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

  const erc20 = new Contract({
    abi:ERC20_ABI,
    address:tokenAddress,
    providerOrAccount:account
});

  const amount = uint256.bnToUint256(
    BigInt(10_000) * BigInt(10) ** BigInt(decimals)
  );

  const tx = await erc20.mint(
    account.address,
    amount
  );

  return tx.transaction_hash;
}
