"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
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

  useEffect(() => {
    if (step !== 1) return;
    try {
      localStorage.removeItem("dynamic-env-1-auth");
      sessionStorage.removeItem("dynamic-env-1-auth");
    } catch {}
  }, [step]);

  useEffect(() => {
    if (!primaryWallet?.address) return;
    const storedWallet = localStorage.getItem("lastWalletAddress");
    if (storedWallet !== primaryWallet.address) {
      setStep(1);
      localStorage.setItem("lastWalletAddress", primaryWallet.address);
    }
  }, [primaryWallet]);

  useEffect(() => {
    if (primaryWallet?.address && dynamicUser) {
      setLoading(false);
      setStep(2);
    }
  }, [primaryWallet, dynamicUser]);

  const handleJoin = () => {
    if (primaryWallet?.address) {
      setStep(2);
      return;
    }
    setLoading(true);
    setShowAuthFlow(true);
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

  return (
    <div className="text-center py-16">
      {/* Live Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/15 text-[#a78bfa] text-xs font-semibold uppercase tracking-widest mb-8">
        <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-pulse" />
        Live on Starknet
      </div>

      {/* Heading — Instrument Serif */}
      <h1 className="font-serif font-normal text-white mb-6 leading-[1.05] tracking-[-0.03em]" style={{ fontSize: 'clamp(48px, 7vw, 88px)' }}>
        Derivatives for<br />
        <em className="italic text-transparent bg-clip-text bg-linear-to-br from-[#b0a0e0] to-[#6d5aad]">
          Yield Markets
        </em>
      </h1>

      <p className="text-lg text-[#8A8894] max-w-[520px] mx-auto mb-12 leading-relaxed">
        Hedge interest rate risk or speculate on yield volatility. The first
        institutional-grade protocol for interest rate swaps on Starknet.
      </p>

      {/* CTA Buttons */}
      <div className="flex items-center justify-center gap-4 flex-wrap">
        <Link
          href="/markets"
          className="inline-flex items-center gap-2.5 px-9 py-4 rounded-[20px] bg-linear-to-br from-[#b0a0e0] to-[#6d5aad] text-[#0A0A0C] font-semibold text-[15px] transition-all duration-300 shadow-lg shadow-[rgba(167,139,250,0.22)] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[rgba(167,139,250,0.40)] group"
        >
          Start Trading
          <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-0.5 transition-transform" />
        </Link>
        <a
          href="https://docs.asceswap.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-[20px] border border-white/10 text-[#8A8894] hover:text-white hover:border-white/18 hover:bg-[#8b5cf6]/8 font-medium text-[15px] transition-all duration-200"
        >
          <BookOpen className="w-4 h-4" />
          Read Docs
        </a>
      </div>
    </div>
  );
};
