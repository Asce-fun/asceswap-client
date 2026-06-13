import { type Address, type Hex, isHex } from "../protocol/order";
import type { OrderbookClient } from "../orderbook/client";
import type { SettlementPayload } from "../orderbook/schemas";
import type { EthereumProvider } from "../wallet/WalletProvider";
import { executeSettlementTransaction } from "../contracts/exchange";

export async function fetchSettlementPayload(orderbookClient: OrderbookClient, reservationId: string) {
  return orderbookClient.getReservationSettlement(reservationId);
}

export async function executeSettlement(input: Readonly<{
  provider: EthereumProvider;
  exchange: Address;
  from: Address;
  payload: SettlementPayload;
}>): Promise<Hex> {
  if (!input.payload.data || !isHex(input.payload.data)) {
    throw new Error("Settlement payload is missing pre-encoded transaction data.");
  }

  return executeSettlementTransaction(input.provider, {
    exchange: input.payload.to ?? input.exchange,
    from: input.from,
    data: input.payload.data,
    value: normalizeTxValue(input.payload.value),
  });
}

function normalizeTxValue(value: string | undefined): Hex | undefined {
  if (!value) return undefined;
  if (isHex(value)) return value;
  return `0x${BigInt(value).toString(16)}` as Hex;
}
