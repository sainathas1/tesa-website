"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  deadline?: string;
  capacity?: number;
  status: "open" | "upcoming" | "closed";
  eventStatus?: "Upcoming" | "Concluded";
  mediaUrl?: string;
  summary: string;
  highlights?: string;
  galleryUrls?: string[];
}

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  onRegister: (eventTitle: string) => void;
}

export default function EventDetailModal({
  event,
  onClose,
  onRegister,
}: EventDetailModalProps) {
  // Listen for Escape key to close modal smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (event) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [event, onClose]);

  const isConcluded = event?.eventStatus === "Concluded" || event?.status === "closed";
  const isOpen = !isConcluded && event?.status === "open";
  const isUpcoming = !isConcluded && event?.status === "upcoming";

  return (
    <AnimatePresence>
      {event && (
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
            aria-labelledby="event-modal-title"
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
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/60 hover:bg-red-950/80 hover:border-red-500/50 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg"
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

            {/* Event Media / Banner */}
            {event.mediaUrl ? (
              <div className="relative w-full h-48 sm:h-60 rounded-2xl overflow-hidden border border-cyan-500/30 mb-6 shadow-xl">
                <Image
                  src={event.mediaUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 680px"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

                {/* Overlaid Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-md uppercase tracking-wider font-semibold">
                    {event.category}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border backdrop-blur-md font-semibold ${
                      isOpen
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        : isUpcoming
                        ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                        : "bg-slate-900/80 text-slate-400 border-slate-700/50"
                    }`}
                  >
                    {isOpen ? "● OPEN FOR REGISTRATION" : isUpcoming ? "▲ UPCOMING" : "■ CONCLUDED"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-full h-24 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 mb-6 flex items-center justify-center font-mono text-xs text-cyan-400">
                OFFICIAL TESA NATIONAL CONCLAVE ARCHIVE
              </div>
            )}

            {/* Event Title */}
            <h3
              id="event-modal-title"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-4"
            >
              {event.title}
            </h3>

            {/* Key Information Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-5 font-mono text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="text-cyan-400 text-sm">📅</span>
                <div>
                  <span className="text-[10px] text-slate-500 block">EVENT DATE</span>
                  <span className="font-semibold text-white">{event.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300">
                <span className="text-cyan-400 text-sm">📍</span>
                <div>
                  <span className="text-[10px] text-slate-500 block">VENUE / LOCATION</span>
                  <span className="font-semibold text-white truncate">{event.venue}</span>
                </div>
              </div>

              {event.deadline && (
                <div className="flex items-center gap-2.5 text-slate-300">
                  <span className="text-amber-400 text-sm">⏳</span>
                  <div>
                    <span className="text-[10px] text-slate-500 block">REGISTRATION DEADLINE</span>
                    <span className="font-semibold text-white">{event.deadline}</span>
                  </div>
                </div>
              )}

              {event.capacity && (
                <div className="flex items-center gap-2.5 text-slate-300">
                  <span className="text-purple-400 text-sm">👥</span>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SEAT CAPACITY</span>
                    <span className="font-semibold text-white">{event.capacity} Delegates</span>
                  </div>
                </div>
              )}
            </div>

            {/* Full Event Description */}
            <div className="mb-5">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-1.5">
                FULL EVENT BRIEFING &amp; OBJECTIVES:
              </span>
              <p className="text-sm text-slate-300 leading-relaxed font-sans font-normal">
                {event.summary}
              </p>
            </div>

            {/* Highlights Pill */}
            {event.highlights && (
              <div className="p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/30 text-xs font-mono text-cyan-200 mb-6 flex items-center gap-2.5 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                <span className="text-cyan-400 text-base">✦</span>
                <span className="leading-snug">{event.highlights}</span>
              </div>
            )}

            {/* Event Gallery Photos Grid */}
            {event.galleryUrls && event.galleryUrls.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                    EVENT PHOTO ARCHIVE ({event.galleryUrls.length} PHOTOGRAPHS):
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">CLICK TO VIEW ORIGINAL</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {event.galleryUrls.map((imgUrl, idx) => (
                    <a
                      key={idx}
                      href={imgUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-[4/3] rounded-xl overflow-hidden border border-cyan-500/30 hover:border-cyan-400 group/img transition-all block shadow-md"
                    >
                      <Image
                        src={imgUrl}
                        alt={`${event.title} archival photo ${idx + 1}`}
                        fill
                        unoptimized={imgUrl.startsWith("data:")}
                        sizes="(max-width: 640px) 50vw, 25vw"
                        className="object-cover group-hover/img:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-mono">🔍 VIEW</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Prominent "Register Now" Button Action */}
            <div className="pt-2">
              {isOpen || isUpcoming ? (
                <button
                  onClick={() => {
                    onClose();
                    onRegister(event.title);
                  }}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-mono font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,240,255,0.45)] hover:shadow-[0_0_35px_rgba(0,240,255,0.65)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{isOpen ? "Register Now" : "Pre-Register / Reserve Seat"}</span>
                  <span className="text-base">→</span>
                </button>
              ) : (
                <div className="w-full py-3 rounded-xl bg-slate-900/80 border border-white/10 text-center font-mono text-xs text-slate-400 flex items-center justify-center gap-2">
                  <span className="text-cyan-400">■</span>
                  <span>Archive Recorded • This Conclave Has Concluded</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
