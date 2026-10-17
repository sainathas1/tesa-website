"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import MouseTiltCard from "./MouseTiltCard";

interface HeroProps {
  onOpenRegister: (eventTitle?: string) => void;
}

export default function ParallaxHero({ onOpenRegister }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax motion for background text and ambient glowing threads
  const bgTextY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const bgTextOpacity = useTransform(scrollYProgress, [0, 0.6], [0.18, 0.02]);
  const ambientScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);

  return (
    <section
      id="hero"
      ref={containerRef}
      className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-28 pb-20 overflow-hidden bg-zinc-950"
    >
      {/* =========================================================================
          AMBIENT NEON THREAD BACKLIGHTING (Electric Blue & Deep Purple)
          ========================================================================= */}
      <motion.div
        style={{ scale: ambientScale }}
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[950px] h-[700px] bg-gradient-to-b from-purple-700/25 via-cyan-600/15 to-transparent blur-[140px] rounded-full"
      />
      <div className="pointer-events-none absolute top-1/3 -left-48 w-[600px] h-[600px] bg-purple-900/20 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute top-1/2 -right-48 w-[600px] h-[600px] bg-cyan-600/15 blur-[130px] rounded-full" />
      <div className="pointer-events-none absolute inset-0 bg-woven-texture opacity-40" />

      {/* =========================================================================
          BACKGROUND TEXT: Massive, Bold Text: "SONICLOOM & SMART FABRICS"
          ========================================================================= */}
      <motion.div
        style={{ y: bgTextY, opacity: bgTextOpacity }}
        className="pointer-events-none absolute top-20 sm:top-24 w-full select-none text-center z-0 flex flex-col items-center justify-center leading-none"
      >
        <span className="font-extrabold text-[10vw] lg:text-[11.5vw] tracking-tighter uppercase bg-gradient-to-b from-white via-cyan-200 to-transparent bg-clip-text text-transparent drop-shadow-[0_0_90px_rgba(0,240,255,0.4)] whitespace-nowrap">
          SONICLOOM &amp;
        </span>
        <span className="font-extrabold text-[11vw] lg:text-[12.5vw] tracking-tighter uppercase bg-gradient-to-b from-purple-300 via-indigo-400 to-transparent bg-clip-text text-transparent drop-shadow-[0_0_110px_rgba(168,85,247,0.5)] -mt-4 sm:-mt-8 lg:-mt-12 whitespace-nowrap">
          SMART FABRICS
        </span>
      </motion.div>

      {/* Hero Headline & Intro */}
      <div className="relative z-10 text-center max-w-4xl mx-auto mb-10 sm:mb-14">
        <motion.div
          initial={{ opacity: 0, y: -20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-[11px] sm:text-xs font-mono text-cyan-300 mb-4 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#00f0ff]" />
          <span>SGGSIE&amp;T TEXTILE ENGINEERING STUDENTS ASSOCIATION • TESA</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 25, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-tight"
        >
          Next-Generation{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,240,255,0.45)]">
            Computational Weaving
          </span>{" "}
          &amp; Synthetic Polymers
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base md:text-lg text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed"
        >
          Pioneering smart conductive fibers, electrospun nanofiltration membranes, and autonomous electronic rapier looms at SGGSIE&amp;T Nanded.
        </motion.p>
      </div>

      {/* =========================================================================
          THE 3D CARDS: Row of 3 Overlapping Translucent Cards with MouseTiltCard
          Cards: "Spinning & Yarn Tech", "Woven & Knitted Structures", "Technical Textiles"
          ========================================================================= */}
      <div
        id="cards"
        className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-0 lg:-space-x-6 items-stretch justify-center"
      >
        {/* CARD 1: Spinning & Yarn Tech */}
        <motion.div
          initial={{ opacity: 0, y: 45, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 hover:z-40 transition-all duration-300"
        >
          <MouseTiltCard
            glowColor="rgba(0, 240, 255, 0.45)"
            borderColor="rgba(0, 240, 255, 0.6)"
            className="group h-full border-cyan-500/40"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                  POLYMER DYNAMICS
                </span>
                <span className="text-[10px] font-mono text-cyan-400">STAGE 01</span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-5 shadow-[0_0_20px_rgba(0,240,255,0.35)]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.93 4.93 4.24 4.24" />
                  <path d="m14.83 9.17 4.24-4.24" />
                  <path d="m14.83 14.83 4.24 4.24" />
                  <path d="m9.17 14.83-4.24 4.24" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Spinning &amp; Yarn Tech
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-mono">
                Advanced rotor spinning, air-vortex drafting systems, carbon-nanotube blend core yarns, and micro-denier tensile alignment diagnostics.
              </p>

              <div className="space-y-2 mb-6 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✦</span>
                  <span>High-speed Ring Spindles (22,000 RPM)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✦</span>
                  <span>Piezoelectric Polymer Core Yarns</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-cyan-500/20 flex items-center justify-between font-mono">
              <span className="text-[11px] text-cyan-300 font-semibold">
                Yarn Mechanics Lab
              </span>
              <button
                onClick={() => onOpenRegister("Spinning & Yarn Workshop")}
                className="text-xs font-bold text-white hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Lab →</span>
              </button>
            </div>
          </MouseTiltCard>
        </motion.div>

        {/* CARD 2: Woven & Knitted Structures */}
        <motion.div
          initial={{ opacity: 0, y: 45, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-20 hover:z-40 transition-all duration-300"
        >
          <MouseTiltCard
            glowColor="rgba(0, 240, 255, 0.4)"
            borderColor="rgba(0, 240, 255, 0.55)"
            className="group h-full border-cyan-500/40 shadow-[0_30px_70px_rgba(0,0,0,0.9)]"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                  AUTOMATED LOOMS
                </span>
                <span className="text-[10px] font-mono text-cyan-400">STAGE 02</span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-5 shadow-[0_0_20px_rgba(0,240,255,0.35)]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                  <path d="M6 4v16" />
                  <path d="M12 4v16" />
                  <path d="M18 4v16" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Woven &amp; Knitted Structures
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-mono">
                Electronic Jacquard shedding, 3D multi-axial orthogonal weaving for aerospace preforms, and seamless circular compression knit architectures.
              </p>

              <div className="space-y-2 mb-6 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✦</span>
                  <span>1,200 RPM Computerized Rapier Looms</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✦</span>
                  <span>3D Orthogonal Carbon Weaves</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-cyan-500/20 flex items-center justify-between font-mono">
              <span className="text-[11px] text-cyan-300 font-semibold">
                CAD/CAM Weaving Shed
              </span>
              <button
                onClick={() => onOpenRegister("SMART WEAVES HACKATHON 2026")}
                className="text-xs font-bold text-white hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                <span>Hackathon →</span>
              </button>
            </div>
          </MouseTiltCard>
        </motion.div>

        {/* CARD 3: Technical Textiles */}
        <motion.div
          initial={{ opacity: 0, y: 45, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.48, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-30 hover:z-40 transition-all duration-300"
        >
          <MouseTiltCard
            glowColor="rgba(0, 240, 255, 0.4)"
            borderColor="rgba(0, 240, 255, 0.55)"
            className="group h-full border-cyan-500/40"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="text-[10px] font-mono font-bold tracking-wider px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                  SMART COMPOSITES
                </span>
                <span className="text-[10px] font-mono text-cyan-400">STAGE 03</span>
              </div>

              <div className="w-12 h-12 rounded-2xl bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center text-cyan-300 mb-5 shadow-[0_0_20px_rgba(0,240,255,0.35)]">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Technical Textiles
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6 font-mono">
                Electrospun nanofiber bio-membranes, conductive polymer threads for biometric tracking, geotextile filtration, and ballistic shielding composites.
              </p>

              <div className="space-y-2 mb-6 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✦</span>
                  <span>99.8% Sub-Micron HEPA Filtration</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cyan-400">✦</span>
                  <span>3 Provisional Patents Under Review</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-cyan-500/20 flex items-center justify-between font-mono">
              <span className="text-[11px] text-cyan-300 font-semibold">
                Nanotech Research Facility
              </span>
              <button
                onClick={() => onOpenRegister("TEX-CONCLAVE 2026")}
                className="text-xs font-bold text-white hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
              >
                <span>Conclave &apos;26 →</span>
              </button>
            </div>
          </MouseTiltCard>
        </motion.div>
      </div>
    </section>
  );
}
