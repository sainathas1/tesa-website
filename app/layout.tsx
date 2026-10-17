import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TESA | Textile Engineering Students Association • SGGSIE&T",
  description:
    "Official hyper-modern portal of the Textile Engineering Students Association (TESA) at SGGSIE&T Nanded. Pioneering smart technical textiles, electrospun nanofibers, and automated loom research.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full dark antialiased scroll-smooth overflow-x-hidden max-w-full`}
    >
      <body className="min-h-full flex flex-col bg-[#040508] text-slate-100 selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden w-full max-w-full relative">
        {children}
      </body>
    </html>
  );
}
