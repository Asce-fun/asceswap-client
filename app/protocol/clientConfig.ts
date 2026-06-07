import { type Address, isAddress } from "./order";

const DEMO_EXCHANGE_ADDRESS = "0x0000000000000000000000000000000000000001" as const;

export type SigningConfig = Readonly<{
  chainId: number;
  verifyingContract: Address;
  isDemoConfig: boolean;
}>;

export function resolveSigningConfig(connectedChainId: number): SigningConfig {
  const configuredChainId = process.env.NEXT_PUBLIC_ASCESWAP_CHAIN_ID;
  const configuredExchange = process.env.NEXT_PUBLIC_ASCESWAP_EXCHANGE_ADDRESS;
  const chainId = configuredChainId ? Number(configuredChainId) : connectedChainId;
  const hasConfiguredExchange = Boolean(configuredExchange && isAddress(configuredExchange));

  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("Invalid AsceSwap chain id configuration.");
  }

  return {
    chainId,
    verifyingContract: hasConfiguredExchange ? configuredExchange as Address : DEMO_EXCHANGE_ADDRESS,
    isDemoConfig: !configuredChainId || !hasConfiguredExchange,
  };
}
