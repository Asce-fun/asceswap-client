"use client";

import React, { useEffect, useState, useCallback } from "react";
import { provider } from "../blockchain/scripts/asceswapContract";
import { getMarketsPage } from "../blockchain/scripts/analytics";

interface NetworkStatus {
  blockNumber: number | null;
  rpcLatency: number | null;
  gasLevel: "Low" | "Med" | "High";
  tvl: number;
}

const POLL_INTERVAL = 30_000;

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
    tvl: 0,
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
        ...prev,
        blockNumber,
        rpcLatency: latency,
        gasLevel,
      }));
    } catch {
      setStatus((prev) => ({
        ...prev,
        rpcLatency: null,
        blockNumber: null,
      }));
    }
  }, []);

  // Fetch real TVL from analytics batch call
  const fetchTvl = useCallback(async () => {
    try {
      const raw = await getMarketsPage(['1', '2', '3', '4', '5', '6']);
      if (raw && typeof raw === 'object') {
        // Try to extract total TVL from the batch response
        const totalTvl = Number(raw.total_protocol_tvl ?? raw.totalProtocolTvl ?? 0);
        if (totalTvl > 0) {
          setStatus((prev) => ({ ...prev, tvl: totalTvl }));
        }
      }
    } catch {
      // TVL fetch failed, keep previous value
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchTvl();
    const id = setInterval(() => {
      fetchStatus();
      fetchTvl();
    }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchStatus, fetchTvl]);

  const gasColor =
    status.gasLevel === "Low"
      ? "#34d399"
      : status.gasLevel === "Med"
        ? "#fbbf24"
        : "#f87171";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-8 bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] border-t border-[rgba(180,175,200,0.06)] flex items-center px-4 select-none">
      <div className="max-w-full mx-auto w-full flex items-center gap-0 text-[11px] font-mono overflow-x-auto">
        {/* Network */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(180,175,200,0.06)] shrink-0">
          <span className="w-[6px] h-[6px] rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-[#9896a3]">Starknet Sepolia</span>
        </div>

        {/* RPC Latency */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(180,175,200,0.06)] shrink-0">
          <span className="text-[#5C5A66]">RPC</span>
          <span className="text-[#9896a3]">
            {status.rpcLatency !== null ? `${status.rpcLatency}ms` : "--"}
          </span>
        </div>

        {/* Block Number */}
        <div className="flex items-center gap-2 px-4 border-r border-[rgba(180,175,200,0.06)] shrink-0">
          <span className="text-[#5C5A66]">Block</span>
          <span className="text-[#9896a3]">
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
          <span className="text-[#9896a3]">{status.gasLevel}</span>
        </div>

        {/* TVL */}
        <div className="flex items-center gap-2 px-4 shrink-0">
          <span className="text-[#5C5A66]">TVL</span>
          <span className="text-[#6ee7b7]">{status.tvl > 0 ? formatTvl(status.tvl) : "--"}</span>
        </div>
      </div>
    </div>
  );
};
