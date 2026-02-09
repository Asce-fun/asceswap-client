
'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Terminal } from './components/Terminal';
import { Stats } from './components/Stats';
import { Footer } from './components/Footer';
import { SwapCard } from './components/SwapCard';
import { Duration, MarketData } from './interface/types';

export const MARKETS: MarketData[] = [
  { 
    id: '1', 
    protocol: 'Asceswap',
    name: 'X mockUSDC Borrow Rate', 
    oracleRate: 7.22, 
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29 // ~23h 45m
  },
    { 
    id: '2', 
    protocol: 'Asceswap',
    name: 'ETH Borrow Rate', 
    oracleRate: 7.22, 
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29 // ~23h 45m
  },
    { 
    id: '3', 
    protocol: 'Asceswap',
    name: 'STRK Borrow Rate', 
    oracleRate: 7.22, 
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29 // ~23h 45m
  },
    { 
    id: '4', 
    protocol: 'Asceswap',
    name: 'DAI Savings Rate', 
    oracleRate: 7.22, 
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29 // ~23h 45m
  },
      { 
    id: '5', 
    protocol: 'Asceswap',
    name: 'USDT Borrow Rate', 
    oracleRate: 7.22, 
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29 // ~23h 45m
  },
        { 
    id: '6', 
    protocol: 'Asceswap',
    name: 'wBTC Borrow Rate', 
    oracleRate: 7.22, 
    fixedDuration: Duration.D1,
    maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29 // ~23h 45m
  },
  // { 
  //   id: '2', 
  //   protocol: 'Vesu', 
  //   name: 'STRK Supply Yield', 
  //   oracleRate: 8.04, 
  //   fixedDuration: Duration.D7,
  //   maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 60 * 2 // ~6d 2h
  // },
  // { 
  //   id: '3', 
  //   protocol: 'Nostra', 
  //   name: 'USDC Supply Yield', 
  //   oracleRate: 12.15, 
  //   fixedDuration: Duration.D30,
  //   maturityTimestamp: Date.now() + 1000 * 60 * 60 * 24 * 29 // ~29d
  // },
];

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme ? savedTheme === 'dark' : true;
    setIsDark(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark, mounted]); 

  const toggleTheme = () => setIsDark(prev => !prev);

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-200 transition-colors duration-500 bg-white dark:bg-[#080a0e]">
      {/* Grid Background */}
      <div className="fixed inset-0 z-0 bg-grid pointer-events-none opacity-80 dark:opacity-70"></div>
      
      {/* Background Blobs - Deep Blue and Purple, refined for contrast */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 dark:bg-purple-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>

      <div className="relative z-10 flex flex-col">
        <Header isDark={isDark} toggleTheme={toggleTheme} />

        <main className="grow pt-28 pb-32">
          <div className="max-w-7xl mx-auto px-6">
            <Hero />
            <div className="mt-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MARKETS.map((market) => (
              <SwapCard key={market.id} market={market} />
            ))}
          </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
