"use client";

import React from "react";
import { RefreshCw, Sun, Moon, LogIn, LogOut } from "lucide-react";
import { useDynamicContext, DynamicWidget } from "@dynamic-labs/sdk-react-core";

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isDark, toggleTheme }) => {
  const { primaryWallet, handleLogOut, setShowAuthFlow } = useDynamicContext();
  const isLoggedIn = !!primaryWallet;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 ring-1 ring-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <RefreshCw className="w-4 h-4 transition-transform duration-700 group-hover:rotate-180" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
            ASCE
            <span
              className="
    text-transparent bg-clip-text
    bg-linear-to-r
    from-[#38bdf8] via-[#818cf8] to-[#a270ff]
    dark:from-[#38bdf8] dark:via-[#818cf8] dark:to-[#a270ff]
  "
            >
              SWAP
            </span>
          </span>
        </a>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full cursor-pointer text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
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
              className="
  relative px-6 py-2 rounded-full cursor-pointer text-sm font-semibold text-white
  bg-linear-to-r from-sky-400 to-indigo-500
  shadow-[0_0_25px_rgba(99,102,241,0.6)]
  hover:shadow-[0_0_45px_rgba(99,102,241,0.9)]
  transition-all duration-300
  animate-[pulseGlow_3s_ease-in-out_infinite]
"
              onClick={() => {
                setShowAuthFlow(true);
              }}
            >
              Log in
            </button>
          ) : (
            <button
              onClick={handleLogOut}
              className="
    relative flex items-center gap-2
    px-5 py-2 rounded-full
    text-sm font-semibold
    text-slate-700 dark:text-slate-200

    bg-white/70 dark:bg-slate-900/60
    backdrop-blur-md

    border border-transparent
    bg-clip-padding

    shadow-[0_0_15px_rgba(99,102,241,0.25)]
    hover:shadow-[0_0_30px_rgba(99,102,241,0.45)]

    transition-all duration-300
    group
  "
            >
              {/* Gradient border */}
              <span
                className="
      pointer-events-none absolute inset-0 rounded-full
      bg-linear-to-r from-sky-400 via-indigo-400 to-purple-500
      opacity-90
      -z-10
    "
              />
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
