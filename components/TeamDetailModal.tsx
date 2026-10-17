"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  designation: string;
  year: string;
  category: "core" | "technical" | "events" | "outreach";
  bio: string;
  specialization: string;
  skills: string[];
  photoPlaceholder: string;
  photoUrl?: string;
  accentColor: string;
}

interface TeamDetailModalProps {
  member: TeamMember | null;
  onClose: () => void;
}

export default function TeamDetailModal({ member, onClose }: TeamDetailModalProps) {
  // Listen for Escape key to close modal smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (member) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [member, onClose]);

  return (
    <AnimatePresence>
      {member && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Dark Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            aria-hidden="true"
          />

          {/* Modal Container: Fades and scales in smoothly from center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-name"
            className="relative z-50 w-full max-w-2xl rounded-3xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,240,255,0.2)] overflow-hidden my-8"
          >
            {/* Subtle Tech Grid Background Decor */}
            <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-15" />
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />

            {/* Corner Crosshair HUD Accents */}
            <span className="pointer-events-none absolute top-3 left-3 font-mono text-[10px] text-cyan-500/40">
              +
            </span>
            <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-cyan-500/40">
              +
            </span>

            {/* Top Close (X) Button (Minimum 44x44px touch target) */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/[0.05] hover:bg-red-950/60 hover:border-red-500/50 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-lg"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Modal Header Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/50 text-[10px] font-mono text-cyan-300 mb-5 shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>TESA COUNCIL MEMBER DOSSIER • 2025–26</span>
            </div>

            {/* Main Content Layout: Two-column on tablet/desktop */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Large Rectangular Portrait Photo */}
              <div className="relative w-full sm:w-52 h-64 sm:h-72 rounded-2xl border border-cyan-500/40 bg-zinc-950 overflow-hidden shrink-0 shadow-[0_15px_35px_rgba(0,0,0,0.85)] group">
                {member.photoUrl ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={member.photoUrl}
                      alt={member.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 208px"
                      className="object-cover mix-blend-luminosity grayscale-[25%] contrast-110 hover:grayscale-0 hover:mix-blend-normal transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/30 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-cyan-950/40 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-16 h-16 rounded-2xl border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center font-mono text-2xl font-black text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.25)] mb-2">
                      {member.photoPlaceholder || "TE"}
                    </div>
                    <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                      PORTRAIT ARCHIVE
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
                  </div>
                )}

                {/* Academic Year Tag */}
                <span className="absolute bottom-3 right-3 z-10 text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow-md">
                  {member.year}
                </span>

                {/* Bottom Cyan Accent Line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />
              </div>

              {/* Right Column: Member Details */}
              <div className="flex-1 w-full space-y-4">
                {/* Role Pill & Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono font-bold text-cyan-300 uppercase tracking-wider">
                    {member.role}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/10 uppercase">
                    {member.category}
                  </span>
                </div>

                {/* Full Name & Designation */}
                <div>
                  <h3
                    id="team-modal-name"
                    className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight"
                  >
                    {member.name}
                  </h3>
                  <p className="text-xs font-mono text-cyan-400/90 mt-1">
                    {member.designation}
                  </p>
                </div>

                {/* Specialization */}
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs font-mono">
                  <span className="text-cyan-400 font-bold block mb-0.5">
                    ⚡ TECHNICAL SPECIALIZATION:
                  </span>
                  <span className="text-slate-200">{member.specialization}</span>
                </div>

                {/* Comma-separated Skills rendered as Neon Pill Tags */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-2">
                    CORE COMPETENCIES &amp; SKILLS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,240,255,0.15)] hover:border-cyan-400 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Full Member Bio */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-1.5">
                    BIOGRAPHY &amp; CONTRIBUTIONS:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans font-normal">
                    {member.bio}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SGGSIE&amp;T TEXTILE DEPARTMENT</span>
              <button
                onClick={onClose}
                className="text-cyan-400 hover:text-cyan-300 transition-colors font-semibold cursor-pointer"
              >
                Done Viewing ✕
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
