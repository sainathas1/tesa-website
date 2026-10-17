"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginButton from "./LoginButton";

interface NavbarProps {
  onOpenRegister: () => void;
}

export default function Navbar({ onOpenRegister }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      unsubscribe();
    };
  }, []);

  return (
    <nav className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-4xl transition-all duration-300">
      <div
        className={`relative flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/80 backdrop-blur-2xl border border-cyan-500/40 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_25px_rgba(0,240,255,0.2)]"
            : "bg-slate-950/65 backdrop-blur-xl border border-cyan-500/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)]"
        }`}
      >
        {/* Left: Brand Identity with Official TESA Logo */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-cyan-400/50 p-0.5 overflow-hidden bg-slate-950 group-hover:scale-105 group-hover:border-cyan-300 transition-all shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0">
            <img
              src="/tesa-logo.png"
              alt="TESA Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs sm:text-sm tracking-wider text-white group-hover:text-cyan-300 transition-colors">
              TESA
            </span>
            <span className="text-[9px] font-mono text-cyan-300/80 -mt-0.5 tracking-tight hidden sm:block">
              SGGSIE&amp;T NANDED
            </span>
          </div>
        </Link>

        {/* Center: Clean Text Navigation Links */}
        <div className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300">
          <Link
            href="#hero"
            className="hover:text-cyan-300 transition-colors relative py-1"
          >
            Home
          </Link>
          <Link
            href="#events"
            className="hover:text-cyan-300 transition-colors relative py-1"
          >
            Events
          </Link>
          <Link
            href="#team"
            className="hover:text-cyan-300 transition-colors relative py-1"
          >
            TESA Team
          </Link>
        </div>

        {/* Right: Highlighted Register Button & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LoginButton />

          <button
            onClick={onOpenRegister}
            className="relative group overflow-hidden px-4 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs font-semibold text-white tracking-wide transition-all duration-300 shadow-[0_0_20px_rgba(0,240,255,0.35)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] border border-cyan-400/40"
          >
            {/* Pulsing neon cyan-blue background gradient */}
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-sky-600 to-purple-600 transition-transform duration-300 group-hover:scale-105" />
            <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="relative flex items-center gap-1.5">
              <span>Register</span>
              <svg
                className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </nav>
  );
}
