
'use client';

import React, { useState, useMemo } from 'react';
import { Check, TrendingUp, TrendingDown, Zap, Lock, ArrowRight, Activity } from 'lucide-react';
import { MarketSide, Duration } from '../interface/types';

export const Terminal: React.FC = () => {
  const [duration, setDuration] = useState<Duration>(Duration.D7);
  const [side, setSide] = useState<MarketSide>(MarketSide.FIXED_TAKER);
  const [notional, setNotional] = useState(100000);

  const leverage = useMemo(() => {
    switch (duration) {
      case Duration.D1: return 6000;
      case Duration.D7: return 800;
      case Duration.D30: return 200;
    }
  }, [duration]);

  const collateral = notional / leverage;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="relative max-w-5xl mx-auto animate-float float-css">
      {/* Intense glow behind terminal for floating effect */}
      <div className="absolute -inset-10 bg-blue-600/5 dark:bg-blue-500/10 blur-[100px] pointer-events-none rounded-full"></div>
      
      {/* Main Terminal Card with massive shadow */}
      <div className="relative rounded-4xl border border-slate-200 dark:border-white/8 bg-white dark:bg-[#0c0e14] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3),0_0_1px_rgba(255,255,255,0.1)] dark:shadow-[0_50px_120px_-30px_rgba(0,0,0,0.8),0_0_2px_rgba(255,255,255,0.05)] overflow-hidden ring-1 ring-black/5 dark:ring-blue-500/20">
        
        {/* Terminal Header */}
        <div className="h-20 border-b border-slate-100 dark:border-white/5 flex items-center justify-between px-10 bg-slate-50/50 dark:bg-[#0c0e14]/50 backdrop-blur-md">
          <div className="flex items-center gap-5">
            <div className="flex items-center -space-x-3">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-[13px] font-black text-white ring-4 ring-white dark:ring-[#0c0e14] shadow-lg">U</div>
              <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-[13px] font-black text-white ring-4 ring-white dark:ring-[#0c0e14] shadow-lg">A</div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">Aave V3 USDC</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-black/5 dark:border-white/5 tracking-tighter">MAINNET</span>
              </div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-60">Oracle Rate</div>
              <div className="font-mono text-base font-bold text-slate-900 dark:text-white flex items-center justify-end gap-2">
                5.44%
                <span className="text-trade-up text-xs font-black text-[#10B981]">+0.06%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 opacity-60">Liquidity</div>
              <div className="font-mono text-base font-bold text-slate-900 dark:text-white">$5.24M</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 min-h-145">
          
          {/* Main Controls */}
          <div className="lg:col-span-7 p-10 border-r border-slate-100 dark:border-white/5">
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl mb-10 border border-slate-200/50 dark:border-white/5">
              {Object.values(Duration).map((d) => (
                <button 
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs transition-all duration-300 ${
                    duration === d 
                      ? 'bg-white dark:bg-[#1e293b] shadow-xl text-brand-600 dark:text-white font-black' 
                      : 'font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="block uppercase tracking-wider mb-0.5">{d}</span>
                  <span className={`text-[10px] opacity-60 ${duration === d ? 'text-blue-500 dark:text-blue-400' : ''}`}>
                    {d === Duration.D1 ? '6000x' : d === Duration.D7 ? '800x' : '200x'}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Select Side</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Fixed Side */}
              <button 
                onClick={() => setSide(MarketSide.FIXED_TAKER)}
                className={`relative group text-left rounded-3xl border-2 p-8 transition-all duration-300 ${
                  side === MarketSide.FIXED_TAKER 
                    ? 'border-blue-500 bg-blue-50/5 dark:bg-blue-500/3 shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50' 
                    : 'border-slate-100 dark:border-white/5 bg-transparent opacity-60 hover:opacity-100 hover:border-slate-200 dark:hover:border-white/10'
                }`}
              >
                {side === MarketSide.FIXED_TAKER && (
                  <div className="absolute top-6 right-6 animate-fade-in">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,1)]">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${side === MarketSide.FIXED_TAKER ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="font-black text-slate-900 dark:text-white mb-2 tracking-tight text-lg">Fixed Taker</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">Profit if variable rates <span className="font-bold text-slate-900 dark:text-white">RISE</span> above fixed rate.</p>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pay Fixed Rate</div>
                <div className="text-3xl font-mono font-black text-blue-600 dark:text-blue-400">5.46%</div>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Yield</span>
                   <span className="text-xs font-black text-blue-500">142% APR</span>
                </div>
              </button>

              {/* Variable Side */}
              <button 
                onClick={() => setSide(MarketSide.VARIABLE_TAKER)}
                className={`relative group text-left rounded-[1.5rem] border-2 p-8 transition-all duration-300 ${
                  side === MarketSide.VARIABLE_TAKER 
                    ? 'border-blue-500 bg-blue-50/5 dark:bg-blue-500/[0.03] shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] ring-1 ring-blue-500/50' 
                    : 'border-slate-100 dark:border-white/5 bg-transparent opacity-60 hover:opacity-100 hover:border-slate-200 dark:hover:border-white/10'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${side === MarketSide.VARIABLE_TAKER ? 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div className="font-black text-slate-900 dark:text-white mb-2 tracking-tight text-lg">Variable Taker</div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">Profit if variable rates <span className="font-bold text-slate-900 dark:text-white">FALL</span> below fixed rate.</p>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pay Variable Rate</div>
                <div className="text-3xl font-mono font-black text-slate-700 dark:text-slate-200">Current</div>
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Yield</span>
                   <span className="text-xs font-black text-slate-500 dark:text-slate-400">98% APR</span>
                </div>
              </button>
            </div>
          </div>

          {/* Checkout / Summary */}
          <div className="lg:col-span-5 p-10 bg-slate-50/50 dark:bg-[#080a10] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">Position Size</h3>
                <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-black border border-amber-500/20 flex items-center gap-1.5 shadow-sm">
                  <Zap className="w-3 h-3 fill-current" /> High Leverage
                </div>
              </div>

              <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-white/[0.08] rounded-[1.25rem] p-6 mb-8 shadow-xl dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mb-2 opacity-60">Notional Amount (USDC)</div>
                <div className="flex items-center justify-between">
                  <input 
                    type="text" 
                    value={notional.toLocaleString()} 
                    readOnly
                    className="w-full bg-transparent font-mono text-3xl font-black text-slate-900 dark:text-white outline-none" 
                  />
                  <span className="text-xs font-black text-slate-400 dark:text-slate-500">USDC</span>
                </div>
              </div>

              <div className="mb-12 px-2">
                <input 
                  type="range" 
                  min="5000" 
                  max="1000000" 
                  step="5000"
                  value={notional}
                  onChange={(e) => setNotional(Number(e.target.value))}
                  className="w-full cursor-pointer accent-blue-500" 
                />
                <div className="flex justify-between mt-4 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
                  <span>$1K</span>
                  <span>$1M</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1a2333] rounded-[1.5rem] p-8 text-slate-900 dark:text-white mb-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.7)] relative overflow-hidden group">
                <div className="absolute bottom-0 left-0 h-1.5 bg-blue-500 w-2/3 shadow-[0_0_15px_rgba(59,130,246,1)] transition-all duration-700 group-hover:w-full"></div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-blue-500 dark:text-blue-400">Required Collateral</span>
                  <Lock className="w-4 h-4 text-slate-400 dark:text-white/40" />
                </div>
                <div className="text-4xl font-mono font-black mb-3">
                  {formatCurrency(collateral)}
                  <span className="text-base font-medium text-slate-400 ml-3">for $100k exposure</span>
                </div>
                <div className="text-right text-[10px] font-black text-blue-500/80 tracking-widest">
                  {leverage}x Leverage
                </div>
              </div>

              <div className="space-y-4 mb-10 px-2">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-slate-500">Liquidation Rate</span>
                  <span className="text-slate-900 dark:text-slate-300">5.51%</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-slate-500">Breakeven</span>
                  <span className="text-slate-900 dark:text-slate-300">5.47%</span>
                </div>
                <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                  <span className="text-slate-400 dark:text-slate-500">Est. Daily P&L</span>
                  <span className="text-trade-up">+$32.40</span>
                </div>
              </div>
            </div>

            <button className="group w-full py-5 bg-white text-slate-950 dark:bg-white dark:text-slate-950 rounded-2xl text-sm font-black shadow-[0_15px_40px_-10px_rgba(255,255,255,0.2),0_10px_20px_rgba(0,0,0,0.4)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] border border-black/5">
              Open Long Position
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
