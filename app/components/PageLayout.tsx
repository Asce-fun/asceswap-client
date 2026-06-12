"use client";

import React from "react";
import { Header } from "./Header";
import { SpaceBackground } from "./SpaceBackground";
import { WalletProvider } from "../wallet/WalletProvider";

interface PageLayoutProps {
  children: React.ReactNode;
  headerFilters?: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, headerFilters }) => {
  return (
    <div className="min-h-screen bg-[var(--terminal-bg)] font-sans text-[var(--terminal-ink)]">
      <SpaceBackground />
      <WalletProvider>
        <div className="relative z-10 flex flex-col">
          <Header filters={headerFilters} />

          <main className="grow pb-12">
            <div className="mx-auto max-w-[1760px] px-4 sm:px-6">{children}</div>
          </main>
        </div>
      </WalletProvider>
    </div>
  );
};
