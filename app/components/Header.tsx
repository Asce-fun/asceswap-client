"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Menu,
  Briefcase,
} from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import STRKLogo from "../assets/icons/coins/strk";
import { MintMockTokenModal } from "./MintMockTokenModal";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDark, toggleTheme }) => {
  const { primaryWallet, handleLogOut, setShowAuthFlow } = useDynamicContext();

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMint, setShowMint] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const isLoggedIn = !!primaryWallet;
  const address = primaryWallet?.address;
  const shortAddress = address
    ? `${address.slice(0, 5)}…${address.slice(-4)}`
    : "";

  /* ---------- Breadcrumb ---------- */
  const pageLabel = pathname?.includes("user-positions")
    ? "Positions"
    : "Dashboard";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo / Breadcrumb */}
          {/* Logo */}
          <div
            className="flex items-center cursor-pointer gap-3 group"
            onClick={() => {
              router.push("/");
            }}
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 ring-1 ring-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <RefreshCw className="w-4 h-4 transition-transform duration-700 group-hover:rotate-180" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
              ASCE
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#38bdf8] via-[#818cf8] to-[#a270ff]">
                SWAP
              </span>
            </span>
          </div>
        </div>

        {/* RIGHT – DESKTOP */}
        <div className="hidden md:flex items-center gap-2">
          {isLoggedIn && (
            <>
              {/* Positions */}
              <button
                onClick={() => router.push(`/user-positions/${address}`)}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-full
                  text-xs font-black uppercase tracking-widest
                  text-blue-500 bg-blue-500/10 border border-blue-500/30
                  hover:bg-blue-500/20 transition-all"
              >
                <Briefcase className="w-4 h-4" />
                Positions
              </button>

              {/* Mint */}
              <button
                onClick={() => setShowMint(true)}
                className="px-4 cursor-pointer py-2 rounded-full text-xs font-black uppercase tracking-widest
                  text-indigo-500 bg-indigo-500/10 border border-indigo-500/30
                  hover:bg-indigo-500/20 transition-all"
              >
                Mint Test Tokens
              </button>
            </>
          )}

          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 cursor-pointer rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Wallet */}
          {!isLoggedIn ? (
            <button
              onClick={() => setShowAuthFlow(true)}
              className="px-6 cursor-pointer py-2 rounded-full text-sm font-semibold text-white
                bg-linear-to-r from-sky-400 to-indigo-500"
            >
              Log in
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-slate-900/60"
              >
                <STRKLogo height={16} width={16} />
                <span>{shortAddress}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-[#0b0b0b] border">
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogOut();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE DROPDOWN */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/5 bg-white dark:bg-[#050505] px-4 py-4 space-y-3">
          {isLoggedIn && (
            <>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  router.push(`/user-positions/${address}`);
                }}
                className="w-full cursor-pointer flex items-center gap-2 text-sm font-semibold"
              >
                <Briefcase className="w-4 h-4" /> Positions
              </button>

              <button
                onClick={() => {
                  setMobileOpen(false);
                  setShowMint(true);
                }}
                className="w-full cursor-pointer text-left text-sm font-semibold"
              >
                Mint Test Tokens
              </button>
            </>
          )}

          <button onClick={toggleTheme} className="w-full cursor-pointer text-left text-sm">
            Toggle Theme
          </button>

          {isLoggedIn ? (
            <button
              onClick={handleLogOut}
              className="w-full text-left text-sm cursor-pointer text-red-500"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowAuthFlow(true)}
              className="w-full cursor-pointer text-left text-sm"
            >
              Log in
            </button>
          )}
        </div>
      )}

      <MintMockTokenModal
        isOpen={showMint}
        onClose={() => setShowMint(false)}
      />
    </nav>
  );
};
