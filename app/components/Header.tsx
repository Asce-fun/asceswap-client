"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Droplet,
  BarChart3,
  Coins,
  Briefcase,
  Compass,
  Anchor,
  MessageSquare,
} from "lucide-react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import STRKLogo from "../assets/icons/coins/strk";
import { MintMockTokenModal } from "./MintMockTokenModal";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/markets", label: "Markets", icon: BarChart3 },
  { href: "/liquidity", label: "Liquidity", icon: Coins },
  { href: "/positions", label: "Positions", icon: Briefcase },
  { href: "/curator", label: "Curator", icon: Compass },
  { href: "/hooks", label: "Hooks", icon: Anchor },
  { href: "/feedback", label: "Feedback", icon: MessageSquare, sub: "Imp." },
];

export const Header: React.FC = () => {
  const { primaryWallet, handleLogOut, setShowAuthFlow } = useDynamicContext();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showMint, setShowMint] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();

  const isLoggedIn = !!primaryWallet;
  const address = primaryWallet?.address;
  const shortAddress = address
    ? `${address.slice(0, 5)}…${address.slice(-4)}`
    : "";

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  /* ---------- Click outside to close dropdown ---------- */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  /* ---------- Close mobile menu on route change ---------- */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#1e1e2a] bg-[rgba(12,12,18,0.5)] backdrop-blur-[20px]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* ===== LEFT: Logo ===== */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl hover:bg-white/5 cursor-pointer"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>

          {/* Logo */}
          <div
            className="flex items-center cursor-pointer gap-3 group"
            onClick={() => router.push("/")}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 140 150"
              fill="none"
              className="logo-a"
            >
              <defs>
                <linearGradient id="headerLogoG" x1="105" y1="130" x2="40" y2="20" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#064e3b"/>
                  <stop offset="0.35" stopColor="#059669"/>
                  <stop offset="0.65" stopColor="#34d399"/>
                  <stop offset="1" stopColor="#6ee7b7"/>
                </linearGradient>
              </defs>
              <path d="M 105 130 L 105 45 A 42 42 0 1 0 105 112" stroke="url(#headerLogoG)" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="105" cy="130" r="6" fill="#064e3b"/>
              <circle cx="105" cy="130" r="2.5" fill="#0e0e13"/>
            </svg>

            <span className="text-xl font-bold tracking-tighter text-[#e8e6ee]">
              ASCE
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#34d399] to-[#6ee7b7]">
                SWAP
              </span>
            </span>
          </div>
        </div>

        {/* ===== CENTER: Nav Links (desktop) ===== */}
        <div className="hidden md:flex items-center gap-1 bg-[rgba(12,12,18,0.5)] rounded-xl p-1 border border-[#1e1e2a]">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex flex-col items-center ${
                  isActive
                    ? "text-[#e8e6ee] bg-[#34d399]/10"
                    : "text-[#9896a3] hover:text-[#6ee7b7] hover:bg-[#34d399]/5"
                }`}
              >
                {link.label}
                {"sub" in link && link.sub && (
                  <span className="text-[8px] font-bold text-[#34d399]/60 leading-none -mt-0.5">
                    {link.sub}
                  </span>
                )}

                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-[#34d399]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* ===== RIGHT: Actions (desktop) ===== */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme */}
          {/* <button
            onClick={toggleTheme}
            className="p-2 cursor-pointer rounded-xl hover:bg-white/5 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#9896a3]" />
            ) : (
              <Moon className="w-4 h-4 text-[#9896a3]" />
            )}
          </button> */}

          {/* Mint icon button */}
          {isLoggedIn && (
            <button
              onClick={() => setShowMint(true)}
              className="p-2 cursor-pointer rounded-xl 
             hover:bg-[#34d399]/10 
             transition-all duration-200"
              title="Mint Test Tokens"
            >
              <Droplet className="w-4 h-4 text-[#34d399]" />
            </button>
          )}

          {/* Wallet */}
          {!isLoggedIn ? (
            <button
              onClick={() => setShowAuthFlow(true)}
              className="px-6 cursor-pointer py-2 rounded-xl text-sm font-semibold text-[#030305]
  bg-gradient-to-r from-[#6ee7b7] to-[#34d399]
  hover:from-[#34d399] hover:to-[#059669]
  transition-all duration-300"
            >
              Log in
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-[#0c0c12]/60 border border-[#1e1e2a] hover:border-[rgba(52,211,153,0.15)] transition-colors"
              >
                <STRKLogo height={16} width={16} />
                <span className="text-sm">{shortAddress}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#9896a3] transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[rgba(12,12,18,0.7)] backdrop-blur-[16px] border border-[#1e1e2a] shadow-xl shadow-black/40 overflow-hidden">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setShowMint(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#9896a3] hover:bg-[#16161e] transition-colors cursor-pointer"
                  >
                    <Droplet className="w-4 h-4 text-[#34d399]" />
                    Mint Test Tokens
                  </button>
                  <div className="border-t border-[#1e1e2a]" />
                  <button
                    onClick={() => {
                      setOpen(false);
                      handleLogOut();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== MOBILE DRAWER ===== */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1e1e2a] bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] px-4 py-4 space-y-1">
          {/* Nav Links */}
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-[#e8e6ee] bg-[#34d399]/10"
                    : "text-[#9896a3] hover:text-[#e8e6ee] hover:bg-[#16161e]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex items-center gap-1.5">
                  {link.label}
                  {"sub" in link && link.sub && (
                    <span className="text-[8px] font-bold text-[#34d399]/60">
                      {link.sub}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}

          <div className="border-t border-[#1e1e2a] my-2" />

          {/* Actions */}
          {isLoggedIn && (
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowMint(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
             text-[#34d399]/70 hover:text-[#34d399]
             hover:bg-[#34d399]/10
             transition-all duration-200 cursor-pointer"
            >
              <Droplet className="w-4 h-4 text-[#34d399]" />
              Mint Test Tokens
            </button>
          )}

          {/* <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#9896a3] hover:text-[#e8e6ee] hover:bg-[#16161e] transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            Toggle Theme
          </button> */}

          <div className="border-t border-[#1e1e2a] my-2" />

          {isLoggedIn ? (
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#f87171] hover:bg-[#f87171]/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowAuthFlow(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#030305]
  bg-gradient-to-r from-[#6ee7b7] to-[#34d399]
  cursor-pointer"
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
