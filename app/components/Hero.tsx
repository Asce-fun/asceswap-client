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
 
    </div>
  );
};
