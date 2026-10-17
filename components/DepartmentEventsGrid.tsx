"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useMotionTemplate, AnimatePresence } from "framer-motion";

interface GridItem {
  id: string;
  badge: string;
  badgeColor: string;
  glowColor: string;
  title: string;
  subtitle: string;
  highlightStat?: string;
  description: string;
  details: string[];
  colSpan?: string;
  meta: string;
  ctaText?: string;
}

// Spotlight Card Component that follows the user's cursor on hover
function SpotlightGridCard({
  item,
  onSelect,
  delay = 0,
}: {
  item: GridItem;
  onSelect: (item: GridItem) => void;
  delay?: number;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 35, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      className={`group relative rounded-3xl p-7 sm:p-8 flex flex-col justify-between overflow-hidden bg-slate-950/65 backdrop-blur-2xl border border-cyan-500/30 hover:border-cyan-400 ring-1 ring-inset ring-cyan-500/10 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:shadow-[0_0_35px_rgba(0,240,255,0.25)] ${
        item.colSpan || "col-span-1"
      }`}
    >
      {/* Woven background texture */}
      <div className="pointer-events-none absolute inset-0 bg-woven-texture opacity-25" />

      {/* AMBIENT GLOWING RADIAL GRADIENT SPOTLIGHT (Follows cursor on hover) */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              ${item.glowColor},
              rgba(0, 240, 255, 0.08),
              transparent 75%
            )
          `,
        }}
      />

      {/* Inner Content */}
      <div className="relative z-10">
        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <span
            className={`text-[10px] font-mono font-bold tracking-wider px-3 py-1 rounded-full border ${item.badgeColor}`}
          >
            {item.badge}
          </span>
          {item.highlightStat && (
            <span className="text-[11px] font-mono text-cyan-300 font-semibold">
              ⚡ {item.highlightStat}
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-cyan-200 transition-colors mb-1">
          {item.title}
        </h3>
        <p className="text-xs font-mono text-purple-300/90 mb-4">
          {item.subtitle}
        </p>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-6 font-normal">
          {item.description}
        </p>

        {/* Details Bullets */}
        <ul className="space-y-2 mb-6 font-mono text-xs text-slate-300">
          {item.details.map((d, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">✦</span>
              <span className="leading-snug">{d}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Meta & Action */}
      <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-xs">
        <span className="text-slate-400 text-[11px] truncate max-w-[220px]">
          {item.meta}
        </span>
        <button
          onClick={() => onSelect(item)}
          className="text-xs font-bold text-cyan-400 hover:text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform"
        >
          <span>{item.ctaText || "Inspect"}</span>
          <span>→</span>
        </button>
      </div>
    </motion.div>
  );
}

const SPOTLIGHT_ITEMS: GridItem[] = [
  {
    id: "faculty-coordinators",
    badge: "CORE FACULTY • CO-ORDINATORS",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    glowColor: "rgba(168, 85, 247, 0.28)",
    title: "Faculty Coordinators",
    subtitle: "Department Leadership & Student Mentorship",
    highlightStat: "65+ Yrs Combined Research",
    description:
      "Spearheading undergraduate research fellowships, AICTE projects, and collegiate symposiums under the SGGSIE&T Department of Textile Technology.",
    details: [
      "Dr. Ravindra V. Adivarekar — HOD & Professor (Ph.D. ICT Mumbai, Wet Finishing & Green Dyeing)",
      "Dr. Snehalata R. Joshi — Associate Professor (Ph.D. IIT Delhi, Nanofiber Synthesis)",
      "Dr. Arvind S. Patil — Professor (Ph.D. IIT Delhi, Rotor Spinning & Synthetic Blends)",
      "Dr. Milind S. Kulkarni — Associate Professor (Ph.D. VJTI, Weaving Automation & 3D Preforms)",
    ],
    colSpan: "col-span-1 md:col-span-2 lg:col-span-1",
    meta: "hod.textile@sggs.ac.in • Faculty Wing",
    ctaText: "Full Profile",
  },
  {
    id: "bio-suture-pitch",
    badge: "FLAGSHIP EVENT • INNOVATION PITCH",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
    glowColor: "rgba(0, 240, 255, 0.32)",
    title: "Bio-Suture Lightning Pitch",
    subtitle: "Next-Gen Biomedical Thread & Surgical Meshes",
    highlightStat: "₹75,000 Seed Grant Pool",
    description:
      "A fast-paced 4-minute pitch competition challenging student teams to formulate antimicrobial, bio-resorbable surgical sutures using electrospun polymer coatings and collagen fibers.",
    details: [
      "Track 1: Bio-absorbable Polyglycolic Acid (PGA) High-Tensile Monofilaments",
      "Track 2: Drug-Eluting Nano-Silver Coated Surgical Sutures",
      "Live Evaluation by MedTech VCs & Biomedical Polymer Researchers",
      "Winning team receives 6-month prototyping bench in the Nanotechnology Lab",
    ],
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    meta: "April 29, 2026 • Textile Auditorium",
    ctaText: "Register Pitch",
  },
  {
    id: "lap-former-workshops",
    badge: "HANDS-ON LAB • WORKSHOP",
    badgeColor: "bg-pink-500/20 text-pink-300 border-pink-500/40",
    glowColor: "rgba(236, 72, 153, 0.3)",
    title: "Lap Former Workshops",
    subtitle: "Precision Sliver Preparation & Combing Masterclass",
    highlightStat: "Rieter Machinery Access",
    description:
      "Intensive practical training session examining high-speed sliver lap and ribbon lap preparation. Students calibrate roll pressures, draft ratios, and analyze nep removal efficiency.",
    details: [
      "Machine teardown and mechanical synchronization on Rieter E 32 Unilap",
      "Measurement of Fiber Parallelization Index using Digital Image Sensors",
      "Comparison of High-Noil vs. Low-Noil Combing Cycles across Cotton & Tencel",
      "Certified Lab Credential issued by SGGSIE&T TESA Technical Committee",
    ],
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    meta: "May 15–16, 2026 • Spinning Lab",
    ctaText: "Book Slot",
  },
  {
    id: "rapier-automation",
    badge: "AUTOMATION SPRINT • 1200 RPM",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    glowColor: "rgba(99, 102, 241, 0.28)",
    title: "Automated Rapier Loom Sprint",
    subtitle: "High-Speed Electronic Jacquard Shedding",
    highlightStat: "Live Looms Access",
    description:
      "Explore continuous weft insertion dynamics on modern rapier machines. Students design complex jacquard patterns in CAD and weave live specimens during the sprint.",
    details: [
      "Electronic Jacquard controller programming with Staubli interfaces",
      "Edge-AI Optical Scanner calibration for real-time warp breakage detection",
      "Carbon-fiber reinforcement preforms fabrication for aerospace models",
    ],
    colSpan: "col-span-1",
    meta: "Textile CAD/CAM Studio Shed",
    ctaText: "Inspect Sprint",
  },
  {
    id: "conclave-archive",
    badge: "SYMPOSIUM ARCHIVE • 2025",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
    glowColor: "rgba(16, 185, 129, 0.25)",
    title: "TEX-CONCLAVE 2025 Archive",
    subtitle: "National Symposium on Sustainable & Smart Fibers",
    highlightStat: "480+ Delegates • 28 Colleges",
    description:
      "Our landmark annual symposium uniting delegates from ICT Mumbai, IIT Delhi, and DKTE for technical paper presentations and eco-friendly dye showcases.",
    details: [
      "65 Technical Research Papers Presented across 3 concurrent tracks",
      "Keynote Address by Dr. S. K. Roy (VP Fiber Tech, Reliance Industries)",
      "1st Prize: Bio-Engineered Chitosan Nanofibers for Antimicrobial Dressings",
    ],
    colSpan: "col-span-1 md:col-span-1",
    meta: "Annual Flagship Conclave • SGGSIE&T",
    ctaText: "View Archive",
  },
  {
    id: "technical-staff",
    badge: "MACHINERY INSTRUCTORS • LABS",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    glowColor: "rgba(245, 158, 11, 0.25)",
    title: "Department Technical Staff",
    subtitle: "Machine Calibration & Workshop Superintendents",
    highlightStat: "20+ Yrs Floor Expertise",
    description:
      "Expert superintendents ensuring precision operation and safety across all spinning ring frames, rapier looms, and high-voltage electrospinners.",
    details: [
      "Shri. D. R. Kulkarni — Senior Technical Instructor (Spinning Lab, 24 Yrs)",
      "Shri. S. V. More — Lab Superintendent (Automated Weaving & Looms, 21 Yrs)",
      "Shri. G. N. Deshmukh — Wet Processing & Chemical Finishing Expert (18 Yrs)",
    ],
    colSpan: "col-span-1 md:col-span-2 lg:col-span-2",
    meta: "Department Machinery Oversight • SGGSIE&T",
    ctaText: "Staff Directory",
  },
];

export default function DepartmentEventsGrid() {
  const [activeModalItem, setActiveModalItem] = useState<GridItem | null>(null);

  return (
    <section
      id="grid"
      className="relative z-10 w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden"
    >
      {/* Background Soft Neon Radial Glows */}
      <div className="pointer-events-none absolute top-1/4 -right-40 w-[600px] h-[600px] bg-purple-900/20 blur-[150px] rounded-full" />
      <div className="pointer-events-none absolute bottom-10 -left-40 w-[600px] h-[600px] bg-cyan-900/15 blur-[150px] rounded-full" />

      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
        className="text-center max-w-3xl mx-auto mb-14 sm:mb-16"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-[11px] font-mono text-cyan-300 mb-3 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
          <span>DEPARTMENT RECONNAISSANCE &amp; COMPETITIONS</span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Department &amp;{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.35)]">
            Events Matrix
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 mt-3 font-normal leading-relaxed">
          Hover over any card to trigger the ambient neon spotlight. Explore faculty research coordinators, the Bio-Suture Lightning Pitch, and Lap Former workshops.
        </p>
      </motion.div>

      {/* =========================================================================
          THE GRID: Masonry Layout with Spotlight Hover Effect
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SPOTLIGHT_ITEMS.map((item, idx) => (
          <SpotlightGridCard
            key={item.id}
            item={item}
            onSelect={(selected) => setActiveModalItem(selected)}
            delay={idx * 0.08}
          />
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl rounded-3xl border border-cyan-500/40 bg-zinc-950 text-slate-100 p-7 sm:p-8 shadow-[0_0_60px_rgba(0,240,255,0.25)] overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full border ${activeModalItem.badgeColor}`}>
                  {activeModalItem.badge}
                </span>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="w-8 h-8 rounded-full border border-white/15 hover:border-red-400 text-slate-300 hover:text-white flex items-center justify-center text-xs font-mono transition-colors"
                >
                  ✕
                </button>
              </div>

              <h3 className="text-2xl font-bold text-white mb-1">
                {activeModalItem.title}
              </h3>
              <p className="text-xs font-mono text-purple-300 mb-4">
                {activeModalItem.subtitle}
              </p>

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 mb-5 text-xs text-slate-200 leading-relaxed font-mono">
                {activeModalItem.description}
              </div>

              <h4 className="text-xs font-mono uppercase text-cyan-300 mb-2 font-bold tracking-wider">
                Specification &amp; Program Curriculum
              </h4>
              <ul className="space-y-2 mb-6 font-mono text-xs text-slate-300">
                {activeModalItem.details.map((d, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-cyan-400">✔</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">{activeModalItem.meta}</span>
                <button
                  onClick={() => setActiveModalItem(null)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 hover:opacity-90 text-black font-bold font-mono"
                >
                  Close Matrix
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
