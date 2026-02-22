import { Contract, uint256 } from "starknet";
import type { StarknetAccount } from "../../utils/getStarknetAccount";
import { ERC20_ABI } from "../../abis/erc20";
import AsceSwapABI from "../../abis/AsceSwap.json";

function toU256(amount: number, decimals: number) {
  return uint256.bnToUint256(
    BigInt(Math.round(amount * 10 ** decimals))
  );
}

export async function approveAndSupplyLp({
  tokenAddress,
  asceSwapAddress,
  pairId,
  amount,
  decimals,
  account,
}: {
  tokenAddress: string;
  asceSwapAddress: string;
  pairId: string;
  amount: number;
  decimals: number;
  account: StarknetAccount;
}) {

  const amountU256 = toU256(amount, decimals);

  const erc20 = new Contract({
    abi:ERC20_ABI,
    address:tokenAddress,
    providerOrAccount:account as any
});

  const asceSwap = new Contract({
    abi:AsceSwapABI,
    address:asceSwapAddress,
    providerOrAccount:account as any
});

  const calls = [
    erc20.populate("approve", [
      asceSwapAddress,
      amountU256,
    ]),
    asceSwap.populate("supply_lp_collateral", [
      pairId,
      amountU256,
    ]),
  ];

  const tx = await account.execute(calls);
  return tx.transaction_hash;
}