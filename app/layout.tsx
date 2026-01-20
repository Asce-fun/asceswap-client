import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import Web3Provider from "./providers/web3-provider";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "AsceSwap - Yield Derivatives Protocol",
  description: "Institutional-grade DeFi protocol for interest rate swaps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Web3Provider>
              {children}
            </Web3Provider>
          </ThemeProvider>
      </body>
    </html>
  );
}
