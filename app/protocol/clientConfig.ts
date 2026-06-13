import { type Address, isAddress } from "./order";
import { ASCESWAP_ADDRESSES, ASCESWAP_CHAIN_ID } from "./constants";

export type SigningConfig = Readonly<{
  chainId: number;
  verifyingContract: Address;
  isDemoConfig: boolean;
}>;

export function resolveSigningConfig(connectedChainId: number): SigningConfig {
  const configuredChainId = process.env.NEXT_PUBLIC_ASCESWAP_CHAIN_ID;
  const configuredExchange = process.env.NEXT_PUBLIC_ASCESWAP_EXCHANGE_ADDRESS;
  const chainId = configuredChainId ? Number(configuredChainId) : ASCESWAP_CHAIN_ID;
  const hasConfiguredExchange = Boolean(configuredExchange && isAddress(configuredExchange));

  if (!Number.isSafeInteger(connectedChainId) || connectedChainId <= 0) {
    throw new Error("Wallet returned an invalid chain id.");
  }

  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("Invalid AsceSwap chain id configuration.");
  }

  return {
    chainId,
    verifyingContract: hasConfiguredExchange ? configuredExchange as Address : ASCESWAP_ADDRESSES.exchange,
    isDemoConfig: false,
  };
}
