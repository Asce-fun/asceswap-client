import type { ReactNode } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { FaucetButton } from "./FaucetButton";
import { WalletConnectButton } from "./WalletConnectButton";

interface HeaderProps {
  filters?: ReactNode;
}

export const Header = ({ filters }: HeaderProps) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#cfe0d8] bg-[rgba(251,253,252,0.84)] backdrop-blur-[18px]">
      <div className="mx-auto flex h-16 max-w-[1760px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3.5">
          <svg
            width="34"
            height="36"
            viewBox="0 0 140 150"
            fill="none"
            className="logo-a shrink-0"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="headerLogoG"
                x1="105"
                y1="130"
                x2="40"
                y2="20"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#064e3b" />
                <stop offset="0.35" stopColor="#059669" />
                <stop offset="0.65" stopColor="#34d399" />
                <stop offset="1" stopColor="#6ee7b7" />
              </linearGradient>
            </defs>
            <path
              d="M 105 130 L 105 45 A 42 42 0 1 0 105 112"
              stroke="url(#headerLogoG)"
              strokeWidth="16"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="105" cy="130" r="6" fill="#064e3b" />
            <circle cx="105" cy="130" r="2.5" fill="#fbfdfc" />
          </svg>

          <span className="whitespace-nowrap text-xl font-semibold leading-none text-[#0c1a15] sm:text-[22px]">
            Asce<span className="text-[#059669]">Swap</span>
          </span>
        </Link>

        <div className="relative hidden min-w-0 md:block md:w-[clamp(250px,26vw,500px)]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8aa096]" />
          <input
            aria-label="Search markets"
            placeholder="Search markets — rates, gas, yields..."
            className="h-9 w-full rounded-md border border-[#cfe0d8] bg-white/70 pl-9 pr-9 text-sm text-[#0c1a15] outline-none transition placeholder:text-[#8aa096] focus:border-[#059669]/55"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#8aa096]">/</span>
        </div>

        {filters ? <div className="hidden min-w-0 items-center lg:flex lg:flex-1 2xl:flex-none">{filters}</div> : null}

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <FaucetButton />
          <WalletConnectButton />
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <FaucetButton compact />
          <WalletConnectButton compact />
          <button className="flex h-9 w-9 items-center justify-center rounded-md border border-[#cfe0d8] bg-white/70 text-[#5c6b64]">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};
