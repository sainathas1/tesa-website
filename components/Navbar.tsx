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
        {/* Left: Brand Identity */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 via-indigo-500/20 to-purple-500/30 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(0,240,255,0.3)]">
            <svg
              className="w-4 h-4 text-cyan-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
              <path d="M6 4v16" />
              <path d="M12 4v16" />
              <path d="M18 4v16" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs sm:text-sm tracking-wider text-white group-hover:text-cyan-300 transition-colors">
              TESA
            </span>
            <span className="text-[9px] font-mono text-cyan-300/70 -mt-0.5 tracking-tight hidden sm:block">
              SGGSIE&amp;T
            </span>
          </div>
        </Link>

        {/* Center: Clean Text Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
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
          {user && (
            <Link
              href="/admin"
              className="text-cyan-400 hover:text-cyan-300 transition-colors text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30"
            >
              Admin Portal
            </Link>
          )}
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
