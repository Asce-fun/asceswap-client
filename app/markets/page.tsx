'use client';

import React from 'react';
import { SwapCard } from '../components/SwapCard';
import { MARKETS } from '../constants/markets';
import { PageLayout } from '../components/PageLayout';

export default function MarketsPage() {
  return (
    <PageLayout showFooter={false}>
      <div>
        <div className="mb-10">
          <h2 className="font-serif font-normal text-white mb-2 text-3xl md:text-4xl tracking-tight">
            Available Markets
          </h2>
          <p className="text-sm text-[#8A8894]">
            Select a market to trade interest rate swaps or provide liquidity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MARKETS.map((market) => (
            <SwapCard key={market.id} market={market} />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
