"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type Address, type Hex, isAddress, isHex } from "../protocol/order";

type WalletStatus = "checking" | "idle" | "connecting" | "connected" | "unavailable";

export type EthereumProvider = {
  request<T = unknown>(args: { method: string; params?: unknown[] | object }): Promise<T>;
  on?(event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void): void;
  removeListener?(event: "accountsChanged" | "chainChanged", listener: (...args: unknown[]) => void): void;
};

type ConnectResult = Readonly<{
  account: Address;
  chainId: number;
}>;

type WalletContextValue = Readonly<{
  account: Address | null;
  chainId: number | null;
  error: string | null;
  provider: EthereumProvider | null;
  status: WalletStatus;
  connect: () => Promise<ConnectResult>;
  signTypedData: (typedData: object, signer?: Address) => Promise<Hex>;
  switchChain: (chainId: number) => Promise<void>;
}>;

const WalletContext = createContext<WalletContextValue | null>(null);

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("checking");
  const [account, setAccount] = useState<Address | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const accountRef = useRef<Address | null>(null);

  const applyAccount = useCallback((nextAccount: Address | null) => {
    accountRef.current = nextAccount;
    setAccount(nextAccount);
  }, []);

  const readChainId = useCallback(async (provider: EthereumProvider) => {
    const chainHex = await provider.request<string>({ method: "eth_chainId" });
    return parseChainId(chainHex);
  }, []);

  const connect = useCallback(async (): Promise<ConnectResult> => {
    const provider = window.ethereum;

    if (!provider) {
      setStatus("unavailable");
      throw new Error("No injected wallet was found.");
    }

    setStatus("connecting");
    setError(null);

    try {
      const accounts = await provider.request<string[]>({ method: "eth_requestAccounts" });
      const nextAccount = normalizeAccount(accounts[0]);
      const nextChainId = await readChainId(provider);

      applyAccount(nextAccount);
      setChainId(nextChainId);
      setStatus("connected");

      return { account: nextAccount, chainId: nextChainId };
    } catch (requestError) {
      const message = getWalletErrorMessage(requestError);
      setError(message);
      setStatus(account ? "connected" : "idle");
      throw new Error(message);
    }
  }, [account, applyAccount, readChainId]);

  const signTypedData = useCallback(async (typedData: object, signer?: Address): Promise<Hex> => {
    const provider = window.ethereum;

    if (!provider) {
      throw new Error("No injected wallet was found.");
    }

    const activeAccount = accountRef.current;
    const signingAccount = signer ?? activeAccount;

    if (!signingAccount) {
      throw new Error("Connect a wallet before signing.");
    }

    if (signer && activeAccount && signer.toLowerCase() !== activeAccount.toLowerCase()) {
      throw new Error("Active wallet account changed before signing.");
    }

    const signature = await provider.request<string>({
      method: "eth_signTypedData_v4",
      params: [signingAccount, JSON.stringify(typedData)],
    });

    if (!isHex(signature)) {
      throw new Error("Wallet returned an invalid signature.");
    }

    return signature;
  }, []);

  const switchChain = useCallback(async (targetChainId: number) => {
    const provider = window.ethereum;

    if (!provider) {
      throw new Error("No injected wallet was found.");
    }

    const chainIdHex = `0x${targetChainId.toString(16)}`;
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    setChainId(targetChainId);
  }, []);

  useEffect(() => {
    const provider = window.ethereum;

    if (!provider) {
      queueMicrotask(() => setStatus("unavailable"));
      return;
    }

    let mounted = true;

    const syncWallet = async () => {
      try {
        const [accounts, nextChainId] = await Promise.all([
          provider.request<string[]>({ method: "eth_accounts" }),
          readChainId(provider),
        ]);
        if (!mounted) return;

        const nextAccount = accounts[0] ? normalizeAccount(accounts[0]) : null;
        applyAccount(nextAccount);
        setChainId(nextChainId);
        setStatus(nextAccount ? "connected" : "idle");
      } catch (syncError) {
        if (!mounted) return;
        setStatus("idle");
        setError(getWalletErrorMessage(syncError));
      }
    };

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = Array.isArray(args[0]) ? args[0] : [];
      const nextAccount = typeof accounts[0] === "string" ? normalizeAccount(accounts[0]) : null;
      applyAccount(nextAccount);
      setStatus(nextAccount ? "connected" : "idle");
    };

    const handleChainChanged = (...args: unknown[]) => {
      const nextChainId = typeof args[0] === "string" ? parseChainId(args[0]) : null;
      setChainId(nextChainId);
    };

    void syncWallet();
    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      mounted = false;
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [applyAccount, readChainId]);

  const value = useMemo<WalletContextValue>(() => ({
    account,
    chainId,
    connect,
    error,
    provider: typeof window === "undefined" ? null : window.ethereum ?? null,
    signTypedData,
    switchChain,
    status,
  }), [account, chainId, connect, error, signTypedData, status, switchChain]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider.");
  }

  return context;
}

export function formatAddress(address: Address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function normalizeAccount(account: string | undefined): Address {
  if (!account || !isAddress(account)) {
    throw new Error("Wallet returned an invalid account.");
  }

  return account;
}

function parseChainId(chainHex: string): number {
  if (!/^0x[0-9a-fA-F]+$/.test(chainHex)) {
    throw new Error("Wallet returned an invalid chain id.");
  }

  const chainId = Number.parseInt(chainHex, 16);

  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error("Wallet returned an unsupported chain id.");
  }

  return chainId;
}

function getWalletErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "object" && error && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }

  return "Wallet request failed.";
}
