import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BYTIX.ai - The Missing Link Between Strategy & Execution",
  description: "Powerful, cloud-based crypto trading automation platform that bridges real-time trading signals with crypto exchanges. Deploy advanced bots with fine-grained control and automation.",
  keywords: "crypto trading, trading bots, TradingView automation, DCA bots, grid trading, signal trading, crypto automation, trading platform",
  authors: [{ name: "BYTIX.ai" }],
  openGraph: {
    title: "BYTIX.ai - Advanced Crypto Trading Automation",
    description: "Transform TradingView alerts and JSON signals into live trades with our powerful bot automation platform.",
    type: "website",
    url: "https://bytix.ai",
  },
  twitter: {
    card: "summary_large_image",
    title: "BYTIX.ai - The Missing Link Between Strategy & Execution",
    description: "Advanced crypto trading automation platform for signal-led strategies.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
