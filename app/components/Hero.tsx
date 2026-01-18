
'use client';

import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export const Hero: React.FC = () => {
  const [isJoined, setIsJoined] = useState(false);

  const handleJoin = () => {
    setIsJoined(true);
    setTimeout(() => setIsJoined(false), 3000);
  };

  return (
    <div className="text-center">
      {/* Coming Soon Badge - Exact match to Screenshot 2 */}
      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-slate-800 bg-slate-900/60 text-slate-300 text-[10px] font-bold uppercase tracking-[0.25em] mb-12 animate-fade-in backdrop-blur-sm shadow-xl">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,1)]"></span>
        </span>
        Coming Soon
      </div>

      {/* Heading - Exact colors from Screenshot 2 */}
      <h1 className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.05]">
        Derivatives for <br/>
        <span className="text-transparent bg-clip-text bg-linear-to-r from-[#38bdf8] via-[#818cf8] to-[#a270ff] filter drop-shadow-[0_15px_40px_rgba(56,189,248,0.3)]">
          Yield Markets
        </span>
      </h1>

      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed font-medium px-4">
        Hedge interest rate risk or speculate on yield volatility. The first institutional-grade protocol for interest rate swaps on Starknet
      </p>

      {/* Premium Join Button - High Contrast, Heavy Shadow, No Email Field */}
      <div className="flex flex-col items-center gap-8 mb-20 animate-fade-in" style={{ animationDelay: '150ms' }}>
        <button 
          onClick={handleJoin}
          className="group cursor-pointer relative px-14 py-5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.05] active:scale-[0.98] transition-all duration-300 shadow-[0_20px_50px_-12px_rgba(56,189,248,0.4),0_15px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 overflow-hidden"
        >
          <span className="relative z-10">{isJoined ? 'Welcome' : 'Join'}</span>
          {!isJoined && <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />}
          
          {/* Shine effect on hover */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shine_1s_ease-in-out]" />
        </button>

        <div className="flex items-center justify-center gap-2">
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <div 
                key={i} 
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-[#020617] flex items-center justify-center overflow-hidden shadow-lg"
              >
                <div className="w-full h-full bg-linear-to-br from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-900"></div>
              </div>
            ))}
          </div>
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1 mb-0.5">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(s => <span key={s} className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>)}
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
              Join others waiting for access
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
