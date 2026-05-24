import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "AsceSwap - Variable Markets",
  description: "Trade payoff markets on measurable rates, prices, fees, yields, and protocol metrics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
