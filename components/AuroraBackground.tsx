"use client";

import React from "react";

export default function AuroraBackground() {
  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#050508]"
      aria-hidden="true"
    >
      {/* Studio Micro-Dot Mesh Texture (opacity 0.035 for tactile studio finish) */}
      <div className="absolute inset-0 studio-dot-grid opacity-[0.035]" />

      {/* Ambient Aurora Light Orbs (Slow-drifting, blend of Electric Violet, Crimson Magenta, Midnight Indigo) */}
      <div className="absolute inset-0 filter blur-[150px] opacity-25">
        {/* Orb 1: Electric Violet (#7c3aed) - Top Center / Left */}
        <div
          className="absolute -top-32 left-[12%] w-[580px] h-[580px] rounded-full bg-[#7c3aed] animate-aurora-1"
          style={{ willChange: "transform" }}
        />

        {/* Orb 2: Crimson Magenta (#db2777) - Right / Center */}
        <div
          className="absolute top-[28%] -right-28 w-[640px] h-[640px] rounded-full bg-[#db2777] animate-aurora-2"
          style={{ willChange: "transform" }}
        />

        {/* Orb 3: Midnight Indigo (#4f46e5) - Bottom Left / Center */}
        <div
          className="absolute -bottom-40 left-[22%] w-[680px] h-[680px] rounded-full bg-[#4f46e5] animate-aurora-3"
          style={{ willChange: "transform" }}
        />

        {/* Orb 4: Deep Royal Purple Glow - Center Depth */}
        <div
          className="absolute top-[48%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#9333ea] opacity-40 animate-aurora-1"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* Subtle top spotlight vignette */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[380px] bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
