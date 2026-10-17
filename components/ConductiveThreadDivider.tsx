"use client";

import { motion } from "framer-motion";

interface ConductiveThreadDividerProps {
  label?: string;
  subLabel?: string;
  accent?: "cyan" | "violet" | "dual" | "emerald";
  className?: string;
}

export default function ConductiveThreadDivider({
  label = "OPTICAL CONDUCTIVE YARN BUS",
  subLabel = "WARP // WEFT PHASE 180° • 400nm WAVEGUIDE • 0.04 Ω/cm",
  accent = "dual",
  className = "",
}: ConductiveThreadDividerProps) {
  // Wave path generators for intertwining sine waves across a 1200-width coordinate system
  const wave1Path =
    "M 0 25 C 100 5, 200 45, 300 25 C 400 5, 500 45, 600 25 C 700 5, 800 45, 900 25 C 1000 5, 1100 45, 1200 25";

  // Wave 2: Intertwined opposite phase
  const wave2Path =
    "M 0 25 C 100 45, 200 5, 300 25 C 400 45, 500 5, 600 25 C 700 45, 800 5, 900 25 C 1000 45, 1100 5, 1200 25";

  // Intertwining nodes at the intersection points: x = 0, 150, 300, 450, 600, 750, 900, 1050, 1200
  const nodePoints = [150, 300, 450, 600, 750, 900, 1050];

  return (
    <div
      className={`relative w-full py-8 sm:py-12 overflow-hidden flex flex-col items-center justify-center select-none ${className}`}
      aria-hidden="true"
    >
      {/* Background ambient glow behind the threads */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3/4 max-w-4xl h-8 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent blur-xl" />
        <div
          className={`w-1/2 max-w-2xl h-8 bg-gradient-to-r from-transparent ${
            accent === "emerald"
              ? "via-emerald-500/10"
              : "via-purple-500/10"
          } to-transparent blur-xl`}
        />
      </div>

      {/* SVG Container with Intertwining Sine Waves */}
      <div className="w-full max-w-7xl mx-auto px-4 relative h-12 flex items-center justify-center">
        <svg
          viewBox="0 0 1200 50"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            {/* Cyan Glow Filter */}
            <filter id="cyanGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0   0 0 0 0 0.94   0 0 0 0 1   0 0 0 1 0"
                result="cyan"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Violet Glow Filter */}
            <filter id="violetGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.66   0 0 0 0 0.33   0 0 0 0 0.97   0 0 0 1 0"
                result="violet"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Emerald Glow Filter */}
            <filter id="emeraldGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0.06   0 0 0 0 0.72   0 0 0 0 0.51   0 0 0 1 0"
                result="emerald"
              />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Thread Gradients */}
            <linearGradient id="cyanThreadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.1" />
              <stop offset="20%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="80%" stopColor="#00f0ff" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00f0ff" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="violetThreadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#a855f7" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#e879f9" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#a855f7" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="emeraldThreadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
              <stop offset="25%" stopColor="#34d399" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.95" />
              <stop offset="75%" stopColor="#10b981" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>

            {/* Straight Guide Rail */}
            <linearGradient id="centerRailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0" />
              <stop offset="30%" stopColor="#00f0ff" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop
                offset="70%"
                stopColor={accent === "emerald" ? "#10b981" : "#a855f7"}
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor={accent === "emerald" ? "#10b981" : "#a855f7"}
                stopOpacity="0"
              />
            </linearGradient>
          </defs>

          {/* Central Baseline Grounded Rail */}
          <line
            x1="0"
            y1="25"
            x2="1200"
            y2="25"
            stroke="url(#centerRailGrad)"
            strokeWidth="0.8"
            strokeDasharray="4 6"
          />

          {/* Wave 1: Warp Conductive Filament (Cyan) */}
          <path
            d={wave1Path}
            fill="none"
            stroke="url(#cyanThreadGrad)"
            strokeWidth="1.8"
            strokeLinecap="round"
            filter="url(#cyanGlow)"
            className="opacity-90"
          />

          {/* Wave 2: Weft Conductive Filament (Violet or Emerald) */}
          <path
            d={wave2Path}
            fill="none"
            stroke={accent === "emerald" ? "url(#emeraldThreadGrad)" : "url(#violetThreadGrad)"}
            strokeWidth="1.6"
            strokeLinecap="round"
            filter={accent === "emerald" ? "url(#emeraldGlow)" : "url(#violetGlow)"}
            className="opacity-80"
          />

          {/* Intersecting Jacquard Weave Nodes */}
          {nodePoints.map((cx, idx) => (
            <g key={idx}>
              {/* Outer pulsing ring */}
              <circle
                cx={cx}
                cy={25}
                r="3.5"
                fill="none"
                stroke={
                  idx % 2 === 0
                    ? "#00f0ff"
                    : accent === "emerald"
                    ? "#34d399"
                    : "#c084fc"
                }
                strokeWidth="0.8"
                className="animate-ping opacity-30 origin-center"
                style={{ animationDuration: `${2.5 + (idx % 3) * 0.5}s` }}
              />
              {/* Core conductive bead */}
              <circle
                cx={cx}
                cy={25}
                r="2"
                fill="#ffffff"
                stroke={
                  idx % 2 === 0
                    ? "#00f0ff"
                    : accent === "emerald"
                    ? "#10b981"
                    : "#a855f7"
                }
                strokeWidth="1"
                filter="url(#cyanGlow)"
              />
            </g>
          ))}
        </svg>

        {/* Center Textile Spec Telemetry Pill */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`px-3.5 py-1 rounded-full bg-slate-950/90 border ${
              accent === "emerald"
                ? "border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : accent === "violet"
                ? "border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                : "border-cyan-500/40 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
            } backdrop-blur-md flex items-center gap-2 care-label-badge`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                accent === "emerald"
                  ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                  : accent === "violet"
                  ? "bg-purple-400 shadow-[0_0_6px_#a855f7]"
                  : "bg-cyan-400 shadow-[0_0_6px_#00f0ff]"
              } animate-pulse`}
            />
            <span
              className={`text-[10px] font-mono tracking-widest uppercase font-semibold ${
                accent === "emerald"
                  ? "text-emerald-300"
                  : accent === "violet"
                  ? "text-purple-300"
                  : "text-cyan-300"
              }`}
            >
              {label}
            </span>
            <span className="text-slate-600 font-mono text-[9px]">|</span>
            <span className="text-[9px] font-mono tracking-tight text-slate-300 hidden md:inline-block">
              {subLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
