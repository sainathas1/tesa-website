"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

interface MouseTiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Electric blue or neon purple
  borderColor?: string;
  onClick?: () => void;
}

export default function MouseTiltCard({
  children,
  className = "",
  glowColor = "rgba(0, 240, 255, 0.45)",
  borderColor = "rgba(0, 240, 255, 0.6)",
  onClick,
}: MouseTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse coordinate motion values normalized from -0.5 to 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Physics springs for natural response
  const mouseXSpring = useSpring(x, { stiffness: 260, damping: 24 });
  const mouseYSpring = useSpring(y, { stiffness: 260, damping: 24 });

  // Deep, responsive 3D tilt mapping
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["18deg", "-18deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-18deg", "18deg"]);

  // Interactive dynamic specular shine coordinates
  const spotlightX = useTransform(mouseXSpring, [-0.5, 0.5], ["10%", "90%"]);
  const spotlightY = useTransform(mouseYSpring, [-0.5, 0.5], ["10%", "90%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse position relative to card center
    const normalizedX = (e.clientX - rect.left) / width - 0.5;
    const normalizedY = (e.clientY - rect.top) / height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div className="perspective-1200 w-full h-full">
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{
          scale: 1.04,
          y: -8,
          transition: { duration: 0.3 },
        }}
        className={`relative rounded-2xl p-5 sm:p-6 backdrop-blur-2xl bg-slate-950/65 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:shadow-[0_0_35px_rgba(0,240,255,0.35)] ${className}`}
      >
        {/* Subtle Woven Texture Overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-woven-texture opacity-25" />

        {/* Dynamic Specular Sheen / Spotlight tracking mouse */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${spotlightX} ${spotlightY}, ${glowColor}, transparent 65%)`,
          }}
        />

        {/* Glowing Cyan Accent Border */}
        <div
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            border: `1px solid ${borderColor}`,
            boxShadow: `inset 0 0 16px ${glowColor}, 0 0 20px ${glowColor}`,
          }}
        />

        {/* Content with true 3D Z-Depth Translation */}
        <div
          style={{ transform: "translateZ(45px)" }}
          className="relative z-10 h-full flex flex-col justify-between"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
