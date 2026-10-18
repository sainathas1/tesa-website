"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getOptimizedAvatarUrl } from "@/lib/cloudinary";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  designation: string;
  year: string;
  category: "core" | "technical" | "events" | "outreach" | string;
  bio: string;
  specialization: string;
  skills: string[];
  photoPlaceholder: string;
  photoUrl?: string;
  accentColor: string;
  [key: string]: any;
}

interface TeamDetailModalProps {
  member: TeamMember | null;
  onClose: () => void;
}

export default function TeamDetailModal({ member, onClose }: TeamDetailModalProps) {
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
  }, [member?.id]);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
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
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-name"
            className="relative z-50 w-full max-w-2xl max-h-[90vh] rounded-3xl glass-modal-panel p-5 sm:p-8 overflow-y-auto my-auto custom-scrollbar group"
          >
            {/* Ambient Aurora Glow in Corner */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent blur-3xl rounded-full" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />

            {/* Top Close (X) Button (Minimum 44x44px touch target) */}
            <button
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl shadow-lg"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-[10px] font-mono text-purple-300 mb-5 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>TESA COUNCIL MEMBER DOSSIER • 2025–26</span>
            </div>

            {/* Main Content Layout: Two-column on tablet/desktop */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Large Rectangular Portrait Photo */}
              <div className="relative w-full sm:w-60 aspect-[4/5] sm:h-80 rounded-2xl border border-white/10 bg-zinc-900 overflow-hidden shrink-0 shadow-[0_15px_35px_rgba(0,0,0,0.85)] group">
                {(member.photoUrl || (member as any).imageUrl || (member as any).image) && !photoError ? (
                  <div className="relative w-full h-full">
                    <img
                      src={getOptimizedAvatarUrl(member.photoUrl || (member as any).imageUrl || (member as any).image)}
                      alt={member.name}
                      onError={() => setPhotoError(true)}
                      className="w-full h-full object-cover object-top contrast-105 hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/20 to-transparent pointer-events-none" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
                  </div>
                ) : (
                  <div className="relative w-full h-full bg-gradient-to-br from-purple-900/80 to-indigo-950 flex flex-col items-center justify-center p-4 text-center select-none">
                    <span className="text-4xl font-bold text-white tracking-wider drop-shadow-md">
                      {(() => {
                        const ph = (member.photoPlaceholder || "").trim();
                        if (ph && ph.length <= 3 && !ph.includes("http")) return ph.toUpperCase();
                        const parts = (member.name || "").trim().split(/\s+/).filter(Boolean);
                        if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                        return (member.name || "TE").slice(0, 2).toUpperCase();
                      })()}
                    </span>
                    <span className="text-[9px] font-mono tracking-widest text-purple-300/80 uppercase mt-2 font-normal">
                      PORTRAIT ARCHIVE
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
                  </div>
                )}

                {/* Academic Year Tag */}
                <span className="absolute bottom-3 right-3 z-10 text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-purple-300 border border-purple-500/30 shadow-md">
                  {member.year}
                </span>

                {/* Bottom Gradient Accent Line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80" />
              </div>

              {/* Right Column: Member Details */}
              <div className="flex-1 w-full space-y-4">
                {/* Role Pill & Category */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider shadow-[0_0_12px_rgba(168,85,247,0.2)]">
                    {(member.role || "").replace(/coordianator/gi, "Coordinator")}
                  </span>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.03] text-zinc-400 border border-white/10 uppercase">
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
                  <p className="text-xs font-mono text-purple-400/90 mt-1">
                    {member.designation}
                  </p>
                </div>

                {/* Specialization */}
                <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono">
                  <span className="text-purple-400 font-bold block mb-0.5">
                    ✦ FOCUS &amp; SPECIALIZATION:
                  </span>
                  <span className="text-zinc-200">{member.specialization}</span>
                </div>

                {/* Comma-separated Skills rendered as Neon Pill Tags */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block mb-2">
                    CORE COMPETENCIES &amp; SKILLS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-white/[0.03] text-zinc-300 border border-white/10 hover:border-purple-500/40 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Full Member Bio */}
                <div className="pt-2 border-t border-white/[0.08]">
                  <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block mb-1.5">
                    BIOGRAPHY &amp; CONTRIBUTIONS:
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans font-normal">
                    {member.bio}
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span>SGGSIE&amp;T TEXTILE DEPARTMENT</span>
              <button
                onClick={onClose}
                className="text-purple-400 hover:text-purple-300 transition-colors font-semibold cursor-pointer"
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
