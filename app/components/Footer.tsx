import React from "react";
import { Send } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[rgba(12,12,18,0.6)] backdrop-blur-[16px] border-t border-[#1e1e2a] pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() =>
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                })
              }
              className="inline-flex items-center gap-2.5 mb-4 group"
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 140 150"
                fill="none"
                className="logo-a"
              >
                <defs>
                  <linearGradient id="footerLogoG" x1="105" y1="130" x2="40" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#064e3b"/>
                    <stop offset="0.35" stopColor="#059669"/>
                    <stop offset="0.65" stopColor="#34d399"/>
                    <stop offset="1" stopColor="#6ee7b7"/>
                  </linearGradient>
                </defs>
                <path d="M 105 130 L 105 45 A 42 42 0 1 0 105 112" stroke="url(#footerLogoG)" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="105" cy="130" r="6" fill="#064e3b"/>
                <circle cx="105" cy="130" r="2.5" fill="#0e0e13"/>
              </svg>

              <span className="text-xl font-bold tracking-tighter text-[#e8e6ee]">
                ASCE
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#34d399] to-[#6ee7b7]">
                  SWAP
                </span>
              </span>
            </button>

            <p className="text-[#9896a3] text-sm leading-relaxed max-w-xs mb-6">
              Building the future of interest rate derivatives. Open source,
              permissionless, and community governed.
            </p>
            <div className="flex gap-4">
              <a
                href="https://x.com/asceswap"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9896a3] hover:text-[#6ee7b7] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://t.me/+xZKoI7ZbyuU4OGI1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#9896a3] hover:text-[#6ee7b7] transition-colors"
              >
                <Send className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-[#e8e6ee] mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-[#9896a3]">
              <li>
                <a
                  href="/markets"
                  className="hover:text-[#6ee7b7] transition-colors"
                >
                  Markets
                </a>
              </li>
              <li>
                <a
                  href="/positions"
                  className="hover:text-[#6ee7b7] transition-colors"
                >
                  Portfolio
                </a>
              </li>
              <li>
                <a
                  href="/liquidity"
                  className="hover:text-[#6ee7b7] transition-colors"
                >
                  Earn
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#e8e6ee] mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-[#9896a3]">
              <li>
                <a href="https://asceswap.gitbook.io/asceswap-docs" target="_blank" className="hover:text-[#6ee7b7] transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#6ee7b7] transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#6ee7b7] transition-colors">
                  Status
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-[#1e1e2a] pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#9896a3]">
          <p>&copy; 2026 AsceSwap Labs. All rights reserved.</p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
