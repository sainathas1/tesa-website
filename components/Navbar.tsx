"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import LoginButton from "./LoginButton";
import FabricSwatchPicker from "./FabricSwatchPicker";

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenVerifiedList?: () => void;
}

export default function Navbar({ onOpenRegister, onOpenVerifiedList }: NavbarProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      unsubscribe();
    };
  }, []);

  // Smooth scroll handler that closes the mobile menu
  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { label: "Home", href: "#hero", id: "hero", icon: "✦" },
    { label: "Events", href: "#events", id: "events", icon: "📅" },
    { label: "TESA Team", href: "#team", id: "team", icon: "👥" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 w-full h-16 sm:h-20 transition-all duration-300 ${
          isScrolled || mobileMenuOpen
            ? "bg-slate-950/90 backdrop-blur-2xl border-b border-cyan-500/25 shadow-[0_10px_35px_rgba(0,0,0,0.85),0_0_20px_rgba(0,240,255,0.12)]"
            : "bg-slate-950/70 backdrop-blur-xl border-b border-white/[0.08]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
          {/* Left: Brand Identity with Official TESA Logo */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-h-[44px]"
          >
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-cyan-400/50 p-0.5 overflow-hidden bg-slate-950 group-hover:scale-105 group-hover:border-cyan-300 transition-all shadow-[0_0_15px_rgba(0,240,255,0.35)] shrink-0">
              <Image
                src="/tesa-logo.png"
                alt="TESA Official Emblem Logo"
                width={36}
                height={36}
                className="w-full h-full object-cover rounded-full"
                priority
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

          {/* Center: Standard Text Navigation Links (Hidden on mobile < md) */}
          <nav
            aria-label="Desktop Navigation"
            className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider text-slate-300"
          >
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className="relative py-2 hover:text-cyan-300 transition-colors duration-200 group min-h-[44px] flex items-center"
              >
                <span>{link.label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-cyan-400 to-teal-300 group-hover:w-full transition-all duration-300 rounded-full" />
              </a>
            ))}
          </nav>

          {/* Right: Actions (3D Fabric Swatch Picker, Auth, Register Button, & Mobile Hamburger Menu) */}
          <div className="flex items-center gap-2 sm:gap-3">
            <FabricSwatchPicker />

            <LoginButton />

            {onOpenVerifiedList && (
              <button
                type="button"
                onClick={onOpenVerifiedList}
                className="hidden lg:inline-flex items-center gap-1.5 px-3.5 min-h-[44px] rounded-full text-xs font-mono font-semibold text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 hover:border-emerald-400 transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer shrink-0"
              >
                <span>✔</span>
                <span>Verified List</span>
              </button>
            )}

            <button
              onClick={onOpenRegister}
              className="relative group overflow-hidden px-4 sm:px-5 min-h-[44px] rounded-full text-xs font-semibold text-white tracking-wide transition-all duration-300 shadow-[0_0_15px_rgba(0,240,255,0.35)] hover:shadow-[0_0_25px_rgba(0,240,255,0.55)] border border-cyan-400/40 cursor-pointer shrink-0 inline-flex items-center justify-center"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-sky-600 to-purple-600 transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-1.5">
                <span>Register</span>
                <svg
                  className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform hidden sm:block"
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

            {/* Mobile Hamburger Toggle Button (Minimum 44x44px touch target) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="md:hidden relative min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-white/[0.04] border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 hover:text-white flex flex-col items-center justify-center gap-1.5 p-2 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/40 shrink-0"
            >
              <span
                className={`w-4 h-0.5 bg-current rounded-full transition-transform duration-300 origin-center ${
                  mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`w-4 h-0.5 bg-current rounded-full transition-opacity duration-200 ${
                  mobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`w-4 h-0.5 bg-current rounded-full transition-transform duration-300 origin-center ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          MOBILE SLIDE-OUT / DROPDOWN SHEET
          ========================================================================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 top-16 bg-black/70 backdrop-blur-sm z-40 md:hidden"
              aria-hidden="true"
            />

            {/* Mobile Dropdown Menu Container */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-16 left-0 right-0 z-50 md:hidden border-b border-cyan-500/30 bg-[#07090f]/95 backdrop-blur-2xl shadow-[0_25px_50px_rgba(0,0,0,0.95),0_0_35px_rgba(0,240,255,0.15)] px-4 sm:px-6 py-6 font-mono"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase text-cyan-400/70 tracking-widest px-3 mb-1">
                  NAVIGATION DIRECTORY
                </span>

                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className="w-full text-left min-h-[48px] py-3 px-4 rounded-xl text-sm font-semibold tracking-wide text-slate-200 hover:text-cyan-300 bg-white/[0.03] hover:bg-cyan-950/50 border border-white/[0.06] hover:border-cyan-500/40 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 group-hover:scale-110 transition-transform">
                        {link.icon}
                      </span>
                      <span>{link.label}</span>
                    </div>
                    <span className="text-cyan-400/60 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all text-xs">
                      →
                    </span>
                  </button>
                ))}

                {/* Mobile 3D Fabric Theme Switcher */}
                <div className="py-2 px-1">
                  <span className="text-[10px] uppercase text-cyan-400/80 tracking-widest block mb-2 font-bold">
                    3D FABRIC SWATCH PRESET
                  </span>
                  <FabricSwatchPicker />
                </div>

                {/* Mobile Conclave Registration & Verified List Actions */}
                <div className="pt-3 mt-2 border-t border-white/[0.08] space-y-2.5">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenRegister();
                    }}
                    className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Register for Conclave &amp; Events</span>
                    <span>→</span>
                  </button>

                  {onOpenVerifiedList && (
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenVerifiedList();
                      }}
                      className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>✔ Check Registration &amp; Verified List</span>
                    </button>
                  )}
                </div>

                {/* Council tenure footnote */}
                <div className="pt-3 text-center">
                  <span className="text-[10px] text-slate-500 font-mono">
                    SGGSIE&amp;T TEXTILE COUNCIL • 2025–2026 TENURE
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
