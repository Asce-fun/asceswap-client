import type { Metadata } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Mono, Instrument_Serif } from "next/font/google";

import "./globals.css";
import { ThemeProvider } from "./components/theme-provider";
import Web3Provider from "./providers/web3-provider";

const plusJakartaSans = Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-sans'});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
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
    <html lang="en" suppressHydrationWarning className={plusJakartaSans.variable}>
      <body className={`${plusJakartaSans.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable} antialiased`}>
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
