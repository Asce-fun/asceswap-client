import { ASCESWAP_EVENT_TOPICS } from "../protocol/constants";
import type { Address, Bytes32, Hex } from "../protocol/order";
import type { EthereumProvider } from "../wallet/WalletProvider";

export type RpcLog = Readonly<{
  address: Address;
  data: Hex;
  topics: readonly Hex[];
  blockNumber?: Hex;
  transactionHash?: Hex;
  logIndex?: Hex;
}>;

export type TwaSample = Readonly<{
  marketId: Bytes32;
  adapter: Address;
  valueWad: bigint;
  sampleAt: bigint;
  coveredSeconds: bigint;
  maxObservedGap: bigint;
  blockNumber?: bigint;
  transactionHash?: Hex;
}>;

export async function getTwaSamples(input: Readonly<{
  provider: EthereumProvider;
  adapter: Address;
  marketId: Bytes32;
  fromBlock: number;
  toBlock?: number;
  chunkSize?: number;
}>): Promise<readonly TwaSample[]> {
  const toBlock = input.toBlock ?? await getBlockNumber(input.provider);
  const logs = await getLogsChunked({
    provider: input.provider,
    address: input.adapter,
    fromBlock: input.fromBlock,
    toBlock,
    topics: [ASCESWAP_EVENT_TOPICS.twaSample, input.marketId],
    chunkSize: input.chunkSize ?? 25_000,
  });

  return logs
    .map((log) => decodeTwaSampleLog(log, input.marketId, input.adapter))
    .sort((left, right) => Number(left.sampleAt - right.sampleAt));
}

export async function getBlockNumber(provider: EthereumProvider) {
  const blockNumber = await provider.request<string>({ method: "eth_blockNumber" });

  if (!/^0x[0-9a-fA-F]+$/.test(blockNumber)) {
    throw new Error("RPC returned an invalid block number.");
  }

  return Number.parseInt(blockNumber, 16);
}

export async function getLogsChunked(input: Readonly<{
  provider: EthereumProvider;
  address: Address;
  fromBlock: number;
  toBlock: number;
  topics: readonly Hex[];
  chunkSize: number;
}>): Promise<readonly RpcLog[]> {
  if (input.toBlock < input.fromBlock) return [];

  const logs: RpcLog[] = [];

  for (let fromBlock = input.fromBlock; fromBlock <= input.toBlock; fromBlock += input.chunkSize + 1) {
    const toBlock = Math.min(fromBlock + input.chunkSize, input.toBlock);
    const chunkLogs = await input.provider.request<RpcLog[]>({
      method: "eth_getLogs",
      params: [{
        address: input.address,
        fromBlock: toQuantityHex(BigInt(fromBlock)),
        toBlock: toQuantityHex(BigInt(toBlock)),
        topics: input.topics,
      }],
    });
    logs.push(...chunkLogs);
  }

  return logs;
}

export function decodeTwaSampleLog(log: RpcLog, marketId: Bytes32, adapter: Address): TwaSample {
  const [valueWad, sampleAt, coveredSeconds, maxObservedGap] = decodeWords(log.data);

  return {
    marketId,
    adapter,
    valueWad: decodeInt256(valueWad),
    sampleAt: BigInt(`0x${sampleAt}`),
    coveredSeconds: BigInt(`0x${coveredSeconds}`),
    maxObservedGap: BigInt(`0x${maxObservedGap}`),
    blockNumber: log.blockNumber ? BigInt(log.blockNumber) : undefined,
    transactionHash: log.transactionHash,
  };
}

function decodeWords(data: Hex) {
  const raw = data.slice(2);

  if (raw.length < 64 * 4) {
    throw new Error("TwaSample log data is incomplete.");
  }

  return [
    raw.slice(0, 64),
    raw.slice(64, 128),
    raw.slice(128, 192),
    raw.slice(192, 256),
  ] as const;
}

function decodeInt256(word: string) {
  const value = BigInt(`0x${word}`);
  const signBit = 1n << 255n;
  return value >= signBit ? value - (1n << 256n) : value;
}

function toQuantityHex(value: bigint): Hex {
  return `0x${value.toString(16)}`;
}
