import { type Address, type ApiOrder, type Hex } from "../protocol/order";
import { buildOrderTypedData, type AsceSwapTypedDataDomain } from "../protocol/eip712";
import type { OrderbookClient } from "../orderbook/client";
import type { SubmitOrderOptions, SubmitOrderOutcome } from "../orderbook/schemas";
import { buildOrder, type BuildOrderInput } from "./buildOrder";

export type TypedDataSigner = Readonly<{
  signTypedData: (typedData: object, signer?: Address) => Promise<Hex>;
}>;

export type OrderSubmission = Readonly<{
  order: ApiOrder;
  signature: Hex;
  response: SubmitOrderOutcome;
}>;

export async function signOrder(
  order: ApiOrder,
  signer: TypedDataSigner,
  domain: AsceSwapTypedDataDomain,
): Promise<Hex> {
  return signer.signTypedData(buildOrderTypedData(order, domain), order.maker);
}

export async function submitSignedOrder(
  orderbookClient: OrderbookClient,
  order: ApiOrder,
  signature: Hex,
  options: SubmitOrderOptions = {},
) {
  return orderbookClient.submitSignedOrder(order, signature, options);
}

export async function placeLimitOrder(input: Readonly<{
  orderInput: BuildOrderInput;
  domain: AsceSwapTypedDataDomain;
  signer: TypedDataSigner;
  orderbookClient: OrderbookClient;
  submitOptions?: SubmitOrderOptions;
}>): Promise<OrderSubmission> {
  const order = buildOrder(input.orderInput);
  const signature = await signOrder(order, input.signer, input.domain);
  const response = await submitSignedOrder(input.orderbookClient, order, signature, input.submitOptions);

  return { order, signature, response };
}
