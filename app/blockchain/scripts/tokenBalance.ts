import { Contract, RpcProvider, uint256 } from "starknet";
import { u256ToBigInt } from "../utils/utils";
import { ERC20_ABI } from "../abis/erc20";

const provider = new RpcProvider({
  nodeUrl: process.env.NEXT_PUBLIC_STARKNET_RPC!,
});

export async function getTokenBalance(
  tokenAddress: string,
  userAddress: string
) {
  const erc20 = new Contract({abi:ERC20_ABI, address:tokenAddress,providerOrAccount:provider});

  const [balanceRes, decimalsRes, symbolRes] = await Promise.all([
    erc20.balanceOf(userAddress),
    erc20.decimals(),
    erc20.symbol(),
  ]);

  const balance = u256ToBigInt(balanceRes.balance);
  const decimals = Number(decimalsRes.decimals);
  const symbol = symbolRes.symbol;

  return {
    balance,                // bigint (raw)
    decimals,               // number
    symbol,                 // string
    formatted:
      Number(balance) / 10 ** decimals,
  };
}
