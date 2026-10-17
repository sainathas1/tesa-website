"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ParallaxHero from "@/components/ParallaxHero";
import TesaTeamSection from "@/components/TesaTeamSection";
import DepartmentEventsGrid from "@/components/DepartmentEventsGrid";
import Textile3DCenterpiece from "@/components/Textile3DCenterpiece";
import DepartmentOverviewSection from "@/components/DepartmentOverviewSection";
import PastEventsSection from "@/components/PastEventsSection";
import EventRegistrationModal from "@/components/EventRegistrationModal";

// Client-only dynamic WebGL Liquid Ether & Deep-Sea Creature Particle Flow Background
const LiquidEtherBackground = dynamic(
  () => import("@/components/LiquidEtherBackground"),
  { ssr: false }
);

export default function Home() {
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedEventTitle, setSelectedEventTitle] = useState("TEX-CONCLAVE 2026");

  const handleOpenRegistration = (eventTitle: string = "TEX-CONCLAVE 2026") => {
    setSelectedEventTitle(eventTitle);
    setIsRegModalOpen(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden">
      {/* 3D Interactive Liquid Ether / Deep-Sea Creature Particle Flow Background (pointer-events: none) */}
      <LiquidEtherBackground />

      {/* Engineering Grid & Subtle Ambient Glow Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-tech-grid opacity-25 z-0" />

      {/* =========================================================================
          NAVIGATION: Minimalist Pill-Shaped Sticky Navbar at Top Center
          ========================================================================= */}
      <Navbar onOpenRegister={() => handleOpenRegistration("TEX-CONCLAVE 2026")} />

      {/* =========================================================================
          SECTION 1: The Parallax Hero
          - Massive bold background text "WEAVE THE FUTURE"
          - Row of translucent glassmorphic cards with 3D tilt effect on mouse move
          - TESA Topics: Upcoming Events, Our Team, Textile Innovations
          ========================================================================= */}
      <ParallaxHero onOpenRegister={handleOpenRegistration} />

      {/* =========================================================================
          SECTION 2: TESA Team Section
          - 3D parallax scrolling team cards with category filters
          - Executive Council, Technical Leads, Event Coordinators, Public Relations
          ========================================================================= */}
      <TesaTeamSection />

      {/* =========================================================================
          SECTION 3: The Grid (Department & Past Events)
          - Masonry-style grid of dark, rounded cards
          - 1px solid white/10 inner border & glowing hover effect
          - Faculty, Staff, and Past Events with sequential scroll animations
          ========================================================================= */}
      <DepartmentEventsGrid />

      {/* =========================================================================
          SECTION 4: The 3D Textile Centerpiece
          - Large purple gradient background
          - React Three Fiber canvas rendering a highly reflective metallic 3D fabric mesh
            undulating and rotating slowly mimicking silk / composite fibers
          - Bold text to the left: "Build beyond every limit"
          ========================================================================= */}
      <Textile3DCenterpiece onOpenRegister={handleOpenRegistration} />

      {/* =========================================================================
          SECTION 5: Department Overview
          - Faculty, Staff, Curriculum, and 6 Laboratory Facilities
          - Tabbed interface with detailed cards
          ========================================================================= */}
      <DepartmentOverviewSection />

      {/* =========================================================================
          SECTION 6: Past Events History
          - Filterable event archives with detail modals
          - Category and Year filters
          ========================================================================= */}
      <PastEventsSection />

      {/* =========================================================================
          INTERACTIVE REGISTRATION MODAL
          ========================================================================= */}
      <EventRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        defaultEventTitle={selectedEventTitle}
      />

      {/* =========================================================================
          HYPER-MODERN FOOTER
          ========================================================================= */}
      <footer className="relative z-20 w-full border-t border-white/[0.08] bg-[#070512]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-white font-bold text-sm tracking-wide">
                TESA • SGGSIE&amp;T NANDED
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-[11px] text-slate-400">
              Department of Textile Technology • Est. 1987
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-slate-300">
            <a href="#hero" className="hover:text-purple-300 transition-colors">
              Hero Top
            </a>
            <a href="#cards" className="hover:text-purple-300 transition-colors">
              3D Cards
            </a>
            <a href="#grid" className="hover:text-purple-300 transition-colors">
              Faculty &amp; Events
            </a>
            <a href="#centerpiece" className="hover:text-purple-300 transition-colors">
              3D Fiber Mesh
            </a>
            <Link
              href="/admin"
              className="px-3 py-1 rounded-full bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <span>🔒</span>
              <span>Admin Console</span>
            </Link>
          </div>
        </div>

        <div className="border-t border-white/[0.04] py-3 text-center text-[10px] font-mono text-slate-600">
          © 2026 Textile Engineering Students Association, SGGSIE&amp;T. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
