import { RpcProvider, Contract } from "starknet";
import AsceSwapABI from "../abis/AsceSwap.json";

export const provider = new RpcProvider({
  nodeUrl: process.env.NEXT_PUBLIC_RPC_URL,
});

export const ASCE_SWAP_ADDRESS =
  "0x0123..."; // 👈 no literal typing

export const asceSwap = new Contract({
  abi:AsceSwapABI,
  address:ASCE_SWAP_ADDRESS,
  providerOrAccount:provider
});


