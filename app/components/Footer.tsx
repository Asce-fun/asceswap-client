
import React from 'react';
import { RefreshCw, Twitter, Github, Disc } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 dark:bg-black border-t border-slate-200 dark:border-white/10 pt-16 pb-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12 mb-12">
          <div className="md:col-span-2">
            <a href="#" className="inline-flex items-center gap-2.5 mb-4 group">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 ring-1 ring-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <RefreshCw className="w-4 h-4 transition-transform duration-700 group-hover:rotate-180" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
            ASCE<span className="text-[#38bdf8] dark:text-[#4facfe]">SWAP</span>
          </span>
            </a>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              Building the future of interest rate derivatives. Open source, permissionless, and community governed.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Disc className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Platform</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-brand-500 transition-colors">Markets</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Portfolio</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Earn</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Support</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-brand-500 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Status</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-brand-500 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Risks</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>&copy; 2026 AsceSwap Labs. All rights reserved.</p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
