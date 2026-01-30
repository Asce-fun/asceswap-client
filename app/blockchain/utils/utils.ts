import { uint256 } from "starknet";

export const u256ToBigInt = (v: any): bigint =>
  uint256.uint256ToBN(v);

export const SwapSide = {
  Fixed: 0,
  Floating: 1,
};

export const MarketStatus = {
  Active: 0,
  Paused: 1,
};