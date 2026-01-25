import { TokenSymbol } from "@/app/interface/types";

export const extractTokensFromName = (name: string): TokenSymbol[] => {
  const upper = name.toUpperCase();

  const tokens: TokenSymbol[] = [];

  if (upper.includes("STRK")) tokens.push("STRK");
  if (upper.includes("USDC")) tokens.push("USDC");
  if (upper.includes("ETH")) tokens.push("ETH");
  if (upper.includes("USDT")) tokens.push("USDT");
  if (upper.includes("BTC")) tokens.push("BTC");

  return tokens;
};