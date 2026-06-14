import {
  type Address,
  type ApiOrder,
  claimSideToContractValue,
  sideToContractValue,
} from "./order";

export type AsceSwapTypedDataDomain = Readonly<{
  name: "AsceSwap";
  version: "1";
  chainId: number;
  verifyingContract: Address;
}>;

export type OrderTypedDataMessage = Readonly<{
  salt: string;
  maker: Address;
  marketId: string;
  claim: 0 | 1;
  makerAmount: string;
  takerAmount: string;
  side: 0 | 1;
  expiration: string;
  epoch: string;
  maxFeeRateBps: number;
}>;

export const orderTypedDataTypes = {
  EIP712Domain: [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
  ],
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "marketId", type: "bytes32" },
    { name: "claim", type: "uint8" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "expiration", type: "uint256" },
    { name: "epoch", type: "uint256" },
    { name: "maxFeeRateBps", type: "uint16" },
  ],
} as const;

export function toOrderTypedDataMessage(order: ApiOrder): OrderTypedDataMessage {
  return {
    salt: order.salt,
    maker: order.maker,
    marketId: order.market_id,
    claim: claimSideToContractValue[order.claim],
    makerAmount: order.maker_amount,
    takerAmount: order.taker_amount,
    side: sideToContractValue[order.side],
    expiration: order.expiration,
    epoch: order.epoch,
    maxFeeRateBps: order.max_fee_rate_bps,
  };
}

export function buildOrderTypedData(order: ApiOrder, domain: AsceSwapTypedDataDomain) {
  return {
    domain,
    types: orderTypedDataTypes,
    primaryType: "Order",
    message: toOrderTypedDataMessage(order),
  };
}

export type SignedOrderPayload = Readonly<{
  chainId: number;
  verifyingContract: Address;
  order: OrderTypedDataMessage;
  signature: string;
}>;

export function buildSignedOrderPayload(
  order: ApiOrder,
  signature: string,
  domain: AsceSwapTypedDataDomain,
): SignedOrderPayload {
  return {
    chainId: domain.chainId,
    verifyingContract: domain.verifyingContract,
    order: toOrderTypedDataMessage(order),
    signature,
  };
}
