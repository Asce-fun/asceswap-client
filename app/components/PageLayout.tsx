"use client";

import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

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

      {/* Atmosphere Blobs — very subtle */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#a78bfa]/[0.02] blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8b5cf6]/[0.02] blur-[150px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        <Header />

        <main className="grow pt-28 pb-32">
          <div className="max-w-7xl mx-auto px-6">{children}</div>
        </main>

        {showFooter && <Footer />}
      </div>
    </div>
  );
};
