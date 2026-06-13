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
            ? "border-[#059669]/28 bg-[#e3f5ee] text-[#047857] hover:border-[#059669]/55"
            : "border-[#059669]/40 bg-[#059669] text-white hover:border-[#047857] hover:bg-[#047857]"
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
