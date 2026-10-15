"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";

// Dynamically import the dedicated TextileCanvas component to ensure client-only WebGL execution
const TextileCanvas = dynamic(() => import("./TextileCanvas"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] sm:h-[500px] lg:h-[580px] flex flex-col items-center justify-center text-cyan-400 font-mono text-xs gap-3">
      <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      <span className="tracking-widest uppercase">INITIALIZING CLOTH SIMULATION ENGINE...</span>
    </div>
  ),
});

interface CenterpieceProps {
  onOpenRegister: (eventTitle?: string) => void;
}

export default function Textile3DCenterpiece({ onOpenRegister }: CenterpieceProps) {
  return (
    <section
      id="centerpiece"
      className="relative z-10 w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-zinc-950 via-[#150a2b] to-zinc-950"
    >
      {/* =========================================================================
          LARGE PURPLE & ELECTRIC BLUE NEON GRADIENT BACKGROUND
          ========================================================================= */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[950px] h-[700px] bg-gradient-to-tr from-purple-800/35 via-violet-600/25 to-cyan-700/25 blur-[160px] rounded-full" />
      <div className="pointer-events-none absolute top-10 right-10 w-[550px] h-[550px] bg-purple-600/20 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute bottom-10 left-10 w-[550px] h-[550px] bg-cyan-500/15 blur-[140px] rounded-full" />
      <div className="pointer-events-none absolute inset-0 bg-woven-texture opacity-30" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* =========================================================================
            LEFT COLUMN: Bold Text: "Build beyond every limit"
            ========================================================================= */}
        <div className="lg:col-span-5 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/60 text-xs font-mono text-cyan-300 mb-6 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>REACT-THREE-FIBER • TEXTILE CENTERPIECE</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white uppercase leading-[1.05] mb-6"
          >
            Build beyond{" "}
            <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,240,255,0.4)]">
              every limit.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal mb-8 font-mono"
          >
            Watch the live sine-wave cloth simulation rendered in real-time WebGL. High-gloss physical synthetic fibers illuminated by neon purple and electric blue lights represent the future of technical textiles, bio-resorbable surgical meshes, and carbon composite architectures engineered at SGGSIE&amp;T.
          </motion.p>

          {/* Technical Telemetry Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="grid grid-cols-3 gap-3 mb-8 font-mono"
          >
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl font-bold text-cyan-300 block">
                6,400
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-tight">
                Sim Vertices
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl font-bold text-purple-300 block">
                0.94
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-tight">
                Metal Sheen
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-sm">
              <span className="text-xl sm:text-2xl font-bold text-pink-300 block">
                60 FPS
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-tight">
                Fluid Drapery
              </span>
            </div>
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap items-center gap-4"
          >
            <button
              onClick={() => onOpenRegister("TEX-CONCLAVE 2026")}
              className="px-6 py-3 rounded-full text-xs font-mono font-bold tracking-wider uppercase text-black bg-gradient-to-r from-cyan-400 via-purple-300 to-pink-400 hover:opacity-90 shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all"
            >
              Register for Conclave →
            </button>
            <a
              href="#grid"
              className="px-5 py-3 rounded-full text-xs font-mono font-medium tracking-wider text-slate-300 bg-white/[0.04] border border-white/15 hover:border-cyan-400 hover:text-white transition-colors"
            >
              Explore Events Grid
            </a>
          </motion.div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: The Dedicated TextileCanvas.tsx Component
            ========================================================================= */}
        <div className="lg:col-span-7 relative">
          {/* Outer Glass HUD Container */}
          <div className="relative rounded-3xl border border-cyan-500/30 bg-zinc-950/70 backdrop-blur-2xl p-2 sm:p-4 shadow-[0_25px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.2)] overflow-hidden">
            {/* Tech HUD Corner Indicators */}
            <div className="pointer-events-none absolute top-4 left-4 z-20 font-mono text-[10px] text-cyan-300 flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>R3F // TEXTILE_CANVAS_SIM</span>
            </div>
            <div className="pointer-events-none absolute top-4 right-4 z-20 font-mono text-[10px] text-purple-300 uppercase">
              PLANE_GEOMETRY: 80x80 SEGMENTS
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 font-mono text-[10px] text-slate-500 uppercase">
              LIGHTS: DUAL NEON (PURPLE &amp; BLUE)
            </div>
            <div className="pointer-events-none absolute bottom-4 right-4 z-20 font-mono text-[10px] text-cyan-400/80 uppercase">
              STATUS: REAL-TIME SINE UNDULATION
            </div>

            {/* Dynamically imported Canvas */}
            <TextileCanvas />
          </div>
        </div>
      </div>
    </section>
  );
}
