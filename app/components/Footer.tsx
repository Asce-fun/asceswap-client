import React from "react";
import { RefreshCw, Twitter, Github, Disc } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0A0A0C] border-t border-white/5 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12 mb-12">
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
              <div
                className="relative flex items-center justify-center w-8 h-8 rounded-full 
  bg-[#14b8a6]/10 
  text-[#14b8a6] 
  ring-1 ring-[#14b8a6]/20 
  group-hover:bg-[#14b8a6] 
  group-hover:text-white 
  transition-all duration-300 
  shadow-[0_0_15px_rgba(94,234,212,0.20)]"
              >
                <RefreshCw className="w-4 h-4 transition-transform duration-700 group-hover:rotate-180" />
              </div>

              <span className="text-xl font-bold tracking-tighter text-white">
                ASCE
                <span className="text-transparent bg-clip-text bg-linear-to-r from-[#14b8a6] via-[#5eead4] to-[#99f6e4]">
                  SWAP
                </span>
              </span>
            </button>

            <p className="text-[#8A8894] text-sm leading-relaxed max-w-xs mb-6">
              Building the future of interest rate derivatives. Open source,
              permissionless, and community governed.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-[#8A8894] hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-[#8A8894] hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-[#8A8894] hover:text-white transition-colors"
              >
                <Disc className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-[#8A8894]">
              <li>
                <a
                  href="/markets"
                  className="hover:text-[#5eead4] transition-colors"
                >
                  Markets
                </a>
              </li>
              <li>
                <a
                  href="/positions"
                  className="hover:text-[#5eead4] transition-colors"
                >
                  Portfolio
                </a>
              </li>
              <li>
                <a
                  href="/liquidity"
                  className="hover:text-[#5eead4] transition-colors"
                >
                  Earn
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-[#8A8894]">
              <li>
                <a href="#" className="hover:text-[#5eead4] transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#5eead4] transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#5eead4] transition-colors">
                  Status
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-[#8A8894]">
              <li>
                <a
                  href="/privacy"
                  className="hover:text-[#5eead4] transition-colors"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="hover:text-[#5eead4] transition-colors"
                >
                  Terms
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#5eead4] transition-colors">
                  Risks
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#8A8894]">
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
