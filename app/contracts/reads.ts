import { type Address, type Bytes32, type Hex, isHex } from "../protocol/order";
import type { EthereumProvider } from "../wallet/WalletProvider";

export type TransactionRequest = Readonly<{
  from: Address;
  to: Address;
  data: Hex;
  value?: Hex;
}>;

export async function ethCall(provider: EthereumProvider, tx: Omit<TransactionRequest, "from">, from?: Address): Promise<Hex> {
  const result = await provider.request<string>({
    method: "eth_call",
    params: [
      from ? { ...tx, from } : tx,
      "latest",
    ],
  });

  if (!isHex(result)) {
    throw new Error("Contract read returned invalid hex.");
  }

  return result;
}

export async function sendTransaction(provider: EthereumProvider, tx: TransactionRequest): Promise<Hex> {
  const hash = await provider.request<string>({
    method: "eth_sendTransaction",
    params: [tx],
  });

  if (!isHex(hash)) {
    throw new Error("Wallet returned an invalid transaction hash.");
  }

  return hash;
}

export function encodeAddress(address: Address) {
  return address.slice(2).padStart(64, "0");
}

export function encodeBytes32(value: Bytes32) {
  return value.slice(2).padStart(64, "0");
}

export function encodeUint256(value: bigint) {
  return value.toString(16).padStart(64, "0");
}

export function encodeBool(value: boolean) {
  return value ? "1".padStart(64, "0") : "0".repeat(64);
}

export function decodeUint256(value: Hex) {
  return BigInt(value);
}

export function decodeBool(value: Hex) {
  return BigInt(value) !== 0n;
}
