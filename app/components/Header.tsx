"use client";

import React, { useState } from "react";
import { RefreshCw, Sun, Moon, ChevronDown, LogOut } from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import STRKLogo from "../assets/icons/coins/strk";

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDark, toggleTheme }) => {
  const { primaryWallet, handleLogOut, setShowAuthFlow } = useDynamicContext();
  const [open, setOpen] = useState(false);

  const isLoggedIn = !!primaryWallet;
  const address = primaryWallet?.address;
  const shortAddress = address
    ? `${address.slice(0, 5)}…${address.slice(-4)}`
    : "";

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 group">
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

        {/* Actions */}
        <div className="flex items-center gap-2 relative">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Auth */}
          {!isLoggedIn ? (
            <button
              onClick={() => setShowAuthFlow(true)}
              className="px-6 py-2 rounded-full text-sm font-semibold text-white
              bg-linear-to-r from-sky-400 to-indigo-500
              shadow-[0_0_25px_rgba(99,102,241,0.6)]
              hover:shadow-[0_0_45px_rgba(99,102,241,0.9)]
              transition-all duration-300"
            >
              Log in
            </button>
          ) : (
            <div className="relative">
              {/* Wallet button */}
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-full
                text-sm font-semibold
                text-slate-700 dark:text-slate-200
                bg-white/70 dark:bg-slate-900/60
                backdrop-blur-md
                shadow-[0_0_15px_rgba(99,102,241,0.25)]
                hover:shadow-[0_0_30px_rgba(99,102,241,0.45)]
                transition-all duration-300"
              >
                <div className="flex items-center gap-2">
                  <STRKLogo height={16} width={16} />
                  <span>{shortAddress}</span>
                  <ChevronDown className="w-4 h-4 opacity-70" />
                </div>
              </button>

              {/* Dropdown */}
              {open && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-xl
                  bg-white dark:bg-[#0b0b0b]
                  border border-black/5 dark:border-white/10
                  shadow-xl backdrop-blur-md overflow-hidden z-50"
                >
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogOut();
                    }}
                    className="w-full cursor-pointer flex items-center gap-2 px-4 py-3
                    text-sm text-red-600 dark:text-red-400
                    hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
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
    </nav>
  );
};
