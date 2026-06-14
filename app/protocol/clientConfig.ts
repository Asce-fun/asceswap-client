import { type Address } from "./order";
import { ASCESWAP_ADDRESSES, ASCESWAP_CHAIN_ID } from "./constants";

export type SigningConfig = Readonly<{
  chainId: number;
  verifyingContract: Address;
  isDemoConfig: boolean;
}>;

export function resolveSigningConfig(connectedChainId: number): SigningConfig {
  if (!Number.isSafeInteger(connectedChainId) || connectedChainId <= 0) {
    throw new Error("Wallet returned an invalid chain id.");
  }

  return {
    chainId: ASCESWAP_CHAIN_ID,
    verifyingContract: ASCESWAP_ADDRESSES.exchange,
    isDemoConfig: false,
  };
}
