import { RpcProvider, Contract } from "starknet";
import AnalyticsABI from "../abis/Analytics.json";

export const provider = new RpcProvider({
  nodeUrl: process.env.NEXT_PUBLIC_RPC_URL,
});

export const ASCE_SWAP_ANALYTICS_ADDRESS =
    process.env.NEXT_PUBLIC_ANALYTICS_ADDRESS; // 👈 no literal typing

export const analytics = new Contract({
  abi:AnalyticsABI as any,
  address:ASCE_SWAP_ANALYTICS_ADDRESS as string,
  providerOrAccount:provider
});


