"use client";

import React, { useEffect, useState } from "react";

export default function AuroraBackground() {
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none bg-[#050508]"
      aria-hidden="true"
    >
      {/* 1. Micro-Dot Mesh Grid with subtle contrast */}
      <div className="absolute inset-0 studio-dot-grid opacity-20" />

      {/* 2. Interactive Real-Time Mouse Spotlight (Illuminates glass from underneath) */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300 rounded-full blur-[90px] mix-blend-screen opacity-70"
        style={{
          width: 500,
          height: 500,
          left: mousePos.x - 250,
          top: mousePos.y - 250,
          background:
            "radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(6, 182, 212, 0.25) 45%, transparent 75%)",
          willChange: "transform, left, top",
        }}
      />

      {/* 3. Vivid, High-Energy Ambient Aurora Orbs (Fast-drifting, rich saturation for frosted glass refraction) */}
      <div className="absolute inset-0 filter blur-[95px] mix-blend-screen opacity-75">
        {/* Orb 1: Electric Violet (#8b5cf6) - Top Left & Center Motion */}
        <div
          className="absolute -top-24 left-[8%] w-[580px] h-[580px] rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-fuchsia-500 animate-aurora-1"
          style={{ willChange: "transform" }}
        />

        {/* Orb 2: Radiant Cyan & Electric Sky (#06b6d4 / #0ea5e9) - Right / Middle Motion */}
        <div
          className="absolute top-[20%] -right-20 w-[620px] h-[620px] rounded-full bg-gradient-to-bl from-cyan-400 via-sky-500 to-indigo-600 animate-aurora-2"
          style={{ willChange: "transform" }}
        />

        {/* Orb 3: Crimson Magenta & Pink (#db2777 / #ec4899) - Bottom Left */}
        <div
          className="absolute -bottom-32 left-[18%] w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-pink-600 via-fuchsia-600 to-purple-700 animate-aurora-3"
          style={{ willChange: "transform" }}
        />

        {/* Orb 4: Deep Royal Emerald & Teal (#10b981 / #14b8a6) - Center Depth Shimmer */}
        <div
          className="absolute top-[50%] left-[45%] -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-r from-purple-600 via-violet-500 to-indigo-500 animate-aurora-4"
          style={{ willChange: "transform" }}
        />
      </div>

      {/* 4. Live Floating Glowing Nano-Fiber Nodes (Smart Fiber Light Sparks) */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "12%", left: "15%", delay: "0s", duration: "7s", size: "w-2 h-2", color: "bg-cyan-400 shadow-[0_0_12px_#22d3ee]" },
          { top: "25%", left: "78%", delay: "1.5s", duration: "9s", size: "w-1.5 h-1.5", color: "bg-purple-400 shadow-[0_0_10px_#c084fc]" },
          { top: "42%", left: "32%", delay: "3s", duration: "8s", size: "w-2.5 h-2.5", color: "bg-fuchsia-400 shadow-[0_0_14px_#e879f9]" },
          { top: "65%", left: "85%", delay: "0.8s", duration: "10s", size: "w-2 h-2", color: "bg-violet-400 shadow-[0_0_12px_#a78bfa]" },
          { top: "80%", left: "22%", delay: "2.2s", duration: "8.5s", size: "w-1.5 h-1.5", color: "bg-cyan-300 shadow-[0_0_10px_#67e8f9]" },
          { top: "18%", left: "55%", delay: "4s", duration: "11s", size: "w-2 h-2", color: "bg-rose-400 shadow-[0_0_12px_#fb7185]" },
          { top: "52%", left: "62%", delay: "2.8s", duration: "7.5s", size: "w-1.5 h-1.5", color: "bg-indigo-400 shadow-[0_0_10px_#818cf8]" },
          { top: "72%", left: "48%", delay: "1.2s", duration: "9.5s", size: "w-2 h-2", color: "bg-teal-300 shadow-[0_0_12px_#5eead4]" },
          { top: "88%", left: "70%", delay: "3.5s", duration: "8s", size: "w-2.5 h-2.5", color: "bg-purple-300 shadow-[0_0_14px_#d8b4fe]" },
          { top: "35%", left: "10%", delay: "5s", duration: "10.5s", size: "w-1.5 h-1.5", color: "bg-pink-400 shadow-[0_0_10px_#f472b6]" },
        ].map((spark, idx) => (
          <div
            key={idx}
            className={`absolute rounded-full ${spark.size} ${spark.color} animate-sparkle-float`}
            style={{
              top: spark.top,
              left: spark.left,
              animationDelay: spark.delay,
              animationDuration: spark.duration,
            }}
          />
        ))}
      </div>

      {/* 5. Fluid Scanning Light Sweep (Dynamic Live Beam) */}
      <div className="absolute -inset-x-full top-0 h-[500px] bg-gradient-to-r from-transparent via-purple-500/[0.07] to-transparent transform -rotate-12 animate-scan-beam pointer-events-none" />

      {/* 6. Subtle Top Horizon Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[320px] bg-gradient-to-b from-purple-500/[0.12] via-transparent to-transparent pointer-events-none" />
    </div>
  );
}
