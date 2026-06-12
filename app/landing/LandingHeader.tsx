import Link from "next/link";

export function LandingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3.5">
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
                id="landingLogoG"
                x1="105"
                y1="130"
                x2="40"
                y2="20"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#064e3b" />
                <stop offset="0.5" stopColor="#059669" />
                <stop offset="1" stopColor="#34d399" />
              </linearGradient>
            </defs>
            <path
              d="M 105 130 L 105 45 A 42 42 0 1 0 105 112"
              stroke="url(#landingLogoG)"
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

        <nav className="flex items-center gap-2">
          <a
            href="#how-it-works"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-[#5c6b64] transition hover:text-[#0c1a15] sm:block"
          >
            How it works
          </a>
          <Link
            href="/markets"
            className="rounded-lg bg-[#0c1a15] px-4 py-2 text-sm font-semibold text-[#fbfdfc] transition hover:bg-[#1c2a25]"
          >
            Launch app
          </Link>
        </nav>
      </div>
    </header>
  );
}
