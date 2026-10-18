"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/Navbar";
import AuroraBackground from "@/components/AuroraBackground";
import TeamDetailModal from "@/components/TeamDetailModal";
import EventDetailModal, { CustomFormField, isConcludedEvent } from "@/components/EventDetailModal";
import TextilePortalHero from "@/components/TextilePortalHero";
import ContactModal, {
  GmailLogoIcon,
  InstagramLogoIcon,
  LinkedInLogoIcon,
} from "@/components/ContactModal";

/**
 * Cloudinary Face-Detection Avatar Optimization Helper
 * Automatically transforms Cloudinary URLs to center on the person's face
 * with a 4:5 portrait ratio and high quality compression.
 */
export function getOptimizedAvatarUrl(url?: string): string {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    if (url.includes("c_fill,g_face")) return url;
    return url.replace("/image/upload/", "/image/upload/c_fill,g_face,w_800,h_1000,q_auto/");
  }
  return url;
}

/**
 * Extract Member Initials (e.g., "Sakshi Selokar" -> "SS")
 */
export function getMemberInitials(name?: string, placeholder?: string): string {
  if (placeholder && placeholder.trim() && placeholder.trim().length <= 3 && !placeholder.includes("http")) {
    return placeholder.trim().toUpperCase();
  }
  if (!name || !name.trim()) return "TE";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.trim().slice(0, 2).toUpperCase();
}

/**
 * Team Member Portrait Avatar with onError Fallback
 * Automatically displays initials on a subtle purple-indigo gradient if photo fails or is empty.
 */
function TeamMemberAvatar({ member }: { member: TeamMember }) {
  const [imageError, setImageError] = useState(false);
  const rawUrl = member.photoUrl || member.imageUrl || member.image || "";
  const initials = getMemberInitials(member.name, member.photoPlaceholder);

  useEffect(() => {
    setImageError(false);
  }, [rawUrl]);

  if (!rawUrl || imageError) {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-purple-900/80 to-indigo-950 flex flex-col items-center justify-center text-4xl font-bold text-white select-none">
        <span className="tracking-wider drop-shadow-md">{initials}</span>
        <span className="text-[9px] font-mono tracking-widest text-purple-300/80 uppercase mt-2 font-normal">
          PORTRAIT ARCHIVE
        </span>
        <div className="absolute inset-0 bg-gradient-to-t from-[#050508]/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <img
        src={getOptimizedAvatarUrl(rawUrl)}
        alt={member.name}
        onError={() => setImageError(true)}
        className="w-full h-full object-cover object-top contrast-105 group-hover:scale-105 transition-all duration-700 ease-out"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
    </div>
  );
}

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
  bannerUrl?: string;
  imageUrl?: string;
  image?: string;
  paymentQrUrl?: string;
  qrCodeUrl?: string;
  upiId?: string;
  registrationFee?: string;
  paymentInstructions?: string;
  acceptedPaymentApps?: string;
  summary: string;
  highlights?: string;
  galleryUrls?: string[];
  gallery?: string[];
  customFormFields?: CustomFormField[];
  createdAt?: any;
  isPastSection?: boolean;
  _isPast?: boolean;
}

interface TeamMember {
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
  imageUrl?: string;
  image?: string;
  accentColor: string;
  position?: string;
  focus?: string;
  [key: string]: any;
}

// ============================================================================
// DEFAULT SEED / FALLBACK DATA (Grounded & Production Ready)
// ============================================================================

