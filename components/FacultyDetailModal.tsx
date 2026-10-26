"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export interface FacultyMember {
  id?: string;
  name: string;
  designation: string;
  qualification: string;
  specialization: string;
  experience: string;
  email: string;
  researchFocus: string[] | string;
  photoUrl?: string;
  imageUrl?: string;
  image?: string;
  bio?: string;
  createdAt?: any;
}

interface FacultyDetailModalProps {
  faculty: FacultyMember | null;
  onClose: () => void;
}

export default function FacultyDetailModal({ faculty, onClose }: FacultyDetailModalProps) {
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setPhotoError(false);
  }, [faculty?.name]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (faculty) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [faculty, onClose]);

  const researchItems = faculty
    ? Array.isArray(faculty.researchFocus)
      ? faculty.researchFocus
      : typeof faculty.researchFocus === "string"
      ? (faculty.researchFocus as string).split(",").map((s) => s.trim()).filter(Boolean)
      : []
    : [];

  const displayPhoto = faculty?.photoUrl || faculty?.imageUrl || faculty?.image || "";

  return (
    <AnimatePresence>
      {faculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          {/* Dark Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-40"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="faculty-modal-name"
            className="relative z-50 w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#0b0c10] border border-white/15 p-5 sm:p-8 overflow-y-auto my-auto custom-scrollbar group shadow-2xl"
          >
            {/* Ambient Emerald & Cyan Glow for Faculty */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-emerald-600/20 via-teal-600/10 to-transparent blur-3xl rounded-full" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-cyan-600/15 via-emerald-600/10 to-transparent blur-3xl rounded-full" />

            {/* Top Close Button */}
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

            {/* Faculty Header Dossier */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 pb-6 border-b border-white/[0.08]">
              {/* Portrait Frame */}
              <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-2xl overflow-hidden shrink-0 border border-white/15 bg-zinc-900 shadow-xl">
                {displayPhoto && !photoError ? (
                  <Image
                    src={displayPhoto}
                    alt={faculty.name}
                    fill
                    unoptimized={displayPhoto.startsWith("data:")}
                    className="object-cover"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/60 to-zinc-900 text-emerald-400 font-mono font-bold text-2xl">
                    <span>
                      {faculty.name
                        .replace(/^Dr\.\s*|^Prof\.\s*/i, "")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("") || "FC"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-normal mt-1">FACULTY</span>
                  </div>
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
              </div>

              {/* Names & Designations */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono tracking-widest uppercase mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>FACULTY OF TEXTILE TECHNOLOGY</span>
                </div>

                <h3 id="faculty-modal-name" className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
                  {faculty.name}
                </h3>

                <p className="text-emerald-400 text-sm font-semibold mt-1">
                  {faculty.designation}
                </p>

                <p className="text-xs text-zinc-400 font-mono mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <span>🎓</span>
                  <span>{faculty.qualification}</span>
                </p>

                {faculty.experience && (
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">
                    Experience: <span className="text-zinc-300">{faculty.experience}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Dossier Body */}
            <div className="mt-6 space-y-5 text-left">
              {/* Specialization */}
              {faculty.specialization && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Domain Specialization</span>
                  </h4>
                  <p className="text-sm text-zinc-200 bg-white/[0.03] border border-white/[0.08] p-3.5 rounded-xl leading-relaxed">
                    {faculty.specialization}
                  </p>
                </div>
              )}

              {/* Research Focus */}
              {researchItems.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>Key Research Thrusts</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {researchItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-lg text-xs font-mono bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bio / Overview if available */}
              {faculty.bio && (
                <div>
                  <h4 className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>Academic Dossier &amp; Initiatives</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-white/[0.02] border border-white/[0.06] p-3.5 rounded-xl">
                    {faculty.bio}
                  </p>
                </div>
              )}

              {/* Direct Official Contact */}
              {faculty.email && (
                <div className="pt-2">
                  <a
                    href={`mailto:${faculty.email}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-mono text-xs font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                  >
                    <span>✉ Contact Official Mail:</span>
                    <span className="underline">{faculty.email}</span>
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
