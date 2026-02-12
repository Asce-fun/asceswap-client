"use client";

import React, { useState, useEffect } from "react";
import { FormattedMarket } from "../interface/types";
import { MARKETS } from "../constants/markets";
import { getMarket, getLpPosition } from "../blockchain/scripts/markets";
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

  // Fetch market details
  useEffect(() => {
    MARKETS.forEach(async (market) => {
      try {
        const res = await getMarket(market.id);
        if (res) {
          setMarketDetailsMap((prev) => ({
            ...prev,
            [market.id]: res as FormattedMarket,
          }));
        }
      } catch (err) {
        console.error(`Failed to fetch market ${market.id}`, err);
      }
    });
  }, []);

  // Fetch LP positions when wallet connected
  useEffect(() => {
    if (!address) {
      setLpPositionsMap({});
      return;
    }

    MARKETS.forEach(async (market) => {
      try {
        const details = marketDetailsMap[market.id];
        if (!details) return;
        const res = await getLpPosition(String(details.pairId), address);
        const shares = Number(res.shares) / 10 ** 6;
        if (shares > 0) {
          setLpPositionsMap((prev) => ({
            ...prev,
            [market.id]: { shares, value: shares * 1.016 },
          }));
        }
      } catch {
        // No LP position or fetch failed
      }
    });
  }, [address, Object.keys(marketDetailsMap).length]);

  const selectedMarket = selectedMarketId
    ? MARKETS.find((m) => m.id === selectedMarketId) ?? null
    : null;
  const selectedDetails = selectedMarketId
    ? marketDetailsMap[selectedMarketId] ?? null
    : null;

  return (
    <PageLayout>
      <div>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
            <h2 className="font-semibold text-white text-2xl md:text-3xl tracking-tight">
              Liquidity Pools
            </h2>
          </div>
          <p className="text-sm text-[#8A8894] ml-[18px]">
            Supply liquidity to earn swap fees and trader PnL
          </p>
        </div>

        {/* LP Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
