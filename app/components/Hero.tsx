"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

export const Hero: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const {
    primaryWallet,
    user: dynamicUser,
    handleLogOut,
    setShowAuthFlow,
  } = useDynamicContext();
  console.log(dynamicUser,'user')

  /* ----------------------------------------
     STEP 1 → clear stale sessions
  ---------------------------------------- */
  useEffect(() => {
    if (step !== 1) return;

    try {
      localStorage.removeItem("dynamic-env-1-auth");
      sessionStorage.removeItem("dynamic-env-1-auth");
    } catch {}
  }, [step]);

  /* ----------------------------------------
     Wallet memory (same as ListFlow)
  ---------------------------------------- */
  useEffect(() => {
    if (!primaryWallet?.address) return;

    const storedWallet = localStorage.getItem("lastWalletAddress");

    if (storedWallet !== primaryWallet.address) {
      setStep(1);
      localStorage.setItem("lastWalletAddress", primaryWallet.address);
    }
  }, [primaryWallet]);

  /* ----------------------------------------
     Auth success → Step 2
  ---------------------------------------- */
  useEffect(() => {
    if (primaryWallet?.address && dynamicUser) {
      setLoading(false);
      setStep(2);
    }
  }, [primaryWallet, dynamicUser]);

  /* ----------------------------------------
     Handlers
  ---------------------------------------- */
  const handleJoin = () => {
    if (primaryWallet?.address) {
      setStep(2);
      return;
    }

    setLoading(true);
    setShowAuthFlow(true);

    // safety timeout
    setTimeout(() => setLoading(false), 15000);
  };

  const handleReset = async () => {
    try {
      await handleLogOut?.();
    } catch {}

    localStorage.clear();
    sessionStorage.clear();

    document.cookie.split(";").forEach((cookie) => {
      const [name] = cookie.trim().split("=");
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });

    setStep(1);
    setLoading(false);
  };

  const isConnected = !!primaryWallet?.address;

  /* ----------------------------------------
     UI
  ---------------------------------------- */
  return (
    <div className="text-center">
      {/* Badge */}
      <div
        className="
  inline-flex items-center gap-2
  px-4 py-2
  rounded-full
  border
  text-[11px] font-semibold uppercase tracking-[0.18em]
  backdrop-blur-md
  transition-colors
  mb-12

  /* Light mode */
  bg-blue-50/80
  border-blue-200
  text-blue-600
  shadow-[0_0_0_1px_rgba(59,130,246,0.08)]

  /* Dark mode */
  dark:bg-[#0B1220]/70
  dark:border-blue-500/20
  dark:text-blue-400
  dark:shadow-[0_0_0_1px_rgba(59,130,246,0.15)]
"
      >
        {/* Dot */}
        <span
          className="
    h-2 w-2 rounded-full
    bg-blue-500
    dark:bg-blue-400
  "
        />
        Coming Soon
      </div>

      {/* Heading */}
      <h1 className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.05]">
        Derivatives for <br />
        <span className="text-transparent bg-clip-text bg-linear-to-r from-[#38bdf8] via-[#818cf8] to-[#a270ff]">
          Yield Markets
        </span>
      </h1>

      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-16">
        Hedge interest rate risk or speculate on yield volatility. The first
        institutional-grade protocol for interest rate swaps on Starknet
      </p>

      {/* CTA */}
      <div className="flex flex-col items-center gap-8 mb-20">
        <button
          onClick={handleJoin}
          disabled={loading}
          className="
            group relative px-14 py-5 rounded-full
            bg-slate-900 dark:bg-white
            text-white dark:text-slate-950
            font-black text-sm uppercase tracking-[0.2em]
            hover:scale-[1.05] active:scale-[0.98]
            transition-all duration-300
            shadow-[0_20px_50px_-12px_rgba(56,189,248,0.4)]
            flex items-center gap-3 overflow-hidden
            disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer
          "
        >
          <span className="relative z-10">
            {loading ? "Connecting…" : isConnected ? `Welcome ${dynamicUser?.username}` : "Join"}
          </span>

          {!isConnected && !loading && (
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1.5 transition-transform duration-300" />
          )}

          {/* Shine */}
          <div className="absolute top-0 -inset-full h-full w-1/2 transform -skew-x-12 bg-linear-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shine_1s_ease-in-out]" />
        </button>

        {isConnected && (
          <button
            onClick={handleReset}
            className="text-xs cursor-pointer uppercase tracking-wider text-slate-500 hover:text-slate-300 transition"
          >
            Disconnect
          </button>
        )}
      </div>
    </div>
  );
};
