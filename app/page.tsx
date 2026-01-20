
'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Terminal } from './components/Terminal';
import { Stats } from './components/Stats';
import { Footer } from './components/Footer';

export default function Home() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme ? savedTheme === 'dark' : true;
    setIsDark(initialTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark, mounted]); 

  const toggleTheme = () => setIsDark(prev => !prev);

  if (!mounted) return <div className="min-h-screen bg-[#020617]" />;

  return (
    <div className="min-h-screen font-sans text-slate-900 dark:text-slate-200 transition-colors duration-500 bg-white dark:bg-[#080a0e]">
      {/* Grid Background */}
      <div className="fixed inset-0 z-0 bg-grid pointer-events-none opacity-80 dark:opacity-70"></div>
      
      {/* Background Blobs - Deep Blue and Purple, refined for contrast */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 dark:bg-purple-600/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow"></div>

      <div className="relative z-10 flex flex-col">
        <Header isDark={isDark} toggleTheme={toggleTheme} />

        <main className="grow pt-28 pb-32">
          <div className="max-w-7xl mx-auto px-6">
            <Hero />
            <div className="mt-20">
              <Terminal />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
