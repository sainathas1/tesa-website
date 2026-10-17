"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import LoginButton from "./LoginButton";

interface NavbarProps {
  onOpenRegister: () => void;
  onOpenVerifiedList?: () => void;
}

export default function Navbar({
  onOpenRegister,
  onOpenVerifiedList,
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("hero");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);

      // Detect current section in view
      const sections = ["hero", "events", "team"];
      const scrollPosition = window.scrollY + 200;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveTab(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    setActiveTab(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { label: "Home", id: "hero" },
    { label: "Events", id: "events" },
    { label: "TESA Team", id: "team" },
  ];

  return (
    <>
      {/* Floating Pill-Shaped Glass Navbar */}
      <header
        className={`fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl rounded-full transition-all duration-300 ${
          isScrolled
            ? "bg-zinc-950/85 backdrop-blur-2xl border border-white/15 px-4 sm:px-6 py-2 sm:py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(124,58,237,0.15)]"
            : "bg-zinc-950/70 backdrop-blur-2xl border border-white/10 px-4 sm:px-6 py-2.5 sm:py-3 shadow-[0_0_40px_rgba(0,0,0,0.8)]"
        }`}
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4 w-full">
          {/* Brand Identity with Official TESA Logo */}
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 group shrink-0 min-h-[40px]"
          >
            <div className="relative w-8 h-8 rounded-full border border-white/20 p-0.5 overflow-hidden bg-black/60 group-hover:scale-105 group-hover:border-purple-400 transition-all shadow-[0_0_15px_rgba(124,58,237,0.25)] shrink-0">
              <Image
                src="/tesa-logo.png"
                alt="TESA Logo"
                width={32}
                height={32}
                className="w-full h-full object-cover rounded-full"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs sm:text-sm tracking-wide text-white group-hover:text-purple-300 transition-colors">
                TESA
              </span>
              <span className="text-[9px] font-mono text-zinc-400 -mt-0.5 tracking-tight hidden sm:block">
                SGGSIE&amp;T
              </span>
            </div>
          </Link>

          {/* Center Navigation Links with Smooth Active Indicator */}
          <nav
            aria-label="Desktop Navigation"
            className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/[0.06]"
          >
            {navLinks.map((link) => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all duration-300 cursor-pointer ${
                    isActive
                      ? "text-white"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <LoginButton />

            {onOpenVerifiedList && (
              <button
                type="button"
                onClick={onOpenVerifiedList}
                className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] cursor-pointer shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified List</span>
              </button>
            )}

            <button
              onClick={onOpenRegister}
              className="relative group overflow-hidden px-4 sm:px-5 py-2 rounded-full text-xs font-semibold text-white tracking-wide transition-all duration-300 glow-button-primary cursor-pointer shrink-0 inline-flex items-center justify-center gap-1.5"
            >
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
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="md:hidden min-w-[38px] min-h-[38px] w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <span
                className={`w-3.5 h-0.5 bg-current rounded-full transition-transform duration-300 ${
                  mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              />
              <span
                className={`w-3.5 h-0.5 bg-current rounded-full transition-opacity duration-200 ${
                  mobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`w-3.5 h-0.5 bg-current rounded-full transition-transform duration-300 ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Glass Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-20 left-4 right-4 z-50 md:hidden rounded-3xl border border-white/15 bg-zinc-950/90 backdrop-blur-2xl p-5 shadow-[0_25px_50px_rgba(0,0,0,0.9),0_0_40px_rgba(124,58,237,0.2)]"
            >
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase text-zinc-500 font-mono tracking-widest px-2 mb-1">
                  Directory
                </span>
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleNavClick(link.id)}
                    className="w-full text-left py-3 px-4 rounded-2xl text-sm font-medium text-zinc-200 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] transition-all flex items-center justify-between cursor-pointer"
                  >
                    <span>{link.label}</span>
                    <span className="text-purple-400 text-xs">→</span>
                  </button>
                ))}

                <div className="pt-3 border-t border-white/10 space-y-2 mt-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenRegister();
                    }}
                    className="w-full py-3 px-4 rounded-2xl glow-button-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
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
                      className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>✔ Check Verified Registrations</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
