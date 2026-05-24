import Link from "next/link";
import { Menu, Search, Wallet } from "lucide-react";

export const Header: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#1d2a34] bg-[rgba(8,11,15,0.9)] backdrop-blur-[18px]">
      <div className="mx-auto flex h-16 max-w-[1760px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <svg
            width="30"
            height="30"
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

          <span className="text-xl font-semibold text-[#f2f5f3]">
            Asce<span className="text-[#2ee59d]">Swap</span>
          </span>
        </Link>

        <div className="relative hidden min-w-0 max-w-[760px] flex-1 md:block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65717d]" />
          <input
            aria-label="Search scalar markets"
            placeholder="Search scalar markets..."
            className="h-11 w-full rounded-lg border border-[#23323d] bg-[#101820] pl-11 pr-12 text-sm text-[#f2f5f3] outline-none transition placeholder:text-[#65717d] focus:border-[#33505f]"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-[#65717d]">/</span>
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <button className="h-9 rounded-md px-3 text-sm font-semibold text-[#8a96a3] transition hover:bg-[#121a21] hover:text-[#f2f5f3]">
            Portfolio
          </button>
          <button className="flex h-9 items-center gap-2 rounded-md border border-[#2ee59d]/35 bg-[#123026] px-3 text-sm font-semibold text-[#2ee59d] transition hover:border-[#2ee59d]">
            <Wallet className="h-4 w-4" />
            Connect
          </button>
        </div>

        <button className="ml-auto flex h-9 w-9 items-center justify-center rounded-md border border-[#23323d] bg-[#101820] text-[#8a96a3] md:hidden">
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </nav>
  );
};
