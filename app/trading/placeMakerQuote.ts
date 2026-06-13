import type { AsceSwapTypedDataDomain } from "../protocol/eip712";
import type { OrderbookClient } from "../orderbook/client";
import type { BuildOrderInput } from "./buildOrder";
import { placeLimitOrder, type TypedDataSigner } from "./placeLimitOrder";

export function placePostOnlyQuote(input: Readonly<{
  orderInput: BuildOrderInput;
  domain: AsceSwapTypedDataDomain;
  signer: TypedDataSigner;
  orderbookClient: OrderbookClient;
}>) {
  return placeLimitOrder({
    ...input,
    submitOptions: {
      postOnly: true,
      restOnNoMatch: true,
    },
  });
}
