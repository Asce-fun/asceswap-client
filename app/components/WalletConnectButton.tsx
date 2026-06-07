"use client";

import { Loader2, Wallet } from "lucide-react";

import { formatAddress, useWallet } from "../wallet/WalletProvider";

export function WalletConnectButton({ compact = false }: { compact?: boolean }) {
  const { account, connect, error, status } = useWallet();
  const isBusy = status === "checking" || status === "connecting";
  const isUnavailable = status === "unavailable";

  const label = account
    ? compact ? formatAddress(account) : formatHeaderAddress(account)
    : isUnavailable ? "No wallet" : "Connect";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          if (!account && !isUnavailable) void connect();
        }}
        disabled={isBusy || isUnavailable}
        title={error ?? (account ? formatAddress(account) : label)}
        className={`flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-semibold transition ${
          account
            ? "border-[#2ee59d]/28 bg-[rgba(18,48,38,0.72)] text-[#d7fff0] hover:border-[#2ee59d]/55"
            : "border-[#7cf3bd]/40 bg-[#7cf3bd] text-[#03100b] hover:border-[#a7ffd4] hover:bg-[#9af7ca]"
        } ${isUnavailable ? "cursor-not-allowed opacity-60" : ""} ${compact ? "w-9 justify-center px-0" : "w-[106px] justify-center overflow-hidden"}`}
      >
        {isBusy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Wallet className="h-4 w-4 shrink-0" />}
        {compact ? null : <span className="min-w-0 truncate">{label}</span>}
      </button>
    </div>
  );
}

function formatHeaderAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-3)}`;
}
