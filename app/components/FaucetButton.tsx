"use client";

import { Droplets, Loader2 } from "lucide-react";
import { useState } from "react";

import { claimDemoMusdc } from "../contracts/asceswap";
import { ASCESWAP_CHAIN_ID, ASCESWAP_CHAIN_NAME, getExplorerTxUrl } from "../protocol/constants";
import type { Hex } from "../protocol/order";
import { useWallet } from "../wallet/WalletProvider";

type FaucetStatus = "idle" | "connecting" | "switching" | "claiming" | "claimed" | "error";

export function FaucetButton({ compact = false }: { compact?: boolean }) {
  const wallet = useWallet();
  const [status, setStatus] = useState<FaucetStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<Hex | null>(null);
  const isBusy = status === "connecting" || status === "switching" || status === "claiming";
  const isWrongChain = Boolean(wallet.chainId && wallet.chainId !== ASCESWAP_CHAIN_ID);
  const label = compact
    ? ""
    : status === "connecting" ? "Connecting"
      : status === "switching" ? "Switching"
        : status === "claiming" ? "Claiming"
          : status === "claimed" ? "Claimed"
            : isWrongChain ? "Switch"
              : "Faucet";
  const title = error
    ?? (transactionHash ? `Faucet tx: ${getExplorerTxUrl(transactionHash)}` : `Claim demo mUSDC on ${ASCESWAP_CHAIN_NAME}`);

  const handleClick = async () => {
    try {
      setError(null);
      setTransactionHash(null);
      setStatus(wallet.account && wallet.chainId ? "claiming" : "connecting");

      const connection = wallet.account && wallet.chainId
        ? { account: wallet.account, chainId: wallet.chainId }
        : await wallet.connect();

      if (connection.chainId !== ASCESWAP_CHAIN_ID) {
        setStatus("switching");
        await wallet.switchChain(ASCESWAP_CHAIN_ID);
      }

      const provider = wallet.provider ?? window.ethereum;

      if (!provider) {
        throw new Error("No injected wallet was found.");
      }

      setStatus("claiming");
      const nextTransactionHash = await claimDemoMusdc(provider, connection.account);
      setTransactionHash(nextTransactionHash);
      setStatus("claimed");
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Faucet claim failed.");
      setStatus("error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy || wallet.status === "unavailable"}
      title={title}
      className={`flex h-9 items-center justify-center gap-2 rounded-md border border-[#b7decf] bg-[#e3f5ee] px-3 text-sm font-semibold text-[#047857] transition hover:border-[#059669]/55 hover:bg-[#d7f0e6] disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "w-9 px-0" : "w-[106px]"
      }`}
    >
      {isBusy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Droplets className="h-4 w-4 shrink-0" />}
      {compact ? null : <span className="min-w-0 truncate">{label}</span>}
    </button>
  );
}
