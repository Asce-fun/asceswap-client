import { isStarknetWallet } from "@dynamic-labs/starknet";
import type { Wallet } from "@dynamic-labs/wallet-connector-core";

/**
 * Minimal type for a Starknet account used in transaction execution.
 * We define this instead of using AccountInterface directly because
 * Dynamic Labs' WalletAccount may come from a different starknet.js version.
 */
export type StarknetAccount = {
  address: string;
  execute: (calls: any | any[]) => Promise<{ transaction_hash: string }>;
};

/**
 * Get the Starknet account from the Dynamic Labs primaryWallet.
 *
 * We avoid `getWalletAccount()` because it uses the deprecated WalletAccount
 * constructor which fails in starknet.js v9. Instead, we access the connector's
 * `wallet` property (the wallet-specific StarknetWindowObject) directly.
 * This ensures we use the exact wallet the user connected with (Braavos/Argent).
 */
export async function getStarknetAccount(
  primaryWallet: Wallet | null
): Promise<StarknetAccount> {
  if (!primaryWallet) {
    throw new Error("No wallet connected. Please connect your wallet.");
  }

  if (!isStarknetWallet(primaryWallet)) {
    throw new Error("Connected wallet is not a Starknet wallet.");
  }

  // The connector stores the wallet-specific StarknetWindowObject
  // (e.g., window.starknet_braavos or window.starknet_argentX)
  const connector = (primaryWallet as any).connector;
  const swo = connector?.wallet;

  if (swo) {
    // Ensure the wallet is connected/enabled
    if (!swo.isConnected) {
      await swo.enable({ starknetVersion: "v5" });
    }

    const account = swo.account;
    if (account?.address) {
      return account as StarknetAccount;
    }
  }

  // Fallback: use the connector id to find the wallet-specific window object
  const connectorId = connector?.id;
  if (connectorId) {
    const windowKey = `starknet_${connectorId}`;
    const walletObj = (window as any)[windowKey];

    if (walletObj) {
      if (!walletObj.isConnected) {
        await walletObj.enable({ starknetVersion: "v5" });
      }

      const account = walletObj.account;
      if (account?.address) {
        return account as StarknetAccount;
      }
    }
  }

  throw new Error(
    "Wallet account not available. Please reconnect your wallet."
  );
}
