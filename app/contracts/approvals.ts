import { type Address, type Hex } from "../protocol/order";
import type { EthereumProvider } from "../wallet/WalletProvider";
import {
  decodeBool,
  decodeUint256,
  encodeAddress,
  encodeBool,
  encodeUint256,
  ethCall,
  sendTransaction,
} from "./reads";

export type ApprovalResult = Readonly<{
  approved: boolean;
  transactionHash?: Hex;
}>;

export async function getErc20Allowance(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
  spender: Address,
) {
  const data = `0xdd62ed3e${encodeAddress(owner)}${encodeAddress(spender)}` as Hex;
  return decodeUint256(await ethCall(provider, { to: token, data }, owner));
}

export async function approveErc20(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
  spender: Address,
  amount: bigint,
): Promise<Hex> {
  const data = `0x095ea7b3${encodeAddress(spender)}${encodeUint256(amount)}` as Hex;
  return sendTransaction(provider, { from: owner, to: token, data });
}

export async function ensureErc20Approval(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
  spender: Address,
  requiredAmount: bigint,
): Promise<ApprovalResult> {
  const allowance = await getErc20Allowance(provider, token, owner, spender);

  if (allowance >= requiredAmount) {
    return { approved: true };
  }

  return {
    approved: false,
    transactionHash: await approveErc20(provider, token, owner, spender, requiredAmount),
  };
}

export async function isApprovedForAll(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
  operator: Address,
) {
  const data = `0xe985e9c5${encodeAddress(owner)}${encodeAddress(operator)}` as Hex;
  return decodeBool(await ethCall(provider, { to: token, data }, owner));
}

export async function setApprovalForAll(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
  operator: Address,
  approved: boolean,
): Promise<Hex> {
  const data = `0xa22cb465${encodeAddress(operator)}${encodeBool(approved)}` as Hex;
  return sendTransaction(provider, { from: owner, to: token, data });
}

export async function ensureClaimApprovalForAll(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
  operator: Address,
): Promise<ApprovalResult> {
  const approved = await isApprovedForAll(provider, token, owner, operator);

  if (approved) {
    return { approved: true };
  }

  return {
    approved: false,
    transactionHash: await setApprovalForAll(provider, token, owner, operator, true),
  };
}
