import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AsceSwap — Hedge any number",
  description:
    "Protection on any number an oracle can read — funding rates, borrow costs, gas, prices. Pay a premium once. Fully collateralized, no margin, no liquidations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${archivo.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
