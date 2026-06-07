import { type Hex } from "../protocol/order";
import type { OrderbookClient } from "../orderbook/client";

export type CancelOrderResult = Readonly<{
  orderbookCancelled: boolean;
  contractCancellationHash?: Hex;
}>;

export async function cancelRestingOrder(input: Readonly<{
  orderHash: Hex;
  orderbookClient: OrderbookClient;
  submitContractCancellation?: () => Promise<Hex>;
}>): Promise<CancelOrderResult> {
  await input.orderbookClient.cancelOrder({ order_hash: input.orderHash });
  const contractCancellationHash = input.submitContractCancellation
    ? await input.submitContractCancellation()
    : undefined;

  return {
    orderbookCancelled: true,
    contractCancellationHash,
  };
}
