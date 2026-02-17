"use client";

import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { NetworkStatusBar } from "./NetworkStatusBar";

interface PageLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  showFooter = true,
}) => {
  return (
    <div className="min-h-screen font-sans text-[#E4E2E8] transition-colors duration-500 bg-[#0A0A0C]">
      {/* Grid Background — subtle lavender-tinted */}
      <div className="fixed inset-0 z-0 bg-grid pointer-events-none opacity-50" />
      <div className="relative z-10 flex flex-col">
        <Header />

        <main className="grow pt-12 pb-32">
          <div className="max-w-7xl mx-auto px-6">{children}</div>
        </main>

        {showFooter && <Footer />}
      </div>

      <NetworkStatusBar />
      {/* Spacer so content doesn't hide behind fixed status bar */}
      <div className="h-8" />
    </div>
  );
};
