"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// =============================================================================
// AUTHENTIC BRAND SVG LOGO ICONS
// =============================================================================

export function GmailLogoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.545l8.073-6.052C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
      <path
        d="M0 5.457v2.727l12 9 12-9V5.457c0-2.023-2.309-3.178-3.927-1.964L12 9.545 3.927 3.493C2.31 2.279 0 3.434 0 5.457z"
        fill="#C5221F"
      />
      <path
        d="M0 5.457c0-.904.732-1.636 1.636-1.636h3.819v7.909L0 8.184V5.457z"
        fill="#4285F4"
      />
      <path
        d="M24 5.457c0-.904-.732-1.636-1.636-1.636h-3.819v7.909l5.455-3.546V5.457z"
        fill="#34A853"
      />
      <path
        d="M18.545 3.821L12 8.73 5.455 3.821 3.927 3.493 12 9.545l8.073-6.052-1.528.328z"
        fill="#FBBC04"
      />
    </svg>
  );
}

export function InstagramLogoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="ig-lens-gradient" cx="20%" cy="110%" r="130%">
          <stop offset="0%" stopColor="#ffda77" />
          <stop offset="10%" stopColor="#fcd104" />
          <stop offset="50%" stopColor="#fa3c4c" />
          <stop offset="70%" stopColor="#d62976" />
          <stop offset="100%" stopColor="#962fbf" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig-lens-gradient)" />
      <path
        d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 15.2C10.23 15.2 8.8 13.77 8.8 12C8.8 10.23 10.23 8.8 12 8.8C13.77 8.8 15.2 10.23 15.2 12C15.2 13.77 13.77 15.2 12 15.2ZM17.4 7.8C17.4 8.46 16.86 9 16.2 9C15.54 9 15 8.46 15 7.8C15 7.14 15.54 6.6 16.2 6.6C16.86 6.6 17.4 7.14 17.4 7.8ZM21.9 8.2C21.8 6.1 20.4 4.5 18.2 4.4C16.8 4.3 14.4 4.2 12 4.2C9.6 4.2 7.2 4.3 5.8 4.4C3.6 4.5 2.2 6.1 2.1 8.2C2 9.6 1.9 12 1.9 12C1.9 12 2 14.4 2.1 15.8C2.2 17.9 3.6 19.5 5.8 19.6C7.2 19.7 9.6 19.8 12 19.8C14.4 19.8 16.8 19.7 18.2 19.6C20.4 19.5 21.8 17.9 21.9 15.8C22 14.4 22.1 12 22.1 12C22.1 12 22 9.6 21.9 8.2ZM19.6 17.2C19.2 18.2 18.4 19 17.4 19.4C16.1 19.9 13.1 19.8 12 19.8C10.9 19.8 7.9 19.9 6.6 19.4C5.6 19 4.8 18.2 4.4 17.2C3.9 15.9 4 12.9 4 12C4 11.1 3.9 8.1 4.4 6.8C4.8 5.8 5.6 5 6.6 4.6C7.9 4.1 10.9 4.2 12 4.2C13.1 4.2 16.1 4.1 17.4 4.6C18.4 5 19.2 5.8 19.6 6.8C20.1 8.1 20 11.1 20 12C20 12.9 20.1 15.9 19.6 17.2Z"
        fill="white"
      />
    </svg>
  );
}

export function LinkedInLogoIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#0A66C2" />
      <path
        d="M6.5 9H9V18H6.5V9ZM7.75 5C8.58 5 9.25 5.67 9.25 6.5C9.25 7.33 8.58 8 7.75 8C6.92 8 6.25 7.33 6.25 6.5C6.25 5.67 6.92 5 7.75 5ZM10.5 9H12.9V10.2H12.94C13.27 9.57 14.1 8.9 15.35 8.9C17.9 8.9 18.4 10.58 18.4 12.75V18H15.9V13.8C15.9 12.8 15.88 11.5 14.5 11.5C13.1 11.5 12.9 12.6 12.9 13.72V18H10.5V9Z"
        fill="white"
      />
    </svg>
  );
}

// =============================================================================
// OFFICIAL CONTACT CHANNELS DATA
// =============================================================================

export interface ContactChannel {
  id: string;
  name: string;
  handle: string;
  url: string;
  type: "email" | "instagram" | "linkedin";
  badge: string;
  badgeStyle: string;
  description: string;
  actionText: string;
  glowColor: string;
}

export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: "gmail",
    name: "TESA SGGS Email",
    handle: "tesa@sggs.ac.in",
    url: "mailto:tesa@sggs.ac.in",
    type: "email",
    badge: "Official Correspondence",
    badgeStyle: "border-red-500/30 bg-red-950/40 text-red-300",
    description: "Official inquiries, registrations, corporate sponsorships, and symposium queries.",
    actionText: "Compose Email",
    glowColor: "rgba(234, 67, 53, 0.25)",
  },
  {
    id: "instagram-tesa",
    name: "TESA SGGS Official",
    handle: "@tesa_sggs",
    url: "https://www.instagram.com/tesa_sggs?rpxt=cmpraG52dHZtdWtk",
    type: "instagram",
    badge: "Departmental Handle",
    badgeStyle: "border-fuchsia-500/30 bg-fuchsia-950/40 text-fuchsia-300",
    description: "Daily stories, student tech showcases, workshop schedules, and campus updates.",
    actionText: "Visit @tesa_sggs",
    glowColor: "rgba(214, 41, 118, 0.25)",
  },
  {
    id: "instagram-texplorer",
    name: "SGGS TEXPLORER",
    handle: "@sggs.texplorer",
    url: "https://www.instagram.com/sggs.texplorer?mdxt=cmwwNHN3OWl2NXQz",
    type: "instagram",
    badge: "National Mega Event",
    badgeStyle: "border-amber-500/30 bg-amber-950/40 text-amber-300",
    description: "All-India Textile & Smart Garment Symposium, competitions, awards, and gallery.",
    actionText: "Visit @sggs.texplorer",
    glowColor: "rgba(250, 60, 76, 0.25)",
  },
  {
    id: "linkedin",
    name: "TESA SGGSIE&T Nanded",
    handle: "Textile Engineering Student Association",
    url: "https://www.linkedin.com/company/textile-engineering-student-association-sggsie-t-nanded/",
    type: "linkedin",
    badge: "Professional Network",
    badgeStyle: "border-sky-500/30 bg-sky-950/40 text-sky-300",
    description: "Alumni network, industry partnerships, technical symposiums, and research papers.",
    actionText: "Connect on LinkedIn",
    glowColor: "rgba(10, 102, 194, 0.25)",
  },
];

