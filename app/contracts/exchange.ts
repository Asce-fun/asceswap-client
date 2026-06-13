import { type Address, type Hex } from "../protocol/order";
import type { EthereumProvider } from "../wallet/WalletProvider";
import { sendTransaction } from "./reads";

export type SettlementTransactionPayload = Readonly<{
  exchange: Address;
  from: Address;
  data: Hex;
  value?: Hex;
}>;

export async function executeSettlementTransaction(
  provider: EthereumProvider,
  payload: SettlementTransactionPayload,
): Promise<Hex> {
  return sendTransaction(provider, {
    from: payload.from,
    to: payload.exchange,
    data: payload.data,
    value: payload.value,
  });
}

export async function submitContractCancellation(
  provider: EthereumProvider,
  tx: SettlementTransactionPayload,
): Promise<Hex> {
  return executeSettlementTransaction(provider, tx);
}
