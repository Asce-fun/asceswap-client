import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora, Space_Mono } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import Web3Provider from "./providers/web3-provider";

const plusJakartaSans = Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-sans'});

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sora",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Asceswap - Interest Rate Prediction Market",
  description: "Institutional-grade DeFi protocol for interest rate swaps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={plusJakartaSans.variable}>
      <body className={`${plusJakartaSans.variable} ${spaceMono.variable} ${sora.variable} antialiased`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
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
