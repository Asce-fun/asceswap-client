"use client";

import React from "react";
import { Header } from "./Header";
import { SpaceBackground } from "./SpaceBackground";

interface PageLayoutProps {
  children: React.ReactNode;
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#080b0f] font-sans text-[#f2f5f3]">
      <SpaceBackground />
      <div className="relative z-10 flex flex-col">
        <Header />

        <main className="grow pb-12">
          <div className="mx-auto max-w-[1760px] px-4 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
