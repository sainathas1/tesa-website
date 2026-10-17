"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import AuroraBackground from "@/components/AuroraBackground";
import TeamDetailModal from "@/components/TeamDetailModal";
import EventDetailModal, { CustomFormField } from "@/components/EventDetailModal";

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
  eventStatus?: "Upcoming" | "Concluded";
  mediaUrl?: string;
  summary: string;
  highlights?: string;
  galleryUrls?: string[];
  customFormFields?: CustomFormField[];
  createdAt?: any;
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
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    summary: "Flagship national convention uniting textile researchers, paper presentations, and live CAD weaving contests.",
    highlights: "₹1,50,000 Cash Pool • 30+ Engineering Colleges • IEEE Certification",
    customFormFields: [
      {
        id: "cf-team-name",
        questionTitle: "Team / Project Name",
        fieldType: "Short Text",
        required: true,
      },
      {
        id: "cf-track",
        questionTitle: "Conclave Innovation Track",
        fieldType: "Dropdown Options",
        options: "Smart Fibers & Wearables, Electrospinning & Nanofiltration, Sustainable Textile Processing, Automated Weaving & IoT Looms",
        required: true,
      },
      {
        id: "cf-abstract",
        questionTitle: "Abstract & Technical Methodology",
        fieldType: "Paragraph",
        required: true,
      },
      {
        id: "cf-deck",
        questionTitle: "Upload Research Deck / Presentation (PPT / PDF)",
        fieldType: "File Upload (PPT/PDF/Image)",
        required: false,
      },
    ],
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
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
    summary: "36-hour sprint pairing textile engineers with electronics students to build wearable fabric sensors and smart looms.",
    highlights: "Hardware Looms Access • Angel Mentors • Seed Incubation",
    customFormFields: [
      {
        id: "cf-team-hack",
        questionTitle: "Hackathon Squad Name",
        fieldType: "Short Text",
        required: true,
      },
      {
        id: "cf-tech-stack",
        questionTitle: "Hardware / Software Stack Proposed",
        fieldType: "Paragraph",
        required: true,
      },
      {
        id: "cf-pitch-deck",
        questionTitle: "Pitch Deck / Concept Schema (PPT/PDF/Image)",
        fieldType: "File Upload (PPT/PDF/Image)",
        required: true,
      },
    ],
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
    eventStatus: "Upcoming",
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
    eventStatus: "Concluded",
    mediaUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60",
    summary: "Over 480 delegates from 28 technical colleges participated in competitive research tracks and industrial roundtables.",
    highlights: "480+ Delegates • 65 Peer-Reviewed Papers • Industry Roundtable",
    galleryUrls: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80",
    ],
  },
  {
    id: "ev-hackathon-2024",
    title: "SMART WEAVES HACKATHON 2024",
    category: "Technical Hackathon",
    date: "October 18–19, 2024",
    venue: "CAD/CAM Studio & IoT Labs",
    status: "closed",
    eventStatus: "Concluded",
    mediaUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
    summary: "36-hour sprint where 32 interdisciplinary teams engineered wearable garment sensors and automated defect scanners.",
    highlights: "32 Teams • 3 Provisional Patents Filed • Industry Mentors",
    galleryUrls: [
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80",
    ],
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
    accentColor: "from-violet-500/20 to-purple-600/30",
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
    accentColor: "from-fuchsia-500/20 to-rose-600/30",
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
    accentColor: "from-indigo-500/20 to-purple-600/30",
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
    accentColor: "from-purple-500/20 to-pink-600/30",
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
    accentColor: "from-amber-500/20 to-rose-600/30",
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
    accentColor: "from-emerald-500/20 to-teal-600/30",
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
    accentColor: "from-violet-500/20 to-indigo-600/30",
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
    accentColor: "from-pink-500/20 to-rose-600/30",
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
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
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
  const [eventTab, setEventTab] = useState<"upcoming" | "past">("upcoming");
  const [upcomingSubFilter, setUpcomingSubFilter] = useState<"all" | "open" | "upcoming">("all");
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<string>("all");

  // Registration & Event Modal interactive states
  const [modalInitialMode, setModalInitialMode] = useState<"detail" | "register" | "verifiedList">("detail");
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Interactive Lightbox Modal State for Past Events Gallery
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; index: number } | null>(null);

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

    const timeoutId = setTimeout(() => {
      setIsDataLoading(false);
    }, 1200);

    return () => clearTimeout(timeoutId);
  }, []);

  // Keyboard escape handler for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxImage]);

  const handleOpenRegistration = (eventTitle: string = "TEX-CONCLAVE 2026") => {
    const matched =
      eventsList.find(
        (e) =>
          e.title.toLowerCase().includes(eventTitle.toLowerCase()) ||
          e.id === "ev-conclave-2026"
      ) ||
      upcomingEvents[0] ||
      eventsList[0];
    setSelectedEvent(matched);
    setModalInitialMode("register");
  };

  const handleOpenVerifiedList = (eventTitle: string = "TEX-CONCLAVE 2026") => {
    const matched =
      eventsList.find(
        (e) =>
          e.title.toLowerCase().includes(eventTitle.toLowerCase()) ||
          e.id === "ev-conclave-2026"
      ) ||
      upcomingEvents[0] ||
      eventsList[0];
    setSelectedEvent(matched);
    setModalInitialMode("verifiedList");
  };

  // Distinct Upcoming and Concluded / Past Events categorization
  const isEventUpcoming = (e: EventItem) => {
    if (e.eventStatus) return e.eventStatus === "Upcoming";
    return e.status === "open" || e.status === "upcoming";
  };

  const isEventPast = (e: EventItem) => {
    if (e.eventStatus) return e.eventStatus === "Concluded";
    return e.status === "closed";
  };

  const upcomingEvents = eventsList.filter(isEventUpcoming);
  const pastEvents = eventsList.filter(isEventPast);

  const displayedUpcomingEvents =
    upcomingSubFilter === "all"
      ? upcomingEvents
      : upcomingEvents.filter((e) => e.status === upcomingSubFilter);

  const filteredTeam =
    teamCategoryFilter === "all"
      ? teamList
      : teamList.filter((m) => m.category === teamCategoryFilter);

  return (
    <main className="overflow-x-hidden max-w-full w-full bg-[#050508] text-zinc-100 min-h-screen relative selection:bg-purple-500/30 selection:text-purple-200">
      {/* 1. Deep Obsidian Canvas with Ambient Aurora Light Orbs & Micro-Dot Grid */}
      <AuroraBackground />

      {/* 2. Floating Pill-Shaped Glass Navbar */}
      <Navbar
        onOpenRegister={() => handleOpenRegistration("TEX-CONCLAVE 2026")}
        onOpenVerifiedList={() => handleOpenVerifiedList("TEX-CONCLAVE 2026")}
      />

      {/* =========================================================================
          SECTION 1: EDITORIAL HERO SECTION (High-Contrast Kinetic Typography)
          ========================================================================= */}
      <section
        id="hero"
        className="relative min-h-[92vh] sm:min-h-screen flex flex-col justify-center items-center text-center px-4 sm:px-6 lg:px-8 pt-32 sm:pt-40 pb-20 sm:pb-28 z-10"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Subtle Studio Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] sm:text-xs font-mono text-zinc-300 mb-8 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.6)]"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_10px_#a855f7]" />
            <span>SGGSIE&amp;T • TEXTILE ENGINEERING STUDENTS ASSOCIATION</span>
            <span className="text-[10px] text-zinc-500 hidden sm:inline">• EST. 1987</span>
          </motion.div>

          {/* Main Headline: Metallic Silver-to-Zinc Gradient with Violet-Rose Accent Word */}
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight mb-6 leading-[1.08]"
          >
            <span className="bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
              WEAVE THE{" "}
            </span>
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_45px_rgba(168,85,247,0.45)]">
              FUTURE
            </span>
          </motion.h1>

          {/* Short Crisp Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-zinc-400 font-normal max-w-2xl mx-auto leading-relaxed mb-10"
          >
            Pioneering conductive smart fibers, electrospun nanofiltration membranes, and autonomous electronic rapier looms at SGGSIE&amp;T Nanded.
          </motion.p>

          {/* Action Buttons: Specular Inner Highlight + Magnetic Glow */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center justify-center gap-3.5 text-xs font-mono"
          >
            <a
              href="#events"
              className="glow-button-primary min-h-[46px] inline-flex items-center justify-center px-7 py-3 rounded-full text-white font-bold tracking-wide transition-all duration-300 cursor-pointer"
            >
              Explore Events →
            </a>

            <a
              href="#team"
              className="glass-button-secondary min-h-[46px] inline-flex items-center justify-center px-6 py-3 rounded-full text-zinc-300 hover:text-white transition-all duration-300 cursor-pointer"
            >
              Meet the Team
            </a>

            <button
              onClick={() => handleOpenRegistration("TEX-CONCLAVE 2026")}
              className="min-h-[46px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white transition-all duration-300 backdrop-blur-xl shadow-[0_0_20px_rgba(168,85,247,0.25)] cursor-pointer"
            >
              Register for Conclave &apos;26
            </button>

            <button
              onClick={() => handleOpenVerifiedList("TEX-CONCLAVE 2026")}
              className="min-h-[46px] inline-flex items-center justify-center px-6 py-3 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all duration-300 backdrop-blur-xl shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer gap-2"
            >
              <span>✔</span>
              <span>Check Registration &amp; Verified List</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Subtle Studio Accent Divider */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* =========================================================================
          SECTION 2: BENTO-GRID UPCOMING & PAST EVENTS
          ========================================================================= */}
      <section
        id="events"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 z-10"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/30 text-[11px] sm:text-xs font-mono text-purple-300 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>EXPERIENCE &amp; INNOVATE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
              TESA{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.35)]">
                EVENTS &amp; CONCLAVES
              </span>
            </h2>

            <p className="mt-3.5 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
              Explore national symposiums, hands-on fabrication sprints, and historical milestones organized by the Textile Engineering Students Association.
            </p>

            {/* Distinct Bento Tabs & Check Verified List Action */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex p-1.5 rounded-2xl bg-zinc-950/80 border border-white/10 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                <button
                  onClick={() => setEventTab("upcoming")}
                  className={`min-h-[44px] px-5 sm:px-6 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    eventTab === "upcoming"
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-white/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span>⚡ UPCOMING EVENTS</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      eventTab === "upcoming"
                        ? "bg-black/40 text-white font-extrabold"
                        : "bg-white/10 text-purple-300"
                    }`}
                  >
                    {upcomingEvents.length}
                  </span>
                </button>

                <button
                  onClick={() => setEventTab("past")}
                  className={`min-h-[44px] px-5 sm:px-6 py-2.5 rounded-xl font-mono text-xs sm:text-sm font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    eventTab === "past"
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.5)] border border-white/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span>📸 PAST GALLERIES</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      eventTab === "past"
                        ? "bg-black/40 text-white font-extrabold"
                        : "bg-white/10 text-purple-300"
                    }`}
                  >
                    {pastEvents.length}
                  </span>
                </button>
              </div>

              <button
                onClick={() => handleOpenVerifiedList()}
                className="min-h-[48px] px-5 sm:px-6 py-2.5 rounded-2xl font-mono text-xs sm:text-sm font-bold tracking-wider transition-all flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer backdrop-blur-xl"
              >
                <span>✔ CHECK REGISTRATION LIST</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  LIVE STATUS
                </span>
              </button>
            </div>

            {/* Sub-filter for upcoming events */}
            {eventTab === "upcoming" && upcomingEvents.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
                {[
                  { id: "all", label: "ALL UPCOMING" },
                  { id: "open", label: "REGISTRATION OPEN" },
                  { id: "upcoming", label: "ANNOUNCED SOON" },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setUpcomingSubFilter(sub.id as any)}
                    className={`min-h-[36px] px-4 py-1.5 rounded-xl border text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                      upcomingSubFilter === sub.id
                        ? "bg-purple-500/15 text-purple-300 border-purple-500/40 font-semibold shadow-[0_0_15px_rgba(168,85,247,0.25)]"
                        : "bg-white/[0.02] text-zinc-400 border-white/10 hover:text-zinc-200"
                    }`}
                  >
                    <span>{sub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Bento-Grid Events Layout or Skeleton */}
          {isDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {[1, 2, 3].map((n) => (
                <div
                  key={`event-skel-${n}`}
                  className="bento-card relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 overflow-hidden animate-pulse min-h-[380px]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-5 w-28 rounded-full bg-white/5" />
                      <div className="h-4 w-16 rounded-full bg-white/5" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-6 w-5/6 rounded-lg bg-white/10" />
                      <div className="h-6 w-3/5 rounded-lg bg-white/5" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <div className="h-4 w-40 rounded bg-white/5" />
                      <div className="h-4 w-48 rounded bg-white/5" />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/[0.08]">
                    <div className="h-11 w-full rounded-xl bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : eventTab === "upcoming" ? (
            /* ================= TAB 1: UPCOMING EVENTS BENTO GRID ================= */
            displayedUpcomingEvents.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-3xl border border-white/10 bg-[#0b0c10]/80 backdrop-blur-xl">
                <span className="text-3xl mb-3 block">🗓️</span>
                <h3 className="text-xl font-mono font-bold text-white mb-2">No Upcoming Events In This Category</h3>
                <p className="text-sm text-zinc-400 font-sans max-w-md mx-auto">
                  New student symposiums, hackathons, and laboratory workshops will be published here soon.
                </p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
              >
                <AnimatePresence mode="popLayout">
                  {displayedUpcomingEvents.map((event) => {
                    const isOpen = event.status === "open";
                    const isUpcoming = event.status === "upcoming";

                    return (
                      <motion.div
                        key={event.id}
                        variants={cardSlideUpVariants}
                        layout
                        onClick={() => {
                          setSelectedEvent(event);
                          setModalInitialMode("detail");
                        }}
                        className="bento-card group relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 overflow-hidden cursor-pointer"
                      >
                        {/* Top-Right Ambient Radial Glow on Hover */}
                        <div className="bento-glow" />

                        <div className="relative z-10">
                          {/* Status & Category Row */}
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/[0.04] text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold">
                              {event.category}
                            </span>

                            {/* Glowing Neon Status Badge */}
                            <span
                              className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border ${
                                isOpen
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                                  : isUpcoming
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                  : "bg-zinc-900/80 text-zinc-400 border-zinc-700/50"
                              }`}
                            >
                              {isOpen ? "● REGISTRATION OPEN" : isUpcoming ? "▲ UPCOMING" : "■ CONCLUDED"}
                            </span>
                          </div>

                          {/* Event Media Banner */}
                          {event.mediaUrl && (
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 border border-white/10 group-hover:border-purple-500/40 transition-colors">
                              <Image
                                src={event.mediaUrl}
                                alt={event.title}
                                fill
                                unoptimized={event.mediaUrl.startsWith("data:")}
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent pointer-events-none" />
                            </div>
                          )}

                          {/* Event Title */}
                          <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-purple-300 transition-colors tracking-tight mb-2">
                            {event.title}
                          </h3>

                          {/* Date & Venue Badges */}
                          <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-400 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400">📅</span>
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-purple-400">📍</span>
                              <span className="truncate">{event.venue}</span>
                            </div>
                          </div>

                          {/* Event Summary */}
                          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-5 font-normal">
                            {event.summary}
                          </p>

                          {/* Highlights Pill */}
                          {event.highlights && (
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-[11px] font-mono text-zinc-300 mb-4 flex items-center gap-2">
                              <span className="text-purple-400">✦</span>
                              <span className="leading-snug">{event.highlights}</span>
                            </div>
                          )}
                        </div>

                        {/* Bottom CTA & Registration Action */}
                        <div className="relative z-10 pt-3 border-t border-white/[0.08] flex items-center gap-2 font-mono text-xs">
                          {isOpen ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRegistration(event.title);
                              }}
                              className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold tracking-wide transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_rgba(139,92,246,0.35)] flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Register</span>
                              <span>→</span>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenRegistration(event.title);
                              }}
                              className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 border border-purple-500/30 hover:border-purple-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <span>Pre-Register</span>
                              <span>→</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(event);
                              setModalInitialMode("verifiedList");
                            }}
                            className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                            title="Check Verified Registration List"
                          >
                            <span>✔ Status</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )
          ) : (
            /* ================= TAB 2: PAST EVENTS & BENTO FILMSTRIP ================= */
            pastEvents.length === 0 ? (
              <div className="text-center py-16 px-6 rounded-3xl border border-white/10 bg-[#0b0c10]/80 backdrop-blur-xl">
                <span className="text-3xl mb-3 block">📸</span>
                <h3 className="text-xl font-mono font-bold text-white mb-2">No Past Events In Archives</h3>
                <p className="text-sm text-zinc-400 font-sans max-w-md mx-auto">
                  Historical symposiums and conclaves will be documented here once concluded.
                </p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 sm:space-y-10"
              >
                <AnimatePresence mode="popLayout">
                  {pastEvents.map((event) => {
                    const gallery =
                      event.galleryUrls && event.galleryUrls.length > 0
                        ? event.galleryUrls
                        : event.mediaUrl
                        ? [event.mediaUrl]
                        : [];

                    return (
                      <motion.div
                        key={event.id}
                        variants={cardSlideUpVariants}
                        layout
                        onClick={() => {
                          setSelectedEvent(event);
                          setModalInitialMode("detail");
                        }}
                        className="bento-card group relative rounded-3xl p-6 sm:p-8 overflow-hidden cursor-pointer"
                      >
                        {/* Top-Right Ambient Glow */}
                        <div className="bento-glow" />

                        <div className="relative z-10">
                          {/* Top Tag & Status Row */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/[0.04] text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold">
                                {event.category}
                              </span>
                              <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full bg-zinc-900/90 text-zinc-400 border border-zinc-700/60 font-semibold flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                                <span>CONCLUDED ARCHIVE</span>
                              </span>
                            </div>

                            {/* Gallery Photo Counter Badge */}
                            {gallery.length > 0 && (
                              <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                                📸 {gallery.length} ARCHIVAL PHOTOGRAPHS
                              </span>
                            )}
                          </div>

                          {/* Event Title & Metadata */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mb-6">
                            <div className="lg:col-span-2">
                              <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-purple-300 transition-colors tracking-tight mb-2">
                                {event.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
                                {event.summary}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono">
                              <div className="flex items-center gap-2 text-zinc-300">
                                <span className="text-purple-400">📅</span>
                                <span>{event.date}</span>
                              </div>
                              <div className="flex items-center gap-2 text-zinc-300">
                                <span className="text-purple-400">📍</span>
                                <span className="truncate">{event.venue}</span>
                              </div>
                              {event.highlights && (
                                <div className="text-[11px] text-purple-300 pt-1.5 border-t border-white/[0.06] flex items-center gap-1.5">
                                  <span>✦</span>
                                  <span>{event.highlights}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bento Horizontal Photo Gallery Filmstrip with Zoom & Lightbox */}
                          <div className="pt-2 pb-2">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                                <span className="text-[11px] font-mono uppercase text-purple-300 tracking-wider font-semibold">
                                  INTERACTIVE PHOTO FILMSTRIP
                                </span>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline-block">
                                ⇄ SCROLL HORIZONTALLY • CLICK TO EXPAND LIGHTBOX
                              </span>
                            </div>

                            {gallery.length > 0 ? (
                              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-zinc-950/40 -mx-1 px-1">
                                {gallery.map((photoUrl, pIdx) => (
                                  <div
                                    key={pIdx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setLightboxImage({
                                        url: photoUrl,
                                        title: event.title,
                                        index: pIdx + 1,
                                      });
                                    }}
                                    className="relative w-64 sm:w-80 h-44 sm:h-52 flex-shrink-0 rounded-2xl overflow-hidden border border-white/10 hover:border-purple-400 group/item shadow-xl snap-start transition-all duration-300 bg-zinc-950 cursor-zoom-in"
                                  >
                                    <Image
                                      src={photoUrl}
                                      alt={`${event.title} archival photo ${pIdx + 1}`}
                                      fill
                                      unoptimized={photoUrl.startsWith("data:")}
                                      sizes="(max-width: 640px) 256px, 320px"
                                      className="object-cover group-hover/item:scale-105 transition-transform duration-500"
                                    />
                                    {/* Bottom gradient & caption */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover/item:opacity-95 transition-opacity pointer-events-none" />

                                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white font-mono text-[10px]">
                                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md">
                                        PHOTO #{String(pIdx + 1).padStart(2, "0")}
                                      </span>
                                      <span className="text-purple-300 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center gap-1 font-semibold">
                                        <span>🔍</span>
                                        <span>LIGHTBOX</span>
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="w-full py-8 rounded-2xl border border-white/10 bg-white/[0.02] text-center font-mono text-xs text-zinc-400">
                                ✦ Archival Photographs for this Conclave will be synchronized soon.
                              </div>
                            )}
                          </div>

                          {/* Footer Action Bar */}
                          <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                            <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                              <span className="text-emerald-400">✓</span>
                              <span>Concluded • Documented in SGGSIE&amp;T archival records</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setModalInitialMode("verifiedList");
                                }}
                                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer text-[11px]"
                              >
                                <span>✔ Attendee Registry</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent(event);
                                  setModalInitialMode("detail");
                                }}
                                className="min-h-[44px] px-4 sm:px-5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-400 text-purple-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer text-xs"
                              >
                                <span>View Full Conclave Dossier</span>
                                <span>🔍</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )
          )}
        </div>
      </section>

      {/* Subtle Studio Accent Divider */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* =========================================================================
          SECTION 3: BENTO-GRID TESA TEAM SECTION
          ========================================================================= */}
      <section
        id="team"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 z-10"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/30 text-[11px] sm:text-xs font-mono text-purple-300 mb-4 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span>TESA STUDENT COUNCIL • 2025–2026 TENURE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
              MEET THE{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.35)]">
                TESA TEAM
              </span>
            </h2>

            <p className="mt-3.5 text-sm sm:text-base text-zinc-400 font-normal leading-relaxed">
              The visionary student leaders, researchers, and coordinators driving textile engineering excellence and technological innovation at SGGSIE&amp;T.
            </p>

            {/* Interactive Category Filter Pills */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 text-xs font-mono">
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
                  className={`min-h-[42px] inline-flex items-center justify-center px-4 py-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                    teamCategoryFilter === tab.id
                      ? "bg-purple-600 text-white border-purple-400 font-bold shadow-[0_0_20px_rgba(168,85,247,0.45)]"
                      : "bg-white/[0.02] text-zinc-300 border-white/10 hover:border-purple-500/40 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Staggered Bento Team Grid or Pulsing Skeleton */}
          {isDataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={`team-skel-${n}`}
                  className="bento-card relative flex flex-col justify-between rounded-3xl p-5 overflow-hidden animate-pulse min-h-[440px]"
                >
                  <div>
                    <div className="w-full h-52 sm:h-56 mb-4 rounded-2xl bg-white/5" />
                    <div className="h-4 w-20 rounded bg-white/5 mb-2" />
                    <div className="h-5 w-36 rounded bg-white/10 mb-2" />
                    <div className="h-3.5 w-28 rounded bg-white/5 mb-3" />
                  </div>
                  <div className="pt-3 border-t border-white/[0.08] space-y-2">
                    <div className="h-3 w-24 rounded bg-white/5" />
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
                    onClick={() => setSelectedMember(member)}
                    className="bento-card group relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 overflow-hidden cursor-pointer"
                  >
                    {/* Top-Right Ambient Glow on Hover */}
                    <div className="bento-glow" />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                      <div>
                        {/* Member Portrait Frame */}
                        <div className="relative w-full h-52 sm:h-56 mb-4 rounded-2xl border border-white/10 bg-[#050508] overflow-hidden group-hover:border-purple-500/50 transition-all duration-500 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                          {member.photoUrl ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={member.photoUrl}
                                alt={member.name}
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover contrast-105 group-hover:scale-105 transition-all duration-700 ease-out"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent pointer-events-none" />
                              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
                            </div>
                          ) : (
                            <div className="relative w-full h-full bg-gradient-to-br from-zinc-950 via-[#0b0c10] to-purple-950/40 flex flex-col items-center justify-center p-4 text-center">
                              <div className="w-14 h-14 rounded-xl border border-purple-500/40 bg-purple-950/40 flex items-center justify-center font-mono text-xl font-black text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.25)] mb-2">
                                {member.photoPlaceholder || "TE"}
                              </div>
                              <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">
                                PORTRAIT ARCHIVE
                              </span>
                            </div>
                          )}

                          {/* Member Year Badge */}
                          <span className="absolute bottom-2.5 right-2.5 z-10 text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-purple-300 border border-purple-500/30 shadow-md">
                            {member.year}
                          </span>

                          {/* Accent glow line at bottom of photo */}
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Name & Role Designation */}
                        <div className="mb-2.5">
                          <div className="inline-block px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-[9px] font-mono text-purple-300 uppercase tracking-wider mb-1.5">
                            {member.role}
                          </div>
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors tracking-tight">
                            {member.name}
                          </h3>
                          <p className="text-[11px] font-mono text-zinc-400 mt-0.5 truncate">
                            {member.designation}
                          </p>
                        </div>

                        {/* Bio Description */}
                        <p className="text-xs text-zinc-300 leading-relaxed mb-3 line-clamp-2">
                          {member.bio}
                        </p>
                      </div>

                      {/* Lower: Focus Area & Skills Badges */}
                      <div className="pt-2.5 border-t border-white/[0.08]">
                        <div className="text-[9px] font-mono text-purple-400/90 uppercase tracking-wider mb-1.5 truncate">
                          FOCUS: {member.specialization}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {member.skills.slice(0, 3).map((skill, sIdx) => (
                            <span
                              key={sIdx}
                              className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] text-zinc-300 border border-white/10"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-mono text-purple-400/80 group-hover:text-purple-300 transition-colors pt-1.5 border-t border-white/[0.04]">
                          <span>VIEW MEMBER DOSSIER</span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* =========================================================================
          INTERACTIVE FULLSCREEN LIGHTBOX MODAL FOR GALLERY PHOTOS
          ========================================================================= */}
      <AnimatePresence>
        {lightboxImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-2xl">
            {/* Backdrop click closes */}
            <div
              className="absolute inset-0"
              onClick={() => setLightboxImage(null)}
            />

            {/* Lightbox Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            >
              {/* Top Bar with Title & Close Button */}
              <div className="w-full flex items-center justify-between pb-4 font-mono text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-white font-bold">{lightboxImage.title}</span>
                  <span>• Archival Photo #{lightboxImage.index}</span>
                </div>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors cursor-pointer"
                >
                  ✕ Close (Esc)
                </button>
              </div>

              {/* Main Expanded Image */}
              <div className="relative w-full h-[65vh] sm:h-[75vh] rounded-3xl overflow-hidden border border-white/15 bg-black shadow-[0_0_80px_rgba(0,0,0,0.9)]">
                <Image
                  src={lightboxImage.url}
                  alt={lightboxImage.title}
                  fill
                  unoptimized={lightboxImage.url.startsWith("data:")}
                  sizes="100vw"
                  className="object-contain"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
        initialMode={modalInitialMode}
        onClose={() => setSelectedEvent(null)}
      />

      {/* =========================================================================
          HYPER-MODERN DARK STUDIO FOOTER
          ========================================================================= */}
      <footer className="relative z-20 w-full border-t border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 font-mono text-xs text-zinc-400">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 rounded-full border border-purple-400/40 p-0.5 overflow-hidden bg-black shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <Image
                  src="/tesa-logo.png"
                  alt="TESA Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">
                TESA • SGGSIE&amp;T NANDED
              </span>
            </div>
            <span className="hidden sm:inline text-zinc-600">|</span>
            <span className="text-[11px] text-zinc-400">
              Department of Textile Technology • Est. 1987
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-300">
            <a href="#hero" className="min-h-[44px] inline-flex items-center px-2 hover:text-purple-300 transition-colors cursor-pointer">
              Home
            </a>
            <a href="#events" className="min-h-[44px] inline-flex items-center px-2 hover:text-purple-300 transition-colors cursor-pointer">
              Events
            </a>
            <a href="#team" className="min-h-[44px] inline-flex items-center px-2 hover:text-purple-300 transition-colors cursor-pointer">
              TESA Team
            </a>
            <Link href="/admin" className="min-h-[44px] inline-flex items-center px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-purple-400 text-purple-300 hover:text-white transition-all cursor-pointer">
              Admin Portal →
            </Link>
          </div>
        </div>

        <div className="border-t border-white/[0.04] py-3.5 text-center text-[10px] font-mono text-zinc-600">
          © 2026 Textile Engineering Students Association, SGGSIE&amp;T. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
