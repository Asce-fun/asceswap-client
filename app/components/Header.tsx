"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  RefreshCw,
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
    <nav className="sticky top-0 z-50 w-full border-b border-[rgba(180,175,200,0.06)] bg-[#0A0A0C]/80 backdrop-blur-xl">
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
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] ring-1 ring-[#8b5cf6]/20 group-hover:bg-[#8b5cf6] group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(167,139,250,0.22)]">
              <RefreshCw className="w-4 h-4 transition-transform duration-700 group-hover:rotate-180" />
            </div>
            <span className="text-xl font-bold tracking-tighter text-white">
              ASCE
              <span className="text-transparent bg-clip-text bg-linear-to-r from-[#a78bfa] via-[#8b5cf6] to-[#7c3aed]">
                SWAP
              </span>
            </span>
          </div>
        </div>

        {/* ===== CENTER: Nav Links (desktop) ===== */}
        <div className="hidden md:flex items-center gap-1 bg-white/[0.02] rounded-xl p-1 border border-white/[0.03]">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-white bg-[#8b5cf6]/10"
                    : "text-[#8A8894] hover:text-[#BAB8C4] hover:bg-white/5"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[2px] rounded-full bg-[#a78bfa]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* ===== RIGHT: Actions (desktop) ===== */}
        <div className="hidden md:flex items-center gap-2">
          {/* Theme */}
          <button
            onClick={toggleTheme}
            className="p-2 cursor-pointer rounded-xl hover:bg-white/5 transition-colors"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-[#8A8894]" />
            ) : (
              <Moon className="w-4 h-4 text-[#8A8894]" />
            )}
          </button>

          {/* Mint icon button */}
          {isLoggedIn && (
            <button
              onClick={() => setShowMint(true)}
              className="p-2 cursor-pointer rounded-xl hover:bg-white/5 transition-colors"
              title="Mint Test Tokens"
            >
              <Droplet className="w-4 h-4 text-[#a78bfa]" />
            </button>
          )}

          {/* Wallet */}
          {!isLoggedIn ? (
            <button
              onClick={() => setShowAuthFlow(true)}
              className="px-6 cursor-pointer py-2 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-[#7c3aed] to-[#8b5cf6] hover:opacity-90 transition-opacity"
            >
              Log in
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setOpen((v) => !v)}
                className="flex cursor-pointer items-center gap-2 px-4 py-2 rounded-xl bg-[#111114]/60 border border-[rgba(180,175,200,0.08)] hover:border-[rgba(180,175,200,0.15)] transition-colors"
              >
                <STRKLogo height={16} width={16} />
                <span className="text-sm">{shortAddress}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#8A8894] transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#111114] border border-[rgba(180,175,200,0.08)] shadow-xl shadow-black/40 overflow-hidden">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setShowMint(true);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#BAB8C4] hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Droplet className="w-4 h-4 text-[#a78bfa]" />
                    Mint Test Tokens
                  </button>
                  <div className="border-t border-white/5" />
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
        <div className="md:hidden border-t border-[rgba(180,175,200,0.06)] bg-[#0A0A0C] px-4 py-4 space-y-1">
          {/* Nav Links */}
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? "text-white bg-[#8b5cf6]/10"
                    : "text-[#8A8894] hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}

          <div className="border-t border-white/5 my-2" />

          {/* Actions */}
          {isLoggedIn && (
            <button
              onClick={() => {
                setMobileOpen(false);
                setShowMint(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#8A8894] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <Droplet className="w-4 h-4 text-[#a78bfa]" />
              Mint Test Tokens
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-[#8A8894] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            Toggle Theme
          </button>

          <div className="border-t border-white/5 my-2" />

          {isLoggedIn ? (
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogOut();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
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
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-linear-to-r from-[#7c3aed] to-[#8b5cf6] cursor-pointer"
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
