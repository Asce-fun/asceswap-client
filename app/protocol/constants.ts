import type { Address, Bytes32, Hex } from "./order";

export const ASCESWAP_CHAIN_ID = 421614;
export const ASCESWAP_CHAIN_NAME = "Arbitrum Sepolia";
export const ARBITRUM_SEPOLIA_CHAIN_ID_HEX = "0x66eee";
export const ARBITRUM_SEPOLIA_EXPLORER_URL = "https://sepolia.arbiscan.io";

export const ASCESWAP_ADDRESSES = {
  exchange: "0x346457c948EaA86Afa9392B9E790bE2E42c6ebD6" as Address,
  ctf: "0xdad1Cb7f40cb1696B24FCd5754C6D21577F49234" as Address,
  demoMusdc: "0x3D2499f93556F61140bB2b77c14321D20c104F6b" as Address,
} as const;

export const MUSDC_DECIMALS = 6;
export const WAD_DECIMALS = 18;

export const ASCESWAP_DEMO_WINDOW = {
  startTimestamp: 1781345978,
  endTimestamp: 1783937978,
  utcLabel: "2026-06-13 10:19:38 to 2026-07-13 10:19:38 UTC",
  istLabel: "2026-06-13 15:49:38 to 2026-07-13 15:49:38 IST",
} as const;

export const ASCESWAP_EVENT_TOPICS = {
  twaSample: "0x892e3d21d593b95bf248bf48b0d0f337806f2db8cecda3e42015418ecfbc5e6a" as Hex,
  marketSettled: "0x59bcac80a9f51265185d927d0a89ce3679cc410e51c7abc0a137523143f9ddb4" as Hex,
  orderFilled: "0x634044ae21a8c8fd67c9cfe7d0c2a7db3747c1a5d68c3d79e7d28466bb77796f" as Hex,
} as const;

export type DemoMarketProtocolConfig = Readonly<{
  slug: "aave-usdc-borrow-interest" | "arbitrum-l2-gas-fees";
  productCopy: string;
  marketId: Bytes32;
  conditionId: Bytes32;
  adapter: Address;
  adapterLabel: string;
  unit: string;
  chartFromBlock: number;
  chartFromBlockHex: Hex;
  valueDisplay: "aprPercent" | "basefeeGwei";
  zeroPayoutLabel: string;
  midpointPayoutLabel: string;
  fullPayoutLabel: string;
}>;

export const ASCESWAP_DEMO_MARKETS = {
  aaveBorrowInterest: {
    slug: "aave-usdc-borrow-interest",
    productCopy: "Cap my Aave USDC borrow interest",
    marketId: "0x2f56d7c26e665a04dd24404cdd841d6fcd7fd402a3b127760e2598c64d2df369" as Bytes32,
    conditionId: "0xc71905085f9f94da2bb5c89f16b8197dffcf4d9e917bd2aed0fe6875dd756d0d" as Bytes32,
    adapter: "0x3B9D6fF6d0C798317f3B51681e335f5b07cbD70F" as Address,
    adapterLabel: "Aave variable borrow APR adapter",
    unit: "Aave variable borrow APR, WAD where 1e18 = 100% APR",
    chartFromBlock: 276763105,
    chartFromBlockHex: "0x107F11E1" as Hex,
    valueDisplay: "aprPercent",
    zeroPayoutLabel: "4% APR or lower: PAYOFF pays 0 mUSDC",
    midpointPayoutLabel: "6% APR: PAYOFF pays 0.5 mUSDC",
    fullPayoutLabel: "8% APR or higher: PAYOFF pays 1 mUSDC",
  },
  l2GasFees: {
    slug: "arbitrum-l2-gas-fees",
    productCopy: "Hedge Arbitrum Sepolia L2 gas fees",
    marketId: "0xfe77931a0aa6baee55370819b38cb10feb3f03e2c0053a9a37e3213a471b7f28" as Bytes32,
    conditionId: "0x6cfa37d00f09968ebd5909e1e6ceabdae3e968c11702ba07cb937df332df85c8" as Bytes32,
    adapter: "0x81aA57736801E33f8ef059F79B8F4332416D4DB8" as Address,
    adapterLabel: "Arbitrum L2 basefee adapter",
    unit: "L2 basefee in gwei WAD, where 1e18 = 1 gwei",
    chartFromBlock: 276763092,
    chartFromBlockHex: "0x107F11D4" as Hex,
    valueDisplay: "basefeeGwei",
    zeroPayoutLabel: "0.015 gwei or lower: PAYOFF pays 0 mUSDC",
    midpointPayoutLabel: "0.020 gwei: PAYOFF pays 0.5 mUSDC",
    fullPayoutLabel: "0.030 gwei or higher: PAYOFF pays 1 mUSDC",
  },
} as const satisfies Record<string, DemoMarketProtocolConfig>;

export function getExplorerAddressUrl(address: Address) {
  return `${ARBITRUM_SEPOLIA_EXPLORER_URL}/address/${address}`;
}

export function getExplorerTxUrl(transactionHash: Hex) {
  return `${ARBITRUM_SEPOLIA_EXPLORER_URL}/tx/${transactionHash}`;
}