// =============================================================================
// MODAL COMPONENT
// =============================================================================

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Close on Escape & Lock Body Scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleCopyEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText("tesa@sggs.ac.in");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          {/* Backdrop Blur */}
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
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-50 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-[#0b0c10] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(168,85,247,0.25)] overflow-hidden"
          >
            {/* Ambient Background Glow Effect */}
            <div
              className="absolute -top-32 -right-32 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-40"
              style={{
                background: "radial-gradient(circle, rgba(168,85,247,0.5) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(234,67,53,0.4) 0%, transparent 70%)",
              }}
            />

            {/* Pinned Sticky Header */}
            <div className="shrink-0 z-30 p-5 sm:p-6 border-b border-white/10 bg-black/60 backdrop-blur-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative w-11 h-11 rounded-2xl border border-white/30 p-[2px] overflow-hidden bg-white shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                  <Image
                    src="/tesa-logo.png"
                    alt="TESA Logo"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                      Contact &amp; Connect
                    </h3>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border border-purple-500/30 bg-purple-950/40 text-purple-300">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono truncate">
                    Textile Engineering Students Association • SGGSIE&amp;T
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 text-sm font-semibold"
                aria-label="Close contact modal"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Channels Grid */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5 relative z-10 custom-scrollbar">
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
                Reach out to the TESA executive body, invite collaborations, or follow our official social channels for live symposium coverage:
              </p>

              <div className="grid grid-cols-1 gap-3.5">
                {CONTACT_CHANNELS.map((channel) => (
                  <div
                    key={channel.id}
                    className="group relative rounded-2xl p-4 sm:p-4.5 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-white/25 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg"
                  >
                    {/* Left: Logo Button & Channel Info */}
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                      {/* Interactive Brand Logo Button */}
                      <a
                        href={channel.url}
                        target={channel.type === "email" ? undefined : "_blank"}
                        rel={channel.type === "email" ? undefined : "noopener noreferrer"}
                        className="relative w-12 h-12 rounded-2xl p-2.5 bg-black/50 border border-white/20 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-md cursor-pointer"
                        style={{
                          boxShadow: `0 0 25px ${channel.glowColor}`,
                        }}
                        title={`Open ${channel.name}`}
                      >
                        {channel.type === "email" && <GmailLogoIcon className="w-7 h-7" />}
                        {channel.type === "instagram" && <InstagramLogoIcon className="w-7 h-7" />}
                        {channel.type === "linkedin" && <LinkedInLogoIcon className="w-7 h-7" />}
                      </a>

                      {/* Text Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm sm:text-base text-white group-hover:text-purple-300 transition-colors">
                            {channel.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${channel.badgeStyle}`}
                          >
                            {channel.badge}
                          </span>
                        </div>

                        <div className="font-mono text-xs text-purple-300 mt-0.5 select-all break-all">
                          {channel.handle}
                        </div>

                        <p className="text-[11px] sm:text-xs text-zinc-400 mt-1 leading-snug">
                          {channel.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 justify-end">
                      {channel.type === "email" && (
                        <button
                          type="button"
                          onClick={handleCopyEmail}
                          className="px-3 py-2 rounded-xl text-xs font-mono font-medium bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-200 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          title="Copy Email Address"
                        >
                          {copiedEmail ? (
                            <>
                              <span className="text-emerald-400 font-bold">✔</span>
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5 text-zinc-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}

                      <a
                        href={channel.url}
                        target={channel.type === "email" ? undefined : "_blank"}
                        rel={channel.type === "email" ? undefined : "noopener noreferrer"}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                          channel.type === "email"
                            ? "bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(234,67,53,0.4)]"
                            : channel.id === "instagram-texplorer"
                            ? "bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white shadow-[0_0_20px_rgba(250,60,76,0.4)]"
                            : channel.type === "instagram"
                            ? "bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:opacity-95 text-white shadow-[0_0_20px_rgba(214,41,118,0.4)]"
                            : "bg-[#0A66C2] hover:bg-[#004182] text-white shadow-[0_0_20px_rgba(10,102,194,0.4)]"
                        }`}
                      >
                        <span>{channel.actionText}</span>
                        <svg
                          className="w-3 h-3"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M7 17L17 7" />
                          <path d="M7 7h10v10" />
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* Physical Address Footnote */}
              <div className="pt-4 border-t border-white/10 text-[11px] font-mono text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <span className="text-zinc-300 font-semibold">Campus Address:</span>{" "}
                  Department of Textile Technology, SGGSIE&amp;T, Vishnupuri, Nanded, Maharashtra 431606
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
