import { ASCESWAP_ADDRESSES } from "../protocol/constants";
import {
  type Address,
  type ApiOrder,
  type Bytes32,
  type Hex,
  claimSideToContractValue,
  sideToContractValue,
} from "../protocol/order";
import type { EthereumProvider } from "../wallet/WalletProvider";
import {
  decodeUint256,
  encodeAddress,
  encodeBytes32,
  encodeUint256,
  ethCall,
  sendTransaction,
} from "./reads";

const SELECTORS = {
  makerEpoch: "0x6f3627f8",
  getPositionIds: "0xf6653f75",
  remainingClaimAmount: "0x819e9f01",
  claim: "0x4e71d92d",
  erc20BalanceOf: "0x70a08231",
  erc1155BalanceOf: "0x00fdd58e",
} as const;

export type PositionIds = Readonly<{
  payoffPositionId: bigint;
  residualPositionId: bigint;
}>;

export async function getMakerEpoch(
  provider: EthereumProvider,
  user: Address,
  exchange: Address = ASCESWAP_ADDRESSES.exchange,
) {
  const data = `${SELECTORS.makerEpoch}${encodeAddress(user)}` as Hex;
  return decodeUint256(await ethCall(provider, { to: exchange, data }, user));
}

export async function getPositionIds(
  provider: EthereumProvider,
  marketId: Bytes32,
  exchange: Address = ASCESWAP_ADDRESSES.exchange,
): Promise<PositionIds> {
  const data = `${SELECTORS.getPositionIds}${encodeBytes32(marketId)}` as Hex;
  const result = await ethCall(provider, { to: exchange, data });
  const words = splitWords(result);

  if (words.length < 2) {
    throw new Error("Position id read returned incomplete data.");
  }

  return {
    payoffPositionId: BigInt(`0x${words[0]}`),
    residualPositionId: BigInt(`0x${words[1]}`),
  };
}

export async function getErc20Balance(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
) {
  const data = `${SELECTORS.erc20BalanceOf}${encodeAddress(owner)}` as Hex;
  return decodeUint256(await ethCall(provider, { to: token, data }, owner));
}

export async function getErc1155Balance(
  provider: EthereumProvider,
  token: Address,
  owner: Address,
  id: bigint,
) {
  const data = `${SELECTORS.erc1155BalanceOf}${encodeAddress(owner)}${encodeUint256(id)}` as Hex;
  return decodeUint256(await ethCall(provider, { to: token, data }, owner));
}

export async function getRemainingClaimAmount(
  provider: EthereumProvider,
  order: ApiOrder,
  exchange: Address = ASCESWAP_ADDRESSES.exchange,
) {
  const data = `${SELECTORS.remainingClaimAmount}${encodeOrderStruct(order)}` as Hex;
  return decodeUint256(await ethCall(provider, { to: exchange, data }, order.maker));
}

export async function claimDemoMusdc(
  provider: EthereumProvider,
  owner: Address,
  token: Address = ASCESWAP_ADDRESSES.demoMusdc,
) {
  return sendTransaction(provider, {
    from: owner,
    to: token,
    data: SELECTORS.claim,
  });
}

function encodeOrderStruct(order: ApiOrder) {
  return [
    encodeUint256(BigInt(order.salt)),
    encodeAddress(order.maker),
    encodeBytes32(order.market_id),
    encodeUint256(BigInt(claimSideToContractValue[order.claim])),
    encodeUint256(BigInt(order.maker_amount)),
    encodeUint256(BigInt(order.taker_amount)),
    encodeUint256(BigInt(sideToContractValue[order.side])),
    encodeUint256(BigInt(order.expiration)),
    encodeUint256(BigInt(order.epoch)),
    encodeUint256(BigInt(order.max_fee_rate_bps)),
  ].join("");
}

function splitWords(value: Hex) {
  const data = value.slice(2);
  const words: string[] = [];

  for (let index = 0; index + 64 <= data.length; index += 64) {
    words.push(data.slice(index, index + 64));
  }

  return words;
}
