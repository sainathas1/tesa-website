"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import MouseTiltCard from "@/components/MouseTiltCard";
import EventRegistrationModal from "@/components/EventRegistrationModal";
import TeamDetailModal from "@/components/TeamDetailModal";
import EventDetailModal from "@/components/EventDetailModal";

// Client-only dynamic WebGL Liquid Ether & Particle Background (ssr: false prevents hydration mismatches)
const LiquidEtherBackground = dynamic(
  () => import("@/components/LiquidEtherBackground"),
  { ssr: false }
);

// ============================================================================
// DATA INTERFACES
// ============================================================================

interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  deadline?: string;
  capacity?: number;
  status: "open" | "upcoming" | "closed";
  mediaUrl?: string;
  summary: string;
  highlights?: string;
}

interface TeamMember {
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

// ============================================================================
// DEFAULT SEED / FALLBACK DATA (Grounded & Production Ready)
// ============================================================================

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "ev-conclave-2026",
    title: "TEX-CONCLAVE 2026: National Smart Fibers Symposium",
    category: "National Conclave",
    date: "April 28–29, 2026",
    venue: "SGGSIE&T Main Auditorium",
    deadline: "April 15, 2026",
    capacity: 250,
    status: "open",
    mediaUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    summary: "Flagship national convention uniting textile researchers, paper presentations, and live CAD weaving contests.",
    highlights: "₹1,50,000 Cash Pool • 30+ Engineering Colleges • IEEE Certification",
  },
  {
    id: "ev-hackathon-2026",
    title: "SMART WEAVES HACKATHON 2026",
    category: "Technical Hackathon",
    date: "May 10–11, 2026",
    venue: "Textile CAD/CAM Studio & IoT Labs",
    deadline: "May 1, 2026",
    capacity: 100,
    status: "upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
    summary: "36-hour sprint pairing textile engineers with electronics students to build wearable fabric sensors and smart looms.",
    highlights: "Hardware Looms Access • Angel Mentors • Seed Incubation",
  },
  {
    id: "ev-workshop-2026",
    title: "NANOFIBER & ELECTROSPINNING WORKSHOP",
    category: "Laboratory Workshop",
    date: "June 5–6, 2026",
    venue: "Advanced Technical Textiles Lab",
    deadline: "May 25, 2026",
    capacity: 60,
    status: "open",
    mediaUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
    summary: "Hands-on synthesis of polymeric nanofibers for high-efficiency air filters and biomedical wound dressings.",
    highlights: "Live Electrospinner Demo • ASTM Characterization • Kit Provided",
  },
  {
    id: "ev-conclave-2025",
    title: "TEX-CONCLAVE 2025: Sustainable & High-Performance Textiles",
    category: "National Conclave",
    date: "March 15–16, 2025",
    venue: "SGGSIE&T Main Auditorium",
    status: "closed",
    summary: "Over 480 delegates from 28 technical colleges participated in competitive research tracks and industrial roundtables.",
    highlights: "480+ Delegates • 65 Peer-Reviewed Papers • Industry Roundtable",
  },
  {
    id: "ev-hackathon-2024",
    title: "SMART WEAVES HACKATHON 2024",
    category: "Technical Hackathon",
    date: "October 18–19, 2024",
    venue: "CAD/CAM Studio & IoT Labs",
    status: "closed",
    summary: "36-hour sprint where 32 interdisciplinary teams engineered wearable garment sensors and automated defect scanners.",
    highlights: "32 Teams • 3 Provisional Patents Filed • Industry Mentors",
  },
];

