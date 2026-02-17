"use client";

import React, { useEffect, useState, useCallback } from "react";
import { provider } from "../blockchain/scripts/asceswapContract";

interface NetworkStatus {
  blockNumber: number | null;
  rpcLatency: number | null;
  gasLevel: "Low" | "Med" | "High";
  strkPrice: number;
  tvl: number;
}

const POLL_INTERVAL = 30_000;

// Mock STRK price with small drift
function mockStrkPrice(prev: number): number {
  const drift = (Math.random() - 0.48) * 0.008;
  return Math.max(0.1, parseFloat((prev + drift).toFixed(4)));
}

// Mock TVL with small drift
function mockTvl(prev: number): number {
  const drift = (Math.random() - 0.48) * 12_000;
  return Math.max(100_000, Math.round(prev + drift));
}

function formatTvl(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val}`;
}

export const NetworkStatusBar: React.FC = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    blockNumber: null,
    rpcLatency: null,
    gasLevel: "Low",
    strkPrice: 0.042,
    tvl: 2_412_500,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const start = performance.now();
      const block = await provider.getBlockLatestAccepted();
      const latency = Math.round(performance.now() - start);

      const blockNumber =
        typeof block.block_number === "number" ? block.block_number : null;

      // Simple gas heuristic based on latency
      let gasLevel: "Low" | "Med" | "High" = "Low";
      if (latency > 800) gasLevel = "High";
      else if (latency > 400) gasLevel = "Med";

      setStatus((prev) => ({
        blockNumber,
        rpcLatency: latency,
        gasLevel,
        strkPrice: mockStrkPrice(prev.strkPrice),
        tvl: mockTvl(prev.tvl),
      }));
    } catch {
      setStatus((prev) => ({
        ...prev,
        rpcLatency: null,
        blockNumber: null,
      }));
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const gasColor =
    status.gasLevel === "Low"
      ? "#34d399"
      : status.gasLevel === "Med"
        ? "#fbbf24"
        : "#f43f5e";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-8 bg-[#0A0A0C] border-t border-[rgba(180,175,200,0.06)] flex items-center px-4 select-none">
      <div className="max-w-full mx-auto w-full flex items-center gap-0 text-[11px] font-mono overflow-x-auto">
        {/* Network */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(180,175,200,0.06)] shrink-0">
          <span className="w-[6px] h-[6px] rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-[#BAB8C4]">Starknet Sepolia</span>
        </div>

        {/* RPC Latency */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(180,175,200,0.06)] shrink-0">
          <span className="text-[#5C5A66]">RPC</span>
          <span className="text-[#8A8894]">
            {status.rpcLatency !== null ? `${status.rpcLatency}ms` : "--"}
          </span>
        </div>

        {/* Block Number */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(180,175,200,0.06)] shrink-0">
          <span className="text-[#5C5A66]">Block</span>
          <span className="text-[#8A8894]">
            {status.blockNumber !== null
              ? `#${status.blockNumber.toLocaleString()}`
              : "--"}
          </span>
        </div>

        {/* Gas */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(180,175,200,0.06)] shrink-0">
          <span className="text-[#5C5A66]">Gas</span>
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ backgroundColor: gasColor }}
          />
          <span className="text-[#8A8894]">{status.gasLevel}</span>
        </div>

        {/* STRK Price */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(94,234,212,0.06)] shrink-0">
          <span className="text-[#5C5A66]">STRK</span>
          <span className="text-[#5eead4]">${status.strkPrice.toFixed(4)}</span>
        </div>

        {/* TVL */}
        <div className="flex items-center gap-2 px-4 shrink-0">
          <span className="text-[#5C5A66]">TVL</span>
          <span className="text-[#5eead4]">{formatTvl(status.tvl)}</span>
        </div>
      </div>
    </div>
  );
};
