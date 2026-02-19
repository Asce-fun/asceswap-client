import { RpcProvider, Contract, uint256 } from "starknet";
import OracleContractABI from "../abis/OracleContract.json";

export const provider = new RpcProvider({
  nodeUrl: process.env.NEXT_PUBLIC_RPC_URL,
});

/* ---------- factory with cache ---------- */

const oracleCache = new Map<string, Contract>();

export function getOracleContract(address: string): Contract {
  let contract = oracleCache.get(address);
  if (!contract) {
    contract = new Contract({
      abi: OracleContractABI as any,
      address,
      providerOrAccount: provider,
    });
    oracleCache.set(address, contract);
  }
  return contract;
}

/* ---------- wrapper helpers ---------- */

export async function getOracleRate(
  oracleAddress: string
): Promise<{ rateBps: number; timestamp: number }> {
  const contract = getOracleContract(oracleAddress);
  const result = await contract.get_rate();
  const rateBps = Number(uint256.uint256ToBN(result[0]));
  const timestamp = Number(result[1]);
  return { rateBps, timestamp };
}

export async function getOracleRateHistory(
  oracleAddress: string,
  maxCount: number
): Promise<{ rateBps: number; timestamp: number }[]> {
  const contract = getOracleContract(oracleAddress);
  const result = await contract.get_rate_history(maxCount);
  return result.map((entry: any) => ({
    rateBps: Number(uint256.uint256ToBN(entry[0])),
    timestamp: Number(entry[1]),
  }));
}

export async function getOracleHistoryCount(
  oracleAddress: string
): Promise<number> {
  const contract = getOracleContract(oracleAddress);
  const result = await contract.get_history_count();
  return Number(result);
}
