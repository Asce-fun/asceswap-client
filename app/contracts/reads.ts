import { type Address, type Bytes32, type Hex, isHex } from "../protocol/order";
import type { EthereumProvider } from "../wallet/WalletProvider";

export type TransactionRequest = Readonly<{
  from: Address;
  to: Address;
  data: Hex;
  value?: Hex;
  gas?: Hex;
  maxFeePerGas?: Hex;
  maxPriorityFeePerGas?: Hex;
  gasPrice?: Hex;
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
  const txWithFees = await withFreshFeeCaps(provider, tx);
  const hash = await provider.request<string>({
    method: "eth_sendTransaction",
    params: [txWithFees],
  });

  if (!isHex(hash)) {
    throw new Error("Wallet returned an invalid transaction hash.");
  }

  return hash;
}

async function withFreshFeeCaps(provider: EthereumProvider, tx: TransactionRequest): Promise<TransactionRequest> {
  if (tx.gasPrice || tx.maxFeePerGas || tx.maxPriorityFeePerGas) {
    return tx;
  }

  try {
    const latestBlock = await provider.request<{ baseFeePerGas?: string }>({
      method: "eth_getBlockByNumber",
      params: ["latest", false],
    });
    const baseFeePerGas = latestBlock.baseFeePerGas && isHex(latestBlock.baseFeePerGas)
      ? BigInt(latestBlock.baseFeePerGas)
      : null;

    if (baseFeePerGas === null) {
      return tx;
    }

    const priorityFeePerGas = await getPriorityFeePerGas(provider);

    return {
      ...tx,
      maxPriorityFeePerGas: toHex(priorityFeePerGas),
      maxFeePerGas: toHex(baseFeePerGas * 2n + priorityFeePerGas),
    };
  } catch {
    return tx;
  }
}

async function getPriorityFeePerGas(provider: EthereumProvider) {
  const fallbackPriorityFeePerGas = 1_000_000n;

  try {
    const priorityFee = await provider.request<string>({
      method: "eth_maxPriorityFeePerGas",
    });

    if (isHex(priorityFee)) {
      return maxBigInt(BigInt(priorityFee), fallbackPriorityFeePerGas);
    }
  } catch {
    return fallbackPriorityFeePerGas;
  }

  return fallbackPriorityFeePerGas;
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

function toHex(value: bigint): Hex {
  return `0x${value.toString(16)}`;
}

function maxBigInt(left: bigint, right: bigint) {
  return left > right ? left : right;
}