const DEFAULT_TEAM: TeamMember[] = [
  {
    id: "lead-1",
    name: "Aarav Deshmukh",
    role: "President",
    designation: "Executive Head, TESA Council",
    year: "Final Year B.Tech",
    category: "core",
    bio: "Spearheading TESA 2025-26 initiatives with a research focus on conductive smart fibers, electronic textiles, and national collegiate partnerships.",
    specialization: "Smart & Conductive Textiles",
    skills: ["E-Textiles", "Project Leadership", "Research & Dev"],
    photoPlaceholder: "AD",
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80",
    accentColor: "from-cyan-500/20 to-blue-600/30",
  },
  {
    id: "lead-2",
    name: "Sneha Kulkarni",
    role: "Vice President",
    designation: "Council Operations & Academic Liaison",
    year: "Final Year B.Tech",
    category: "core",
    bio: "Overseeing council operations, faculty coordination, and industrial internship drives for textile engineering undergraduates.",
    specialization: "Nanofiber Synthesis & Filtration",
    skills: ["Electrospinning", "Lab Coordination", "Strategy"],
    photoPlaceholder: "SK",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    accentColor: "from-teal-500/20 to-emerald-600/30",
  },
  {
    id: "lead-3",
    name: "Rohan Patil",
    role: "General Secretary",
    designation: "Administrative Head & Event Secretary",
    year: "Third Year B.Tech",
    category: "core",
    bio: "Managing inter-collegiate affairs, club documentation, and technical event scheduling for TEX-CONCLAVE 2026.",
    specialization: "Automated Weaving Systems",
    skills: ["Electronic Jacquard", "Event Management", "CAD"],
    photoPlaceholder: "RP",
    accentColor: "from-blue-500/20 to-indigo-600/30",
  },
  {
    id: "lead-4",
    name: "Pooja Sharma",
    role: "Technical Head",
    designation: "Research & Workshop Director",
    year: "Third Year B.Tech",
    category: "technical",
    bio: "Directing technical symposium tracks, coordinating hands-on student lab workshops, and mentoring paper presentations.",
    specialization: "Eco-Friendly Wet Processing",
    skills: ["Bio-Dyeing", "Spectroscopy", "Material Testing"],
    photoPlaceholder: "PS",
    accentColor: "from-indigo-500/20 to-purple-600/30",
  },
  {
    id: "lead-5",
    name: "Tanmay Joshi",
    role: "Chief Event Coordinator",
    designation: "Lead Organizer, Conclave & Hackathon",
    year: "Third Year B.Tech",
    category: "events",
    bio: "Leading logistics and participant onboarding for the Smart Weaves Hackathon and National Student Design Challenge.",
    specialization: "Industrial Automation in Textiles",
    skills: ["Hackathon Ops", "Public Relations", "Stage Logistics"],
    photoPlaceholder: "TJ",
    accentColor: "from-amber-500/20 to-orange-600/30",
  },
  {
    id: "lead-6",
    name: "Ananya Shinde",
    role: "Treasurer & Finance Lead",
    designation: "Budget & Sponsorship Head",
    year: "Third Year B.Tech",
    category: "core",
    bio: "Managing association finances, corporate sponsorships, and budget allocations for lab competitions and annual fests.",
    specialization: "Quality Assurance & Tensile Analytics",
    skills: ["Financial Modeling", "Corporate Sponsor", "Auditing"],
    photoPlaceholder: "AS",
    accentColor: "from-emerald-500/20 to-cyan-600/30",
  },
  {
    id: "lead-7",
    name: "Varun Kadam",
    role: "Design & Digital Media Lead",
    designation: "Creative & Web Interface Director",
    year: "Second Year B.Tech",
    category: "technical",
    bio: "Crafting digital assets, CAD jacquard mockups, web portals, and audiovisual campaigns for all TESA student exhibits.",
    specialization: "Textile CAD/CAM & UI/UX Design",
    skills: ["Textile CAD", "Creative Direction", "Web Tech"],
    photoPlaceholder: "VK",
    accentColor: "from-cyan-500/20 to-teal-600/30",
  },
  {
    id: "lead-8",
    name: "Meera Gaikwad",
    role: "Public Relations & Alumni Lead",
    designation: "Outreach & Industry Networker",
    year: "Second Year B.Tech",
    category: "outreach",
    bio: "Connecting current students with our distinguished 35+ year SGGSIE&T textile alumni network and industrial partners.",
    specialization: "Medical Textiles & Geotextiles",
    skills: ["Alumni Relations", "Communications", "Media"],
    photoPlaceholder: "MG",
    accentColor: "from-purple-500/20 to-pink-600/30",
  },
];

