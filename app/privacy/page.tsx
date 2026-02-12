"use client";
import React from "react";
import { Lock, EyeOff, ShieldCheck, Database, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageLayout } from "../components/PageLayout";

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => {
            router.push("/");
          }}
          className="flex cursor-pointer items-center gap-2 text-[#8A8894] hover:text-white transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Back to Markets
          </span>
        </button>

        <header className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6]">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-white leading-none">
              Legal Privacy
            </h1>
          </div>
          <p className="text-[#8A8894] text-sm font-bold uppercase tracking-widest">
            Commitment to Privacy & Anonymity
          </p>
        </header>

        <div className="space-y-12 pb-24">
          <section className="space-y-6">
            <div className="p-8 bg-[#8b5cf6]/5 border border-[#8b5cf6]/10 rounded-3xl flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
              <div className="p-4 rounded-3xl bg-[#8b5cf6]/10 text-[#a78bfa]">
                <EyeOff className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                  Zero-Data Policy
                </h3>
                <p className="text-[#8A8894] text-sm leading-relaxed max-w-lg">
                  Asceswap does not collect, store, or sell any personal
                  information. We do not track IP addresses, browser cookies, or
                  physical locations.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-[#8b5cf6]">01.</span> Blockchain Data
            </h2>
            <p className="text-[#8A8894] leading-relaxed">
              While we do not collect personal data, your interactions with the
              Starknet blockchain are public by nature. This includes your
              wallet address, transaction history, and liquidity positions. This
              data is not stored on our servers but on the decentralized network
              itself.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-[#8b5cf6]">02.</span> Third-Party Analytics
            </h2>
            <div className="p-6 bg-white/2 border border-white/5 rounded-3xl flex gap-4">
              <Database className="w-6 h-6 text-[#8A8894] shrink-0" />
              <p className="text-[#8A8894] text-sm leading-relaxed">
                We may use self-hosted, privacy-preserving analytics to monitor
                protocol health and performance. This data is aggregated and
                does not contain any identifying information.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-[#8b5cf6]">03.</span> Wallet Integration
            </h2>
            <p className="text-[#8A8894] leading-relaxed">
              When you connect your wallet (e.g., Argent X, Braavos), you are
              subject to the privacy policies of those respective providers.
              Asceswap only receives your public address to enable interaction
              with the smart contracts.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <span className="text-[#8b5cf6]">04.</span> Security First
            </h2>
            <div className="p-6 bg-[#34d399]/5 border border-[#34d399]/10 rounded-3xl flex gap-4">
              <ShieldCheck className="w-6 h-6 text-[#34d399] shrink-0" />
              <p className="text-[#8A8894] text-sm leading-relaxed">
                We prioritize the security of the protocol through continuous
                audits and bug bounties. Privacy is a core component of our
                security architecture.
              </p>
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
