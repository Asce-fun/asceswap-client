"use client";

import React, { useEffect, useState, useCallback } from "react";
import { provider } from "../blockchain/scripts/asceswapContract";

interface NetworkStatus {
  blockNumber: number | null;
  rpcLatency: number | null;
  gasLevel: "Low" | "Med" | "High";
}

const POLL_INTERVAL = 30_000;

export const NetworkStatusBar: React.FC = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    blockNumber: null,
    rpcLatency: null,
    gasLevel: "Low",
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
        <div className="flex items-center gap-2 px-4 shrink-0">
          <span className="text-[#5C5A66]">Gas</span>
          <span
            className="w-[6px] h-[6px] rounded-full"
            style={{ backgroundColor: gasColor }}
          />
          <span className="text-[#9896a3]">{status.gasLevel}</span>
        </div>
      </div>
    </div>
  );
};
