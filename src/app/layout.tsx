import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Előd Varga | CTO & Blockchain Engineer",
  description:
    "CTO at Shinso. Blockchain systems, AI, cross-chain execution. 2x exits. EWOR Fellow. Angel Investor.",
  keywords: [
    "Előd Varga",
    "blockchain",
    "CTO",
    "smart contracts",
    "DeFi",
    "AI",
    "web3",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  );
}
