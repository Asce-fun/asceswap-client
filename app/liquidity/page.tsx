"use client";

import React, { useState, useEffect } from "react";
import { FormattedMarket } from "../interface/types";
import { MARKETS, MARKET_META } from "../constants/markets";
import { getMarket, getLpPosition, getExchangeRateForLp } from "../blockchain/scripts/markets";
import { getMarketsPage } from "../blockchain/scripts/analytics";
import { formatMarket } from "../blockchain/utils/formatMarket";
import { PageLayout } from "../components/PageLayout";
import { LpCard } from "../components/LpCard";
import { LpModal } from "../components/LpModal";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export default function LiquidityPage() {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address;

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [marketDetailsMap, setMarketDetailsMap] = useState<
    Record<string, FormattedMarket>
  >({});
  const [lpPositionsMap, setLpPositionsMap] = useState<
    Record<string, { shares: number; value: number }>
  >({});

  // Fetch all market details in a single batch (or parallel fallback)
  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Try batch analytics call first
        const pairIds = MARKETS.map(m => m.id);
        const batchData = await getMarketsPage(pairIds);
        if (batchData && typeof batchData === 'object') {
          const markets = batchData.markets ?? batchData;
          if (Array.isArray(markets) && markets.length > 0) {
            const map: Record<string, FormattedMarket> = {};
            markets.forEach((m: any, i: number) => {
              if (m && pairIds[i]) {
                try {
                  map[pairIds[i]] = formatMarket(m) as FormattedMarket;
                } catch {
                  // skip malformed entries
                }
              }
            });
            if (Object.keys(map).length > 0) {
              setMarketDetailsMap(map);
              return;
            }
          }
        }
      } catch {
        // Batch call failed, fall through
      }

      // Fallback: individual calls in parallel
      const results = await Promise.all(
        MARKETS.map(async (market) => {
          try {
            const res = await getMarket(market.id);
            return { id: market.id, data: res as FormattedMarket };
          } catch {
            return { id: market.id, data: null };
          }
        })
      );

      const map: Record<string, FormattedMarket> = {};
      results.forEach(({ id, data }) => {
        if (data) map[id] = data;
      });
      setMarketDetailsMap(map);
    };

    fetchAll();
  }, []);

  // Fetch all LP positions in parallel when wallet connected and market data available
  useEffect(() => {
    if (!address) {
      setLpPositionsMap({});
      return;
    }

    const marketIds = Object.keys(marketDetailsMap);
    if (marketIds.length === 0) return;

    const fetchAllLp = async () => {
      const results = await Promise.all(
        MARKETS.map(async (market) => {
          try {
            const details = marketDetailsMap[market.id];
            if (!details) return { id: market.id, data: null };
            const decimals = MARKET_META[market.id]?.decimals ?? (details as any).decimals ?? 6;
            const [res, exchangeRate] = await Promise.all([
              getLpPosition(String(details.pairId), address),
              getExchangeRateForLp(String(details.pairId)).catch(() => BigInt(10 ** decimals)),
            ]);
            const shares = Number(res.shares) / 10 ** decimals;
            const sharePrice = Number(exchangeRate) / 10 ** decimals;
            if (shares > 0) {
              return { id: market.id, data: { shares, value: shares * sharePrice } };
            }
            return { id: market.id, data: null };
          } catch {
            return { id: market.id, data: null };
          }
        })
      );

      const map: Record<string, { shares: number; value: number }> = {};
      results.forEach(({ id, data }) => {
        if (data) map[id] = data;
      });
      setLpPositionsMap(map);
    };

    fetchAllLp();
  }, [address, marketDetailsMap]);

  const selectedMarket = selectedMarketId
    ? (MARKETS.find((m) => m.id === selectedMarketId) ?? null)
    : null;
  const selectedDetails = selectedMarketId
    ? (marketDetailsMap[selectedMarketId] ?? null)
    : null;

  return (
    <PageLayout showFooter={false}>
      <div>
        {/* Page Header */}
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#e8e6ee] mb-2">
            Liquidity Pools
          </h2>
          <p className="text-sm text-[#9896a3]">
            Earn fees by backing the other side of every rate prediction.
          </p>
        </div>

        {/* LP Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MARKETS.map((market) => {
            const lp = lpPositionsMap[market.id];
            return (
              <LpCard
                key={market.id}
                market={market}
                marketDetails={marketDetailsMap[market.id] ?? null}
                hasPosition={!!lp}
                positionValue={lp?.value}
                onClick={() => setSelectedMarketId(market.id)}
              />
            );
          })}
        </div>

        {/* LP Modal */}
        {selectedMarket && (
          <LpModal
            isOpen={!!selectedMarket}
            onClose={() => setSelectedMarketId(null)}
            market={selectedMarket}
            marketDetails={selectedDetails}
          />
        )}
      </div>
    </PageLayout>
  );
}
