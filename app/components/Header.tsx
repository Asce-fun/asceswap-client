import type { ReactNode } from "react";
import Link from "next/link";
import { Menu, Search, Wallet } from "lucide-react";

interface HeaderProps {
  filters?: ReactNode;
}

export const Header = ({ filters }: HeaderProps) => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#15231f] bg-[rgba(3,5,6,0.86)] backdrop-blur-[18px]">
      <div className="mx-auto flex h-14 max-w-[1760px] items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <svg
            width="26"
            height="26"
            viewBox="0 0 140 150"
            fill="none"
            className="logo-a"
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
            <circle cx="105" cy="130" r="2.5" fill="#0e0e13" />
          </svg>

          <span className="text-lg font-semibold text-[#f2f5f3]">
            Asce<span className="text-[#2ee59d]">Swap</span>
          </span>
        </Link>

        <div className="relative hidden min-w-0 md:block md:w-[250px] lg:w-[280px] xl:w-[320px] 2xl:w-[360px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65717d]" />
          <input
            aria-label="Search scalar markets"
            placeholder="Search scalar markets..."
            className="h-9 w-full rounded-md border border-[#1d312b] bg-[rgba(5,11,11,0.82)] pl-9 pr-9 text-sm text-[#f2f5f3] outline-none transition placeholder:text-[#66756f] focus:border-[#2ee59d]/55"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-[#66756f]">/</span>
        </div>

        {filters ? <div className="hidden min-w-0 flex-1 items-center lg:flex">{filters}</div> : null}

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <button className="h-9 rounded-md px-3 text-sm font-semibold text-[#8a968f] transition hover:bg-[#0c1514] hover:text-[#f2f5f3]">
            Portfolio
          </button>
          <button className="flex h-9 items-center gap-2 rounded-md border border-[#7cf3bd]/40 bg-[#7cf3bd] px-3 text-sm font-semibold text-[#03100b] transition hover:border-[#a7ffd4] hover:bg-[#9af7ca]">
            <Wallet className="h-4 w-4" />
            Connect
          </button>
        </div>

        <button className="ml-auto flex h-9 w-9 items-center justify-center rounded-md border border-[#1d312b] bg-[rgba(5,11,11,0.82)] text-[#8a968f] md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};