const DEFAULT_EVENTS: EventItem[] = [
  {
    id: "ev-texplorer-2026",
    title: "TEXPLORER 2026: National Mega Textile Conclave",
    category: "Mega National Festival",
    date: "April 28–30, 2026",
    venue: "SGGSIE&T Main Auditorium & Textile Complex",
    deadline: "April 20, 2026",
    capacity: 500,
    status: "open",
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    summary: "SGGSIE&T TESA's premier annual mega national technical symposium uniting 40+ engineering colleges. Features 6 competitive tracks: Technical Research Presentations, Smart Weaves Hackathon, CAD Fabric Design, National Textile Quiz, Working Models, and Live Machinery Workshops.",
    highlights: "₹2,00,000+ Prize Pool • 6 Concurrent Tracks • National IEEE / TESA Certification",
    customFormFields: [
      {
        id: "cf-tex-track",
        questionTitle: "Select Your TEXPLORER Competition Track",
        fieldType: "Dropdown Options",
        options: "Tex-Paper: Technical Research Presentation, Tex-Hack: Smart Weaves & IoT Looms Hackathon, Tex-Design: CAD & Digital Jacquard Mania, Tex-Quiz: National Textile Brain Quest, Tex-Exhibit: Working Model & Prototype Expo, Tex-Workshop: Nanofiber Electrospinning Lab",
        required: true,
      },
      {
        id: "cf-team-name",
        questionTitle: "Team / Project Title",
        fieldType: "Short Text",
        required: true,
      },
      {
        id: "cf-abstract",
        questionTitle: "Abstract / Concept Summary",
        fieldType: "Paragraph",
        required: true,
      },
      {
        id: "cf-deck",
        questionTitle: "Upload Research Deck / Abstract Document (Optional - PPT/PDF/Image)",
        fieldType: "File Upload (PPT/PDF/Image)",
        required: false,
      },
    ],
  },
  {
    id: "ev-tex-hack-2026",
    title: "TEXPLORER: Tex-Hack (Smart Weaves 36-Hr Hackathon)",
    category: "Technical Hackathon",
    date: "April 29–30, 2026",
    venue: "Textile CAD/CAM Studio & IoT Labs",
    deadline: "April 22, 2026",
    capacity: 120,
    status: "open",
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
    summary: "Conducted under the TEXPLORER mega fest: 36-hour sprint pairing textile innovators with electronics & computer engineering students to build wearable fabric sensors, conductive yarns, and automated loom scanners.",
    highlights: "Hardware Looms Access • Angel Mentors • Seed Incubation • ₹60,000 Cash Prizes",
    customFormFields: [
      {
        id: "cf-team-hack",
        questionTitle: "Hackathon Squad Name",
        fieldType: "Short Text",
        required: true,
      },
      {
        id: "cf-tech-stack",
        questionTitle: "Hardware / Software Architecture Proposed",
        fieldType: "Paragraph",
        required: true,
      },
      {
        id: "cf-pitch-deck",
        questionTitle: "Pitch Deck / Concept Schema (Optional - PPT/PDF/Image)",
        fieldType: "File Upload (PPT/PDF/Image)",
        required: false,
      },
    ],
  },
  {
    id: "ev-tex-paper-2026",
    title: "TEXPLORER: Tex-Paper (National Research Presentation)",
    category: "Research Symposium",
    date: "April 28, 2026",
    venue: "Main Auditorium & Seminar Hall 1",
    deadline: "April 18, 2026",
    capacity: 150,
    status: "open",
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=60",
    summary: "The flagship technical paper presentation track of TEXPLORER. Students present original peer-reviewed research on Sustainable Fibers, Electrospinning, Technical Textiles, and Industrial Decarbonization.",
    highlights: "Publication in TESA Journal • Industry Jury • ₹40,000 Cash Awards",
    customFormFields: [
      {
        id: "cf-paper-title",
        questionTitle: "Research Paper Title",
        fieldType: "Short Text",
        required: true,
      },
      {
        id: "cf-paper-abstract",
        questionTitle: "Paper Abstract & Findings",
        fieldType: "Paragraph",
        required: true,
      },
      {
        id: "cf-paper-file",
        questionTitle: "Draft Paper / Presentation Deck (Optional - PPT/PDF)",
        fieldType: "File Upload (PPT/PDF/Image)",
        required: false,
      },
    ],
  },
  {
    id: "ev-tex-design-2026",
    title: "TEXPLORER: Tex-Design (CAD & Digital Jacquard Sprint)",
    category: "CAD Design Challenge",
    date: "April 29, 2026",
    venue: "Textile CAD Simulation Laboratory",
    deadline: "April 24, 2026",
    capacity: 80,
    status: "open",
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
    summary: "Live digital dobby and electronic jacquard design challenge under TEXPLORER. Competitors draft intricate fabric weave structures and simulate 3D garment drape patterns.",
    highlights: "Staubli & NedGraphics Licenses • Industry Portfolio Mentorship • ₹30,000 Cash Pool",
    customFormFields: [
      {
        id: "cf-cad-software",
        questionTitle: "Preferred CAD Tool (NedGraphics / Staubli / Corel / Photoshop)",
        fieldType: "Short Text",
        required: true,
      },
      {
        id: "cf-cad-portfolio",
        questionTitle: "Prior Portfolio Sample (Optional - PPT/PDF/Image)",
        fieldType: "File Upload (PPT/PDF/Image)",
        required: false,
      },
    ],
  },
  {
    id: "ev-tex-quiz-2026",
    title: "TEXPLORER: Tex-Quiz (National Textile Brain Quest)",
    category: "Technical Quiz",
    date: "April 30, 2026",
    venue: "Textile Conference Hall",
    deadline: "April 26, 2026",
    capacity: 100,
    status: "open",
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60",
    summary: "Thrilling 3-round technical quiz covering polymer science, high-speed spinning, wet chemical processing, and international technical textile standards.",
    highlights: "Buzzer Rounds • Cash Prizes • TESA Trophies",
  },
  {
    id: "ev-tex-workshop-2026",
    title: "TEXPLORER: Nanofiber & Electrospinning Workshop",
    category: "Laboratory Workshop",
    date: "May 15–16, 2026",
    venue: "Advanced Technical Textiles Lab",
    deadline: "May 5, 2026",
    capacity: 60,
    status: "upcoming",
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
    summary: "Hands-on synthesis of polymeric nanofibers for high-efficiency air filters and biomedical wound dressings, conducted in Department labs as part of TEXPLORER series.",
    highlights: "Live Electrospinner Demo • ASTM Characterization • Kit Provided",
  },
  {
    id: "ev-texplorer-2025",
    title: "TEXPLORER 2025: National Mega Conclave & Symposium",
    category: "Mega National Festival",
    date: "March 15–16, 2025",
    venue: "SGGSIE&T Main Auditorium",
    status: "closed",
    eventStatus: "Concluded",
    mediaUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=60",
    summary: "Over 480 delegates from 28 technical colleges participated in competitive research tracks, hackathons, and industrial roundtables.",
    highlights: "480+ Delegates • 65 Peer-Reviewed Papers • Industry Roundtable",
    galleryUrls: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&auto=format&fit=crop&q=80",
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
  // State for events & team data (Live synchronized from Firestore)
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const teamList = teamMembers;
  const setTeamList = setTeamMembers;
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

  // Contact Us Modal interactive state
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Live real-time synchronization with Firestore (collection: 'events', 'team_members')
  useEffect(() => {
    // 1. Initial cached population from localStorage for instantaneous first render
    try {
      const cachedEvents = localStorage.getItem("tesa_events");
      if (cachedEvents !== null) {
        const parsed = JSON.parse(cachedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEventsList(parsed);
          setIsDataLoading(false);
        }
      }

      const cachedTeam = localStorage.getItem("tesa_team_members") || localStorage.getItem("tesa_team");
      if (cachedTeam !== null) {
        const parsedTeam = JSON.parse(cachedTeam);
        if (Array.isArray(parsedTeam) && parsedTeam.length > 0) {
          setTeamMembers(parsedTeam);
        }
      }
    } catch {
      // Local storage read error handled gracefully
    }

    // 2. Real-Time Events Listener (collection: 'events')
    // CRITICAL: Fetch root collection and sort in JS; do NOT use .orderBy('createdAt') in query()
    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        const remoteEvents: EventItem[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const cover = data.bannerUrl || data.imageUrl || data.image || data.mediaUrl || "";
          const gallery = Array.isArray(data.galleryUrls)
            ? data.galleryUrls
            : Array.isArray(data.gallery)
            ? data.gallery
            : [];
          const customFormFields = Array.isArray(data.customFormFields)
            ? data.customFormFields
            : [];

          remoteEvents.push({
            ...(data as EventItem),
            id: doc.id,
            mediaUrl: cover,
            bannerUrl: cover,
            imageUrl: cover,
            image: cover,
            galleryUrls: gallery,
            gallery: gallery,
            customFormFields,
          });
        });

        // Robust timestamp sort in JavaScript
        remoteEvents.sort((a: any, b: any) => {
          const getTimestamp = (e: any) => {
            if (e.createdAt?.seconds) return e.createdAt.seconds * 1000;
            if (e.updatedAt?.seconds) return e.updatedAt.seconds * 1000;
            if (e.createdAt) {
              const p = new Date(e.createdAt).getTime();
              if (!isNaN(p)) return p;
            }
            if (e.date) {
              const p = new Date(e.date).getTime();
              if (!isNaN(p)) return p;
            }
            return 0;
          };
          return getTimestamp(b) - getTimestamp(a);
        });

        setEventsList(remoteEvents);
        setIsDataLoading(false);
        try {
          localStorage.setItem("tesa_events", JSON.stringify(remoteEvents));
        } catch {}
      },
      (err) => {
        console.warn("Firestore events onSnapshot error:", err);
        setIsDataLoading(false);
      }
    );

    // 3. Real-Time Team Members Listener (collection: 'team_members')
    const unsubTeam = onSnapshot(
      collection(db, "team_members"),
      (snapshot) => {
        const remoteTeam: TeamMember[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const photo = data.photoUrl || data.imageUrl || data.image || data.photoPlaceholder || "";
          remoteTeam.push({
            ...(data as TeamMember),
            id: doc.id,
            photoUrl: photo,
            imageUrl: photo,
            image: photo,
          });
        });

        // Core Council leadership prioritization sort
        remoteTeam.sort((a: any, b: any) => {
          const getWeight = (m: any) => {
            const role = (m.role || "").toLowerCase();
            const cat = (m.category || "").toLowerCase();
            if (role.includes("president") && !role.includes("vice")) return 100;
            if (role.includes("vice president")) return 90;
            if (role.includes("secretary")) return 80;
            if (role.includes("treasurer")) return 70;
            if (cat.includes("core")) return 60;
            return 10;
          };
          return getWeight(b) - getWeight(a);
        });

        if (remoteTeam.length > 0) {
          setTeamMembers(remoteTeam);
        } else {
          setTeamMembers(DEFAULT_TEAM);
        }
        try {
          localStorage.setItem("tesa_team_members", JSON.stringify(remoteTeam));
        } catch {}
      },
      (err) => {
        console.warn("Firestore team_members onSnapshot error:", err);
      }
    );

    const timeoutId = setTimeout(() => {
      setIsDataLoading(false);
      setTeamMembers((prev) => (prev.length > 0 ? prev : DEFAULT_TEAM));
      setEventsList((prev) => (prev.length > 0 ? prev : DEFAULT_EVENTS));
    }, 1500);

    return () => {
      unsubEvents();
      unsubTeam();
      clearTimeout(timeoutId);
    };
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

  const handleOpenRegistration = (eventTitle: string = "TEXPLORER 2026") => {
    const matched =
      eventsList.find(
        (e) =>
          e.title.toLowerCase().includes(eventTitle.toLowerCase()) ||
          e.id === "ev-texplorer-2026"
      ) ||
      upcomingEvents[0] ||
      eventsList[0];
    if (matched) {
      if (isConcludedEvent(matched)) {
        setSelectedEvent({ ...matched, isPastSection: true, _isPast: true });
        setModalInitialMode("detail");
      } else {
        setSelectedEvent(matched);
        setModalInitialMode("register");
      }
    }
  };

  const handleOpenVerifiedList = (eventTitle: string = "TEXPLORER 2026") => {
    const matched =
      eventsList.find(
        (e) =>
          e.title.toLowerCase().includes(eventTitle.toLowerCase()) ||
          e.id === "ev-texplorer-2026"
      ) ||
      upcomingEvents[0] ||
      eventsList[0];
    if (matched) {
      setSelectedEvent(matched);
      setModalInitialMode("verifiedList");
    }
  };

  // Distinct Upcoming and Concluded / Past Events categorization (Case-Insensitive normalization)
  const isPast = (ev: EventItem) => isConcludedEvent(ev);

  const upcomingEvents = eventsList.filter((ev) => !isPast(ev));
  const pastEvents = eventsList.filter((ev) => isPast(ev));

  const displayedUpcomingEvents =
    upcomingSubFilter === "all"
      ? upcomingEvents
      : upcomingEvents.filter((e) => e.status === upcomingSubFilter);

  // Smart Category + Role Keyword Filtering
  const isMatchCategory = (m: TeamMember, cat: string) => {
    if (!cat || cat === "all" || cat.toLowerCase() === "all members") return true;

    const filter = cat.toLowerCase().trim();
    const memberCat = (m.category || "").toLowerCase().trim();
    const roleFields = `${m.role || ""} ${(m as any).position || ""} ${(m as any).focus || ""} ${m.designation || ""} ${m.specialization || ""}`.toLowerCase();

    // 1. CORE COUNCIL: Matches if category is Core Council OR role contains president, vice-president, secretary, treasurer, or council.
    if (filter === "core" || filter.includes("core") || filter.includes("council")) {
      const isCatMatch = memberCat.includes("core") || memberCat.includes("council");
      const isRoleMatch =
        roleFields.includes("president") ||
        roleFields.includes("vice-president") ||
        roleFields.includes("vice president") ||
        roleFields.includes("secretary") ||
        roleFields.includes("treasurer") ||
        roleFields.includes("council");
      return isCatMatch || isRoleMatch;
    }

    // 2. EVENTS & HACKATHONS: Matches if category is Events & Hackathons OR role contains event, logistics, operation, decoration, cultural, sports, discipline, or hackathon.
    if (filter === "events" || filter.includes("event") || filter.includes("hackathon") || filter.includes("hack")) {
      const isCatMatch =
        memberCat.includes("event") ||
        memberCat.includes("hackathon") ||
        memberCat.includes("hack");
      const isRoleMatch =
        roleFields.includes("event") ||
        roleFields.includes("logistics") ||
        roleFields.includes("operation") ||
        roleFields.includes("decoration") ||
        roleFields.includes("cultural") ||
        roleFields.includes("sports") ||
        roleFields.includes("discipline") ||
        roleFields.includes("hackathon");
      return isCatMatch || isRoleMatch;
    }

    // 3. PUBLIC RELATIONS: Matches if category is Public Relations OR role contains public, relation, sponsorship, alumni, media, pr, marketing, or outreach.
    if (
      filter === "outreach" ||
      filter === "pr" ||
      filter.includes("public") ||
      filter.includes("relation") ||
      filter.includes("outreach")
    ) {
      const isCatMatch =
        memberCat.includes("public") ||
        memberCat.includes("relation") ||
        memberCat.includes("outreach") ||
        memberCat.includes("pr") ||
        memberCat.includes("media") ||
        memberCat.includes("sponsorship") ||
        memberCat.includes("alumni");
      const isRoleMatch =
        roleFields.includes("public") ||
        roleFields.includes("relation") ||
        roleFields.includes("sponsorship") ||
        roleFields.includes("alumni") ||
        roleFields.includes("media") ||
        roleFields.includes("pr") ||
        roleFields.includes("marketing") ||
        roleFields.includes("outreach");
      return isCatMatch || isRoleMatch;
    }

    // 4. TECHNICAL & RESEARCH: Matches if category is Technical & Research OR role contains technical, research, tech, web, developer, design, or innovation.
    if (filter === "technical" || filter.includes("tech") || filter.includes("research")) {
      const isCatMatch =
        memberCat.includes("technical") ||
        memberCat.includes("research") ||
        memberCat.includes("tech");
      const isRoleMatch =
        roleFields.includes("technical") ||
        roleFields.includes("research") ||
        roleFields.includes("tech") ||
        roleFields.includes("web") ||
        roleFields.includes("developer") ||
        roleFields.includes("design") ||
        roleFields.includes("innovation");
      return isCatMatch || isRoleMatch;
    }

    return memberCat === filter || roleFields.includes(filter);
  };

  const filteredTeamMembers = useMemo(() => {
    if (!teamCategoryFilter || teamCategoryFilter === "all" || teamCategoryFilter.toLowerCase() === "all members") {
      return teamMembers;
    }
    return teamMembers.filter((m) => isMatchCategory(m, teamCategoryFilter));
  }, [teamMembers, teamCategoryFilter]);

  const filteredTeam = filteredTeamMembers;

  return (
    <main className="overflow-x-hidden max-w-full w-full bg-[#090807] text-zinc-100 min-h-screen relative selection:bg-white/20 selection:text-white">
      {/* =========================================================================
          SECTION 1: PLANET JUMPING - ASTRO-TEXTILE & SMART GARMENT 3D CANVAS HERO
          ========================================================================= */}
      <TextilePortalHero
        onOpenRegister={() => handleOpenRegistration("TEXPLORER 2026")}
        onOpenVerifiedList={() => handleOpenVerifiedList("TEXPLORER 2026")}
        onOpenContact={() => setIsContactOpen(true)}
      />

      {/* Deep Obsidian Canvas with Ambient Aurora Light Orbs & Micro-Dot Grid */}
      <AuroraBackground />

      {/* Floating Glass Navbar with High-Opacity Mobile Background */}
      <Navbar
        onOpenRegister={() => handleOpenRegistration("TEXPLORER 2026")}
        onOpenVerifiedList={() => handleOpenVerifiedList("TEXPLORER 2026")}
        onOpenContact={() => setIsContactOpen(true)}
        className="bg-[#090614]/95 backdrop-blur-2xl border-b border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.85)]"
      />

      {/* Subtle Studio Accent Divider */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* =========================================================================
          SECTION 2: BENTO-GRID UPCOMING & PAST EVENTS (ASTRO-TEXTILE SPEC)
          ========================================================================= */}
      <section
        id="events-section"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 z-10 scroll-mt-20 opacity-100 visible"
      >
        <div id="events" className="absolute -top-24 pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 opacity-100 visible">
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

            {/* Distinct Frosted Glass Tabs & Check Verified List Action */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
              <div className="grid grid-cols-2 w-full max-w-md p-1 sm:p-1.5 rounded-2xl glass-pill-navbar shadow-[0_15px_35px_rgba(0,0,0,0.7)]">
                <button
                  onClick={() => setEventTab("upcoming")}
                  className={`min-h-[44px] px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-mono text-[11px] sm:text-xs md:text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    eventTab === "upcoming"
                      ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.5)] border border-white/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span>⚡ UPCOMING<span className="hidden sm:inline"> EVENTS</span></span>
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
                  className={`min-h-[44px] px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl font-mono text-[11px] sm:text-xs md:text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                    eventTab === "past"
                      ? "bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.5)] border border-white/20"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <span>📸 PAST<span className="hidden sm:inline"> GALLERIES</span></span>
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
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[48px] px-4 sm:px-6 py-2.5 rounded-2xl font-mono text-xs sm:text-sm font-bold tracking-wider transition-all flex items-center justify-center gap-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_10px_25px_rgba(16,185,129,0.25)] cursor-pointer backdrop-blur-2xl"
              >
                <span>✔ CHECK REGISTRATION LIST</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                  </span>
                  <span>LIVE</span>
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
          </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 opacity-100 visible">
                {displayedUpcomingEvents.map((event) => {
                  const isOpen = event.status === "open";
                  const isUpcoming = event.status === "upcoming";

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setModalInitialMode("detail");
                      }}
                      className="bento-card group relative flex flex-col justify-between rounded-3xl p-6 sm:p-7 overflow-hidden cursor-pointer opacity-100 visible transform-none transition-all duration-300"
                    >
                        {/* Top-Right Ambient Radial Glow on Hover */}
                        <div className="bento-glow" />

                        <div className="relative z-10">
                          {/* Status & Category Row */}
                          <div className="flex items-center justify-between gap-2 mb-4">
                            <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/[0.04] text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold">
                              {event.category}
                            </span>

                            {/* Glowing Neon Status Badge with Live Pulse */}
                            <span
                              className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1.5 ${
                                isOpen
                                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                                  : isUpcoming
                                  ? "bg-amber-500/15 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]"
                                  : "bg-zinc-900/80 text-zinc-400 border-zinc-700/50"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOpen
                                    ? "bg-emerald-400 animate-ping"
                                    : isUpcoming
                                    ? "bg-amber-400 animate-pulse"
                                    : "bg-zinc-500"
                                }`}
                              />
                              <span>{isOpen ? "REGISTRATION OPEN" : isUpcoming ? "UPCOMING" : "CONCLUDED"}</span>
                            </span>
                          </div>

                          {/* Event Media Banner */}
                          {Boolean(event.bannerUrl || event.imageUrl || event.image || event.mediaUrl) && (
                            <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 border border-white/10 group-hover:border-purple-500/40 transition-colors">
                              <Image
                                src={event.bannerUrl || event.imageUrl || event.image || event.mediaUrl!}
                                alt={event.title}
                                fill
                                unoptimized={String(event.bannerUrl || event.mediaUrl || "").startsWith("data:")}
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
                      </div>
                    );
                  })}
              </div>
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
              <div className="space-y-8 sm:space-y-10 opacity-100 visible">
                {pastEvents.map((event) => {
                  const gallery =
                    event.galleryUrls && event.galleryUrls.length > 0
                      ? event.galleryUrls
                      : event.gallery && event.gallery.length > 0
                      ? event.gallery
                      : (event.bannerUrl || event.imageUrl || event.image || event.mediaUrl)
                      ? [event.bannerUrl || event.imageUrl || event.image || event.mediaUrl!]
                      : [];

                  return (
                    <div
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setModalInitialMode("detail");
                      }}
                      className="bento-card group relative rounded-3xl p-6 sm:p-8 overflow-hidden cursor-pointer opacity-100 visible transform-none transition-all duration-300"
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
                          <div className="mt-4 pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
                            <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                              <span className="text-emerald-400">✓</span>
                              <span>Concluded • Documented in SGGSIE&amp;T archival records</span>
                            </span>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent({ ...event, isPastSection: true, _isPast: true });
                                  setModalInitialMode("verifiedList");
                                }}
                                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] w-full sm:w-auto"
                              >
                                <span>✔ Attendee Registry</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEvent({ ...event, isPastSection: true, _isPast: true });
                                  setModalInitialMode("detail");
                                }}
                                className="min-h-[42px] px-4 sm:px-5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-purple-400 text-purple-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer text-xs w-full sm:w-auto"
                              >
                                <span>View Full Conclave Dossier</span>
                                <span>🔍</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
          )}
        </div>
      </section>

      {/* Subtle Studio Accent Divider */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* =========================================================================
          SECTION 3: PUBLIC VERIFICATION & REGISTRATION DOSSIER
          ========================================================================= */}
      <section
        id="verified-section"
        className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 z-10 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="care-label-box p-8 sm:p-12 relative overflow-hidden"
          >
            {/* Ambient Selvedge Accent */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-[11px] font-mono text-emerald-400 mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>SGGSIE&amp;T TESA • REGISTRATION VERIFICATION PROTOCOL</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white mb-3">
                  PUBLIC REGISTRATION &amp; VERIFICATION DOSSIER
                </h2>
                <p className="text-sm text-zinc-300 font-normal leading-relaxed">
                  Real-time participant validation synchronized with Firestore. Query authorized student credentials, competition track allocations, and verified event badge statuses.
                </p>

                {/* Garment Care-Label Spec Attributes */}
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[10px] text-zinc-400">
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-zinc-500 block">PROTOCOL:</span>
                    <span className="text-white font-bold">SHA-256 REG ID</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10">
                    <span className="text-zinc-500 block">LEDGER STATUS:</span>
                    <span className="text-emerald-400 font-bold">LIVE FIRESTORE SYNC</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-white/10 col-span-2 sm:col-span-1">
                    <span className="text-zinc-500 block">CERTIFICATION:</span>
                    <span className="text-purple-300 font-bold">DIGITAL BADGE</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                <button
                  onClick={() => handleOpenVerifiedList("TEXPLORER 2026")}
                  className="px-8 py-4 rounded-xl font-mono text-xs font-bold tracking-wider uppercase bg-emerald-500 hover:bg-emerald-400 text-black transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>✔ Open Live Registry</span>
                  <span>→</span>
                </button>

                <button
                  onClick={() => handleOpenRegistration("TEXPLORER 2026")}
                  className="px-6 py-3.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase bg-white/[0.05] hover:bg-white/[0.1] border border-white/20 text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Register Participant</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Subtle Studio Accent Divider */}
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>

      {/* =========================================================================
          SECTION 4: BENTO-GRID TESA TEAM SECTION
          ========================================================================= */}
      <section
        id="team-section"
        className="relative py-24 sm:py-32 px-4 sm:px-6 lg:px-8 z-10 scroll-mt-20 opacity-100 visible"
      >
        <div id="team" className="absolute -top-24 pointer-events-none" />
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14 opacity-100 visible">
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
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 text-xs font-mono">
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
                  className={`min-h-[38px] sm:min-h-[42px] inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border text-[11px] sm:text-xs transition-all duration-200 cursor-pointer ${
                    teamCategoryFilter === tab.id
                      ? "bg-purple-600 text-white border-purple-400 font-bold shadow-[0_0_20px_rgba(168,85,247,0.45)]"
                      : "bg-white/[0.02] text-zinc-300 border-white/10 hover:border-purple-500/40 hover:text-white"
                  }`}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Staggered Bento Team Grid or Pulsing Skeleton */}
          {isDataLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 justify-items-center opacity-100 visible">
              {[1, 2, 3].map((n) => (
                <div
                  key={`team-skel-${n}`}
                  className="bento-card relative flex flex-col justify-between rounded-3xl p-5 overflow-hidden animate-pulse min-h-[440px] w-full max-w-sm"
                >
                  <div>
                    <div className="relative w-full aspect-[4/5] sm:h-80 mb-4 rounded-2xl bg-zinc-900 overflow-hidden" />
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
          ) : filteredTeamMembers.length === 0 ? (
            <div className="py-16 px-6 text-center rounded-3xl border border-white/10 bg-[#0b0c10]/80 backdrop-blur-2xl shadow-2xl max-w-xl mx-auto opacity-100 visible">
              <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl text-purple-300">
                👥
              </div>
              <h3 className="text-lg font-mono font-bold text-white mb-1.5">
                No members listed in this division yet
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md mx-auto mb-5">
                There are currently no council members listed in this division.
              </p>
              <button
                onClick={() => setTeamCategoryFilter("all")}
                className="px-5 py-2.5 rounded-full text-xs font-mono font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer inline-flex items-center gap-2"
              >
                <span>Show All Members</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
                  {teamMembers.length}
                </span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4 justify-items-center opacity-100 visible">
              {filteredTeamMembers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="bento-card group relative flex flex-col justify-between rounded-3xl p-5 sm:p-6 overflow-hidden cursor-pointer w-full max-w-sm opacity-100 visible transform-none transition-all duration-300"
                >
                  {/* Top-Right Ambient Glow on Hover */}
                  <div className="bento-glow" />

                  <div className="relative z-10 flex flex-col justify-between h-full">
                    <div>
                      {/* Member Portrait Frame with aspect-[4/5] portrait ratio & object-top */}
                      <div className="relative w-full aspect-[4/5] sm:h-80 mb-4 rounded-2xl border border-white/10 bg-zinc-900 overflow-hidden group-hover:border-purple-500/50 transition-all duration-500 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                        <TeamMemberAvatar member={member} />

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
                          {(member.role || "").replace(/coordianator/gi, "Coordinator")}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors tracking-tight">
                          {member.name}
                        </h3>
                        <p className="text-[11px] font-mono text-zinc-400 mt-0.5 truncate">
                          {(member.designation || "").replace(/coordianator/gi, "Coordinator")}
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
                        {(member.skills || []).slice(0, 3).map((skill, sIdx) => (
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
                </div>
              ))}
            </div>
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
              <div className="w-full flex items-center justify-between pb-3 sm:pb-4 font-mono text-xs text-zinc-400 gap-2">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                  <span className="text-white font-bold truncate max-w-[150px] sm:max-w-md">
                    {lightboxImage.title}
                  </span>
                  <span className="hidden sm:inline shrink-0">• Archival Photo #{lightboxImage.index}</span>
                </div>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="shrink-0 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white transition-colors cursor-pointer text-xs"
                >
                  ✕ Close
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
          INTERACTIVE CONTACT US MODAL (OFFICIAL GMAIL, INSTAGRAM, LINKEDIN)
          ========================================================================= */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* =========================================================================
          HYPER-MODERN DARK STUDIO FOOTER WITH BRAND LOGO BUTTONS
          ========================================================================= */}
      <footer className="relative z-20 w-full border-t border-white/10 bg-black/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8 font-mono text-xs text-zinc-400">
          {/* Top Row: Brand Info + Official Logo Buttons + Contact Us Trigger */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
            {/* Brand Identity */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 text-center sm:text-left">
              <div className="relative w-10 h-10 rounded-full border border-white/40 p-[1.5px] overflow-hidden bg-white shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <Image
                  src="/tesa-logo.png"
                  alt="TESA Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-sm sm:text-base tracking-wide">
                  TESA • SGGSIE&amp;T NANDED
                </span>
                <span className="text-[11px] text-zinc-400 font-sans mt-0.5">
                  Department of Textile Technology • Est. 1987
                </span>
              </div>
            </div>

            {/* Official Logo Buttons Cluster */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {/* Gmail Logo Button */}
              <a
                href="mailto:tesa@sggs.ac.in"
                className="group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-red-500/50 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(234,67,53,0.35)] cursor-pointer"
                title="Send Email to tesa@sggs.ac.in"
              >
                <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <GmailLogoIcon className="w-5 h-5" />
                </div>
                <span className="text-zinc-200 group-hover:text-white text-xs font-mono">
                  tesa@sggs.ac.in
                </span>
              </a>

              {/* Instagram Logo Button 1: TESA Official */}
              <a
                href="https://www.instagram.com/tesa_sggs?rpxt=cmpraG52dHZtdWtk"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-pink-500/50 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(214,41,118,0.35)] cursor-pointer"
                title="Official Instagram: @tesa_sggs"
              >
                <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
                  <InstagramLogoIcon className="w-5 h-5" />
                </div>
                <span className="text-zinc-200 group-hover:text-white text-xs font-mono">
                  @tesa_sggs
                </span>
              </a>

              {/* Instagram Logo Button 2: TEXPLORER */}
              <a
                href="https://www.instagram.com/sggs.texplorer?mdxt=cmwwNHN3OWl2NXQz"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(250,60,76,0.35)] cursor-pointer"
                title="TEXPLORER National Event: @sggs.texplorer"
              >
                <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
                  <InstagramLogoIcon className="w-5 h-5" />
                </div>
                <span className="text-zinc-200 group-hover:text-white text-xs font-mono">
                  @sggs.texplorer
                </span>
              </a>

              {/* LinkedIn Logo Button */}
              <a
                href="https://www.linkedin.com/company/textile-engineering-student-association-sggsie-t-nanded/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-sky-500/50 transition-all duration-300 shadow-md hover:shadow-[0_0_20px_rgba(10,102,194,0.35)] cursor-pointer"
                title="LinkedIn: Textile Engineering Student Association SGGSIE&T"
              >
                <div className="w-5 h-5 rounded-md overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LinkedInLogoIcon className="w-5 h-5" />
                </div>
                <span className="text-zinc-200 group-hover:text-white text-xs font-mono">
                  LinkedIn
                </span>
              </a>

              {/* Contact Us Modal Launcher Button */}
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600/30 to-violet-600/30 hover:from-purple-600/50 hover:to-violet-600/50 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold tracking-wide transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 text-purple-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Contact Us</span>
              </button>
            </div>
          </div>

          {/* Bottom Row: Quick Navigation Links + Copyright */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-300">
            <div className="flex flex-wrap items-center justify-center gap-5 text-zinc-400">
              <a href="#hero-experience" className="hover:text-white transition-colors cursor-pointer">
                Atelier
              </a>
              <a href="#events-section" className="hover:text-white transition-colors cursor-pointer">
                Events
              </a>
              <a href="#verified-section" className="hover:text-white transition-colors cursor-pointer">
                Verified Registry
              </a>
              <a href="#team-section" className="hover:text-white transition-colors cursor-pointer">
                TESA Team
              </a>
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="hover:text-purple-300 transition-colors cursor-pointer"
              >
                Contact &amp; Outreach
              </button>
              <Link
                href="/admin"
                className="px-3 py-1 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 hover:border-white text-zinc-200 hover:text-white transition-all cursor-pointer"
              >
                Admin Portal →
              </Link>
            </div>

            <div className="text-center md:text-right text-[11px] text-zinc-500">
              © 2026 Textile Engineering Students Association, SGGSIE&amp;T. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