// ============================================================================
// FRAMER MOTION STAGGER ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const cardSlideUpVariants: Variants = {
  hidden: { opacity: 0, y: 35, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.75,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export default function Home() {
  // State for events & team data
  const [eventsList, setEventsList] = useState<EventItem[]>(DEFAULT_EVENTS);
  const [teamList, setTeamList] = useState<TeamMember[]>(DEFAULT_TEAM);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Filter states
  const [eventCategoryFilter, setEventCategoryFilter] = useState<"all" | "open" | "upcoming" | "closed">("all");
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<string>("all");

  // Registration modal state
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [selectedEventTitle, setSelectedEventTitle] = useState("TEX-CONCLAVE 2026");

  // Detail modals interactive state
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Fetch data cleanly from Firebase with localStorage caching
  useEffect(() => {
    // 1. Initial cached population
    try {
      const cachedEvents = localStorage.getItem("tesa_events");
      if (cachedEvents) {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEventsList(parsed);
        }
      }

      const cachedTeam = localStorage.getItem("tesa_team");
      if (cachedTeam) {
        const parsedTeam = JSON.parse(cachedTeam);
        if (Array.isArray(parsedTeam) && parsedTeam.length > 0) {
          setTeamList(parsedTeam);
        }
      }
    } catch {
      // Local storage fallback handled gracefully
    }

    // 2. Live sync from Firestore
    async function syncFirestoreData() {
      try {
        const eventsQuery = query(collection(db, "events"), orderBy("createdAt", "desc"));
        const evSnap = await getDocs(eventsQuery);
        if (!evSnap.empty) {
          const remoteEvents: EventItem[] = [];
          evSnap.forEach((doc) => {
            remoteEvents.push({ ...(doc.data() as EventItem), id: doc.id });
          });
          setEventsList(remoteEvents);
          localStorage.setItem("tesa_events", JSON.stringify(remoteEvents));
        }

        const teamSnap = await getDocs(collection(db, "team"));
        if (!teamSnap.empty) {
          const remoteTeam: TeamMember[] = [];
          teamSnap.forEach((doc) => {
            remoteTeam.push({ ...(doc.data() as TeamMember), id: doc.id });
          });
          setTeamList(remoteTeam);
          localStorage.setItem("tesa_team", JSON.stringify(remoteTeam));
        }
      } catch (err) {
        console.warn("Firestore live sync offline, using local cached data:", err);
      } finally {
        setIsDataLoading(false);
      }
    }

    syncFirestoreData();

    // Safety timeout: Ensure pulse skeleton stops after at most 1.2s to prevent lingering spinners
    const timeoutId = setTimeout(() => {
      setIsDataLoading(false);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleOpenRegistration = (eventTitle: string = "TEX-CONCLAVE 2026") => {
    setSelectedEventTitle(eventTitle);
    setIsRegModalOpen(true);
  };

  // Filtered collections
  const filteredEvents =
    eventCategoryFilter === "all"
      ? eventsList
      : eventsList.filter((e) => e.status === eventCategoryFilter);

  const filteredTeam =
    teamCategoryFilter === "all"
      ? teamList
      : teamList.filter((m) => m.category === teamCategoryFilter);

  return (
    <main className="overflow-x-hidden max-w-full w-full bg-zinc-950 text-white min-h-screen relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 3D WebGL Liquid Ether Particle Background */}
      <LiquidEtherBackground />

      {/* Subtle Engineering Lattice Grid Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-tech-grid opacity-20 z-0" />

      {/* Minimalist Top Sticky Navigation Bar */}
      <Navbar onOpenRegister={() => handleOpenRegistration("TEX-CONCLAVE 2026")} />

      {/* =========================================================================
          SECTION 1: ULTRA-CLEAN HERO SECTION
          ========================================================================= */}
      <section
        id="hero"
        className="relative min-h-[90vh] sm:min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-28 sm:pt-36 pb-20 sm:pb-24 z-10"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Subtle Glow Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-[11px] sm:text-xs font-mono text-cyan-300 mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <span>SGGSIE&amp;T • TEXTILE ENGINEERING STUDENTS ASSOCIATION</span>
          </motion.div>

          {/* Main Bold TESA Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white mb-6 leading-[1.08]"
          >
            WEAVE THE{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,240,255,0.4)]">
              FUTURE
            </span>
          </motion.h1>

          {/* Short Crisp Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-slate-300 font-normal max-w-2xl mx-auto leading-relaxed mb-9"
          >
            Pioneering smart conductive fibers, electrospun nanofiltration membranes, and autonomous electronic rapier looms at SGGSIE&amp;T Nanded.
          </motion.p>

          {/* Clean Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono"
          >
            <a
              href="#events"
              className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wide transition-all shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] cursor-pointer"
            >
              Explore Events →
            </a>
            <a
              href="#team"
              className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-cyan-500/40 text-slate-200 hover:text-white transition-all backdrop-blur-md cursor-pointer"
            >
              Meet the Team
            </a>
            <button
              onClick={() => handleOpenRegistration("TEX-CONCLAVE 2026")}
              className="min-h-[44px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white transition-all backdrop-blur-md shadow-[0_0_20px_rgba(168,85,247,0.25)] cursor-pointer"
            >
              Register for Conclave &apos;26
            </button>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: UPCOMING & PAST EVENTS (Minimalist Responsive Layout)
          ========================================================================= */}
      <section
        id="events"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] z-10"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-[11px] sm:text-xs font-mono text-cyan-300 mb-3 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
              <span>EXPERIENCE &amp; INNOVATE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
              TESA{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.35)]">
                EVENTS &amp; CONCLAVES
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              Explore national symposiums, hands-on fabrication sprints, and historical milestones organized by the Textile Engineering Students Association.
            </p>

            {/* Event Status Filter Tabs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              {[
                { id: "all", label: "ALL EVENTS" },
                { id: "open", label: "REGISTRATION OPEN" },
                { id: "upcoming", label: "UPCOMING" },
                { id: "closed", label: "COMPLETED ARCHIVE" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setEventCategoryFilter(tab.id as any)}
                  className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3.5 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                    eventCategoryFilter === tab.id
                      ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : "bg-slate-950/60 text-slate-300 border-cyan-500/20 hover:border-cyan-400/60 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Clean Glassmorphic Events Flex/Grid Layout or Pulsing Skeleton */}
          {isDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {[1, 2, 3].map((n) => (
                <div
                  key={`event-skel-${n}`}
                  className="relative flex flex-col justify-between rounded-2xl border border-cyan-500/15 bg-slate-950/70 p-6 sm:p-7 overflow-hidden animate-pulse min-h-[380px] shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-28 rounded-full bg-slate-800/80" />
                      <div className="h-4 w-16 rounded-full bg-slate-800/60" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-6 w-5/6 rounded-lg bg-slate-800/90" />
                      <div className="h-6 w-3/5 rounded-lg bg-slate-800/70" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-4 w-40 rounded bg-slate-800/60" />
                      <div className="h-4 w-48 rounded bg-slate-800/60" />
                    </div>
                    <div className="space-y-2 pt-3">
                      <div className="h-3.5 w-full rounded bg-slate-800/40" />
                      <div className="h-3.5 w-4/5 rounded bg-slate-800/40" />
                      <div className="h-3.5 w-2/3 rounded bg-slate-800/40" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/[0.08]">
                    <div className="h-11 w-full rounded-xl bg-slate-800/80" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
            >
              <AnimatePresence mode="popLayout">
                {filteredEvents.map((event) => {
                  const isOpen = event.status === "open";
                  const isUpcoming = event.status === "upcoming";

                  return (
                    <motion.div
                      key={event.id}
                      variants={cardSlideUpVariants}
                      layout
                      whileHover={{ y: -6, transition: { duration: 0.25 } }}
                      onClick={() => setSelectedEvent(event)}
                      className="group relative flex flex-col justify-between rounded-2xl border border-cyan-500/25 bg-slate-950/65 backdrop-blur-2xl p-6 sm:p-7 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(0,240,255,0.25)] transition-all duration-300 cursor-pointer"
                    >
                      {/* Woven background texture */}
                      <div className="pointer-events-none absolute inset-0 bg-woven-texture opacity-25" />

                      {/* Corner Accent Decorator */}
                      <span className="pointer-events-none absolute top-3 left-3 font-mono text-[9px] text-cyan-500/40">
                        +
                      </span>
                      <span className="pointer-events-none absolute top-3 right-3 font-mono text-[9px] text-cyan-500/40">
                        +
                      </span>

                      <div className="relative z-10">
                        {/* Status & Category Row */}
                        <div className="flex items-center justify-between gap-2 mb-4">
                          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider">
                            {event.category}
                          </span>

                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                              isOpen
                                ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                                : isUpcoming
                                ? "bg-amber-950/70 text-amber-300 border-amber-500/40"
                                : "bg-slate-900/80 text-slate-400 border-slate-700/50"
                            }`}
                          >
                            {isOpen ? "● OPEN" : isUpcoming ? "▲ UPCOMING" : "■ CONCLUDED"}
                          </span>
                        </div>

                        {/* Event Title */}
                        <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight mb-2">
                          {event.title}
                        </h3>

                        {/* Date & Venue Badges */}
                        <div className="flex flex-col gap-1.5 text-xs font-mono text-slate-400 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400">📅</span>
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400">📍</span>
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>

                        {/* Event Summary */}
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 font-normal">
                          {event.summary}
                        </p>

                        {/* Highlights Pill */}
                        {event.highlights && (
                          <div className="p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-slate-300 mb-4 flex items-center gap-2">
                            <span className="text-cyan-400">✦</span>
                            <span className="leading-snug">{event.highlights}</span>
                          </div>
                        )}

                        {/* Card click hint */}
                        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400/70 group-hover:text-cyan-300 transition-colors py-1.5 border-t border-white/[0.05] mb-2">
                          <span>CLICK TO EXPAND EVENT DOSSIER</span>
                          <span>🔍</span>
                        </div>
                      </div>

                      {/* Bottom CTA & Registration Action */}
                      <div className="relative z-10 pt-3 border-t border-white/[0.08] flex items-center justify-between font-mono text-xs">
                        {isOpen ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRegistration(event.title);
                            }}
                            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold tracking-wide transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] hover:shadow-[0_0_25px_rgba(0,240,255,0.5)] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Register Online</span>
                            <span>→</span>
                          </button>
                        ) : isUpcoming ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRegistration(event.title);
                            }}
                            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Pre-Register / Notify Me</span>
                            <span>→</span>
                          </button>
                        ) : (
                          <div className="w-full min-h-[44px] flex items-center justify-center text-slate-500 text-[11px] font-mono">
                            Archive Recorded • Event Concluded
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: TESA TEAM (3D Tilt Cards & Responsive 1/3-Column Grid)
          ========================================================================= */}
      <section
        id="team"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] z-10"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto mb-14"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-[11px] sm:text-xs font-mono text-cyan-300 mb-3 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
              <span>TESA STUDENT COUNCIL • 2025–2026 TENURE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
              MEET THE{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.35)]">
                TESA TEAM
              </span>
            </h2>

            <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
              The visionary student leaders, researchers, and coordinators driving textile engineering excellence and technological innovation at SGGSIE&amp;T.
            </p>

            {/* Interactive Category Filter */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              {[
                { id: "all", label: "ALL MEMBERS" },
                { id: "core", label: "CORE COUNCIL" },
                { id: "technical", label: "TECHNICAL & RESEARCH" },
                { id: "events", label: "EVENTS & HACKATHONS" },
                { id: "outreach", label: "PUBLIC RELATIONS" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTeamCategoryFilter(tab.id)}
                  className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3.5 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                    teamCategoryFilter === tab.id
                      ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : "bg-slate-950/60 text-slate-300 border-cyan-500/20 hover:border-cyan-400/60 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Medium-Sized Staggered 3D Tilt Card Grid or Pulsing Skeleton */}
          {isDataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={`team-skel-${n}`}
                  className="relative flex flex-col justify-between rounded-2xl border border-cyan-500/15 bg-slate-950/70 p-4 sm:p-5 overflow-hidden animate-pulse min-h-[440px] shadow-[0_20px_50px_rgba(0,0,0,0.85)]"
                >
                  <div>
                    {/* Portrait Frame Skeleton */}
                    <div className="w-full h-52 sm:h-56 mb-4 rounded-xl bg-slate-800/80" />
                    <div className="h-4 w-20 rounded bg-slate-800/70 mb-2" />
                    <div className="h-5 w-36 rounded bg-slate-800/90 mb-2" />
                    <div className="h-3.5 w-28 rounded bg-slate-800/60 mb-3" />
                    <div className="space-y-1.5 mb-4">
                      <div className="h-3 w-full rounded bg-slate-800/40" />
                      <div className="h-3 w-4/5 rounded bg-slate-800/40" />
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-800/50" />
                    <div className="flex gap-1.5">
                      <div className="h-4 w-12 rounded bg-slate-800/60" />
                      <div className="h-4 w-14 rounded bg-slate-800/60" />
                      <div className="h-4 w-10 rounded bg-slate-800/60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-30px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredTeam.map((member) => (
                  <motion.div
                    key={member.id}
                    variants={cardSlideUpVariants}
                    layout
                    className="h-full"
                  >
                    <MouseTiltCard
                      glowColor="rgba(0, 240, 255, 0.4)"
                      borderColor="rgba(0, 240, 255, 0.55)"
                      onClick={() => setSelectedMember(member)}
                      className="h-full border-cyan-500/30 cursor-pointer"
                    >
                      <div className="flex flex-col justify-between h-full">
                        <div>
                          {/* Upper: Member Medium Portrait Frame */}
                          <div className="relative w-full h-52 sm:h-56 mb-4 rounded-xl border border-cyan-500/30 bg-zinc-950 overflow-hidden group-hover:border-cyan-400/80 transition-all duration-500 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                            {member.photoUrl ? (
                              <div className="relative w-full h-full">
                                <Image
                                  src={member.photoUrl}
                                  alt={member.name}
                                  fill
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                  className="object-cover mix-blend-luminosity grayscale-[40%] contrast-110 group-hover:grayscale-0 group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-700 ease-out"
                                />
                                {/* Dark Theme Vignette & Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent pointer-events-none" />
                                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-xl" />
                              </div>
                            ) : (
                              <div className="relative w-full h-full bg-gradient-to-br from-zinc-950 via-zinc-900 to-cyan-950/40 flex flex-col items-center justify-center p-4 text-center">
                                <div className="w-14 h-14 rounded-xl border border-cyan-500/40 bg-cyan-950/40 flex items-center justify-center font-mono text-xl font-black text-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.25)] mb-2">
                                  {member.photoPlaceholder || "TE"}
                                </div>
                                <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase">
                                  PORTRAIT ARCHIVE
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
                              </div>
                            )}

                            {/* Member Year Badge */}
                            <span className="absolute bottom-2.5 right-2.5 z-10 text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 shadow-md">
                              {member.year}
                            </span>

                            {/* Accent glow line at bottom of photo */}
                            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                          </div>

                          {/* Name & Role Designation */}
                          <div className="mb-2.5">
                            <div className="inline-block px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[9px] font-mono text-cyan-300 uppercase tracking-wider mb-1">
                              {member.role}
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                              {member.name}
                            </h3>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                              {member.designation}
                            </p>
                          </div>

                          {/* Bio Description */}
                          <p className="text-xs text-slate-300 leading-relaxed mb-3 line-clamp-2">
                            {member.bio}
                          </p>
                        </div>

                        {/* Lower: Focus Area & Skills Badges */}
                        <div className="pt-2.5 border-t border-white/[0.08]">
                          <div className="text-[9px] font-mono text-cyan-400/80 uppercase tracking-wider mb-1.5 truncate">
                            FOCUS: {member.specialization}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {member.skills.slice(0, 3).map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center justify-between text-[9px] font-mono text-cyan-400/70 group-hover:text-cyan-300 transition-colors pt-1.5 border-t border-white/[0.04]">
                            <span>VIEW MEMBER DOSSIER</span>
                            <span>→</span>
                          </div>
                        </div>
                      </div>
                    </MouseTiltCard>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE REGISTRATION MODAL
          ========================================================================= */}
      <EventRegistrationModal
        isOpen={isRegModalOpen}
        onClose={() => setIsRegModalOpen(false)}
        defaultEventTitle={selectedEventTitle}
      />

      {/* =========================================================================
          INTERACTIVE TEAM MEMBER DETAIL MODAL
          ========================================================================= */}
      <TeamDetailModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      {/* =========================================================================
          INTERACTIVE EVENT DETAIL MODAL
          ========================================================================= */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onRegister={(title) => handleOpenRegistration(title)}
      />

      {/* =========================================================================
          HYPER-MODERN FOOTER
          ========================================================================= */}
      <footer className="relative z-20 w-full border-t border-white/[0.08] bg-[#070512]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="relative w-6 h-6 rounded-full border border-cyan-400/40 p-0.5 overflow-hidden bg-slate-950 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                <Image
                  src="/tesa-logo.png"
                  alt="TESA Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">
                TESA • SGGSIE&amp;T NANDED
              </span>
            </div>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="text-[11px] text-slate-400">
              Department of Textile Technology • Est. 1987
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
            <a href="#hero" className="min-h-[44px] inline-flex items-center px-2 hover:text-cyan-300 transition-colors cursor-pointer">
              Home
            </a>
            <a href="#events" className="min-h-[44px] inline-flex items-center px-2 hover:text-cyan-300 transition-colors cursor-pointer">
              Events
            </a>
            <a href="#team" className="min-h-[44px] inline-flex items-center px-2 hover:text-cyan-300 transition-colors cursor-pointer">
              TESA Team
            </a>
          </div>
        </div>

        <div className="border-t border-white/[0.04] py-3 text-center text-[10px] font-mono text-slate-600">
          © 2026 Textile Engineering Students Association, SGGSIE&amp;T. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
