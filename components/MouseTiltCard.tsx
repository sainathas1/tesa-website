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
  glowColor?: string;
  borderColor?: string;
  onClick?: () => void;
}

export default function MouseTiltCard({
  children,
  className = "",
  glowColor = "rgba(168, 85, 247, 0.4)",
  borderColor = "rgba(168, 85, 247, 0.5)",
  onClick,
}: MouseTiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Mouse coordinate motion values normalized from -0.5 to 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Physics springs for organic response
  const mouseXSpring = useSpring(x, { stiffness: 240, damping: 24 });
  const mouseYSpring = useSpring(y, { stiffness: 240, damping: 24 });

  // Subtle responsive 3D tilt
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  // Dynamic specular shine coordinates
  const spotlightX = useTransform(mouseXSpring, [-0.5, 0.5], ["10%", "90%"]);
  const spotlightY = useTransform(mouseYSpring, [-0.5, 0.5], ["10%", "90%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

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
          scale: 1.015,
          y: -6,
          transition: { duration: 0.25 },
        }}
        className={`bento-card group relative rounded-3xl p-6 overflow-hidden ${className}`}
      >
        {/* Top-Right Ambient Radial Glow (Illuminates on hover) */}
        <div className="bento-glow" />

        {/* Dynamic Specular Spotlight tracking cursor */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${spotlightX} ${spotlightY}, ${glowColor}, transparent 65%)`,
          }}
        />

        {/* Content with 3D Z-Depth Translation */}
        <div
          style={{ transform: "translateZ(20px)" }}
          className="relative z-10 h-full flex flex-col justify-between"
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
