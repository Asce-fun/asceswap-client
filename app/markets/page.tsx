'use client';

import React, { useState, useEffect } from 'react';
import { SwapCard } from '../components/SwapCard';
import { MARKETS } from '../constants/markets';
import { PageLayout } from '../components/PageLayout';
import { FormattedMarket } from '../interface/types';
import { getMarketsPage } from '../blockchain/scripts/analytics';
import { getMarket } from '../blockchain/scripts/markets';
import { formatMarket } from '../blockchain/utils/formatMarket';

export default function MarketsPage() {
  const [marketDetailsMap, setMarketDetailsMap] = useState<Record<string, FormattedMarket>>({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Try batch analytics call first (single RPC call for all markets)
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
        // Batch call failed, fall through to individual calls
      }

      // Fallback: individual calls in parallel (still better than 6 separate useEffects)
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

  return (
    <PageLayout showFooter={false}>
      <div>
        <div className="mb-10">
          <h2 className="font-serif font-normal text-[#e8e6ee] mb-2 text-3xl md:text-4xl tracking-tight">
            Available Markets
          </h2>
          <p className="text-sm text-[#9896a3]">
            Select a market to trade interest rate swaps or provide liquidity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MARKETS.map((market) => (
            <SwapCard
              key={market.id}
              market={market}
              batchMarketDetails={marketDetailsMap[market.id]}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
