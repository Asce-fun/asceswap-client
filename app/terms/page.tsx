"use client";
import React from "react";
import { ShieldAlert, Scale, Globe, FileText, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageLayout } from "../components/PageLayout";

export default function TermsPage() {
  const router = useRouter();
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        <button
          className="flex cursor-pointer items-center gap-2 text-[#9896a3] hover:text-[#e8e6ee] transition-colors mb-8 group"
          onClick={() => {
            router.push("/");
          }}
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">
            Back to Markets
          </span>
        </button>

        <header className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 text-[#8b5cf6]">
              <Scale className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-bold tracking-tighter text-[#e8e6ee] leading-none">
              Terms of Service
            </h1>
          </div>
          <p className="text-[#9896a3] text-sm font-bold uppercase tracking-widest">
            Last Updated: January 2025
          </p>
        </header>

        <div className="space-y-12 pb-24">
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#e8e6ee] flex items-center gap-3">
              <span className="text-[#8b5cf6]">01.</span> Acceptance of Terms
            </h2>
            <p className="text-[#9896a3] leading-relaxed">
              By accessing or using the Asceswap Protocol ("Asceswap", "we",
              "us"), you agree to be bound by these Terms of Service. If you do
              not agree to these terms, you must immediately cease all access to
              the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#e8e6ee] flex items-center gap-3">
              <span className="text-[#8b5cf6]">02.</span> Risk Disclosure
            </h2>
            <div className="p-6 bg-orange-500/[0.03] border border-orange-500/10 rounded-3xl flex gap-4">
              <ShieldAlert className="w-6 h-6 text-orange-500 shrink-0" />
              <div className="space-y-3">
                <p className="text-[#9896a3] font-bold text-sm">
                  Interest rate swaps involve significant financial risk.
                </p>
                <p className="text-[#9896a3] text-sm leading-relaxed">
                  The use of leverage can result in the rapid loss of your
                  collateral. Past performance of protocol yields is not
                  indicative of future results. You acknowledge that you are
                  using a decentralized protocol at your own risk.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#e8e6ee] flex items-center gap-3">
              <span className="text-[#8b5cf6]">03.</span> No Fiduciary Duty
            </h2>
            <p className="text-[#9896a3] leading-relaxed">
              Asceswap is a non-custodial decentralized application. We do not
              have access to your private keys, nor do we act as your broker,
              agent, or advisor. You are solely responsible for the custody of
              your digital assets.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#e8e6ee] flex items-center gap-3">
              <span className="text-[#8b5cf6]">04.</span> Prohibited
              Jurisdictions
            </h2>
            <div className="p-6 bg-white/[0.02] border border-[#1e1e2a] rounded-3xl flex gap-4">
              <Globe className="w-6 h-6 text-[#9896a3] shrink-0" />
              <p className="text-[#9896a3] text-sm leading-relaxed">
                Users from the United States, North Korea, Iran, and other
                sanctioned regions are strictly prohibited from interacting with
                the protocol. By using this site, you represent that you are not
                a resident of a prohibited jurisdiction.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#e8e6ee] flex items-center gap-3">
              <span className="text-[#8b5cf6]">05.</span> Protocol Fees
            </h2>
            <p className="text-[#9896a3] leading-relaxed">
              Asceswap charges a 2% fee on all swaps. 80% of these fees are
              distributed to liquidity providers, and 20% are retained by the
              protocol for security and maintenance. Fees are subject to change
              via decentralized governance.
            </p>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
