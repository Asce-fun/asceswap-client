"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { MARKETS, MARKET_META } from "../constants/markets";
import { FormattedMarket } from "../interface/types";
import { getMarketsPage } from "../blockchain/scripts/analytics";
import { getMarket } from "../blockchain/scripts/markets";
import { formatMarket } from "../blockchain/utils/formatMarket";
import { getOracleRateHistory } from "../blockchain/scripts/oracleContract";
import { compute24hChange } from "../blockchain/utils/utils";
import { getProtocolLogo } from "./SwapCard";

interface MarketRow {
  id: string;
  name: string;
  protocol: string;
  rate: number;
  change24h: number;
  termDays: string;
  tvl: number;
  activeSwaps: number;
}

export const LiveMarketsStrip: React.FC = () => {
  const [rows, setRows] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const pairIds = MARKETS.map((m) => m.id);
      const formatted: Record<string, FormattedMarket> = {};

      // 1. Try batch analytics call first (mirrors markets/page.tsx)
      try {
        const batchData = await getMarketsPage(pairIds);
        if (batchData && typeof batchData === "object") {
          const markets = batchData.markets ?? batchData;
          if (Array.isArray(markets) && markets.length > 0) {
            markets.forEach((m: any, i: number) => {
              if (m && pairIds[i]) {
                try {
                  formatted[pairIds[i]] = formatMarket(m) as FormattedMarket;
                } catch {
                  // skip malformed entries
                }
              }
            });
          }
        }
      } catch {
        // Batch call failed, fall through to individual calls
      }

      // 2. Fallback: individual getMarket() calls for any missing markets
      const missing = pairIds.filter((id) => !formatted[id]);
      if (missing.length > 0) {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const res = await getMarket(id);
              return { id, data: res as FormattedMarket };
            } catch {
              return { id, data: null };
            }
          })
        );
        results.forEach(({ id, data }) => {
          if (data) formatted[id] = data;
        });
      }

      // 3. Fetch 24h changes in parallel
      const changeMap: Record<string, number> = {};
      try {
        const changeResults = await Promise.all(
          MARKETS.map(async (market) => {
            const meta = MARKET_META[market.id];
            const fm = formatted[market.id];
            if (!meta?.oracleAddress || !fm) return { id: market.id, change: 0 };
            try {
              const history = await getOracleRateHistory(meta.oracleAddress, 24);
              const currentBps = fm.rate.currentPct * 100;
              return {
                id: market.id,
                change: parseFloat(compute24hChange(history, currentBps).toFixed(2)),
              };
            } catch {
              return { id: market.id, change: 0 };
            }
          })
        );
        changeResults.forEach((r) => {
          changeMap[r.id] = r.change;
        });
      } catch {
        // 24h changes are non-critical
      }

      // 4. Build rows
      const builtRows: MarketRow[] = MARKETS.map((market) => {
        const fm = formatted[market.id];
        return {
          id: market.id,
          name: market.name,
          protocol: market.protocol,
          rate: fm?.rate?.currentPct ?? 0,
          change24h: changeMap[market.id] ?? 0,
          termDays: fm?.params?.swapTermDays ? `${fm.params.swapTermDays}d` : "--",
          tvl: fm?.pool?.totalCollateral ?? 0,
          activeSwaps: fm?.stats?.activeSwaps ?? 0,
        };
      });

      setRows(builtRows);
      setLoading(false);
    };

    fetchAll();
  }, []);


  return (
    <section id="live-markets" className="mt-24 mb-16">
      <div className="text-center mb-10">
        <h2
          className="font-serif font-normal text-[#e8e6ee] mb-4 leading-[1.1] tracking-[-0.02em]"
          style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
        >
          Live{" "}
          <em className="italic text-transparent bg-clip-text bg-gradient-to-br from-[#6ee7b7] to-[#34d399]">
            Markets
          </em>
        </h2>
        <p className="text-[#9896a3] text-sm max-w-md mx-auto">
          Real-time rates fetched directly from Starknet.
        </p>
      </div>

      {/* Market Rows — show top 2 */}
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] rounded-[16px] bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] border border-[#1e1e2a] animate-pulse"
              />
            ))
          : rows.slice(0, 2).map((row) => {
              const ProtocolLogo = getProtocolLogo(row.protocol);
              return (
                <div
                  key={row.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 justify-between
            px-5 py-4 rounded-[16px] bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px]
            border border-[#1e1e2a]
            hover:border-[rgba(52,211,153,0.15)]
            transition-all duration-300"
                >
                  {/* Left: Logo + Name */}
                  <div className="flex items-center gap-3 sm:w-[280px]">
                    <ProtocolLogo size={32} />
                    <div>
                      <div className="text-sm font-bold text-[#e8e6ee] tracking-tight">
                        {row.protocol}
                      </div>
                      <div className="text-[10px] text-[#5c5a66] uppercase tracking-wider">
                        {row.name}
                      </div>
                    </div>
                  </div>

                  {/* Center: Rate + Change + Term */}
                  <div className="flex items-center gap-6 sm:gap-8">
                    <div className="text-right sm:text-left">
                      <div className="text-[10px] text-[#5c5a66] uppercase tracking-wider mb-0.5 hidden sm:block">
                        Rate
                      </div>
                      <span className="text-lg font-mono font-bold text-[#e8e6ee]">
                        {row.rate.toFixed(2)}%
                      </span>
                    </div>

                    <div className="text-right sm:text-left">
                      <div className="text-[10px] text-[#5c5a66] uppercase tracking-wider mb-0.5 hidden sm:block">
                        24h
                      </div>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          row.change24h >= 0
                            ? "text-[#34d399] bg-[rgba(52,211,153,0.12)]"
                            : "text-[#f87171] bg-[rgba(248,113,113,0.12)]"
                        }`}
                      >
                        {row.change24h >= 0 ? "+" : ""}
                        {row.change24h.toFixed(2)}%
                      </span>
                    </div>

                    <div className="text-right sm:text-left">
                      <div className="text-[10px] text-[#5c5a66] uppercase tracking-wider mb-0.5 hidden sm:block">
                        Term
                      </div>
                      <span className="text-xs font-mono font-bold text-[#9896a3]">
                        {row.termDays}
                      </span>
                    </div>
                  </div>

                  {/* Right: Trade CTA */}
                  <Link
                    href="/markets"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
              text-[#34d399] text-xs font-semibold
              border border-[rgba(52,211,153,0.15)]
              hover:bg-[rgba(52,211,153,0.08)]
              hover:border-[rgba(52,211,153,0.35)]
              transition-all duration-200 group/trade
              self-end sm:self-auto"
                  >
                    Trade
                    <ArrowRight className="w-3.5 h-3.5 group-hover/trade:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              );
            })}
      </div>

      {/* View All Markets CTA */}
      {!loading && rows.length > 0 && (
        <div className="text-center mt-6">
          <Link
            href="/markets"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-[20px]
    border border-[#1e1e2a]
    text-[#e8e6ee]
    hover:text-[#e8e6ee]
    hover:border-[rgba(52,211,153,0.15)]
    hover:bg-[#16161e]
    font-semibold text-[15px]
    transition-all duration-200
    group"
          >
            View All Markets
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      )}

    </section>
  );
};
