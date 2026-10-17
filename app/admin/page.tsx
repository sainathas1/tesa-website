"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { auth, googleProvider, db, isFirebaseConfigured } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import * as XLSX from "xlsx";

// ============================================================================
// DATA INTERFACES & SCHEMAS (Synced with Minimalist Architecture)
// ============================================================================

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
  createdAt?: any;
}

export interface Registration {
  id: string;
  studentName: string;
  prn: string;
  email: string;
  department: string;
  year: string;
  eventTitle: string;
  registeredAt: string;
  status: "pending" | "approved" | "rejected";
  paymentScreenshotUrl?: string;
}

// ============================================================================
// DEFAULT SEED DATA
// ============================================================================

const INITIAL_TEAM: TeamMember[] = [
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
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80",
    accentColor: "from-purple-500/20 to-pink-600/30",
  },
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "ev-demo-1",
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
  },
  {
    id: "ev-demo-2",
    title: "SMART WEAVES HACKATHON 2026",
    category: "Technical Hackathon",
    date: "May 10–11, 2026",
    venue: "Textile CAD/CAM Studio & IoT Labs",
    deadline: "May 1, 2026",
    capacity: 100,
    status: "upcoming",
    eventStatus: "Upcoming",
    mediaUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
    summary: "36-hour sprint pairing textile engineers with electronics students to build wearable fabric sensors.",
    highlights: "Hardware Looms Access • Angel Mentors • Seed Incubation",
  },
  {
    id: "ev-demo-3",
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
    id: "ev-demo-4",
    title: "TEX-CONCLAVE 2025: Sustainable Textiles Conclave",
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
];

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: "reg-1",
    studentName: "Aditya Deshmukh",
    prn: "2023BTE042",
    email: "aditya.d@sggs.ac.in",
    department: "Textile Technology",
    year: "Third Year B.Tech",
    eventTitle: "TEX-CONCLAVE 2026: National Smart Fibers Symposium",
    registeredAt: "2026-03-28",
    status: "approved",
  },
  {
    id: "reg-2",
    studentName: "Priyanka Joshi",
    prn: "2024BTE019",
    email: "priyanka.j@sggs.ac.in",
    department: "Textile Technology",
    year: "Second Year B.Tech",
    eventTitle: "SMART WEAVES HACKATHON 2026",
    registeredAt: "2026-03-29",
    status: "pending",
  },
  {
    id: "reg-3",
    studentName: "Kunal Shinde",
    prn: "2022BTE005",
    email: "kunal.s@sggs.ac.in",
    department: "Textile Technology",
    year: "Final Year B.Tech",
    eventTitle: "NANOFIBER & ELECTROSPINNING WORKSHOP",
    registeredAt: "2026-03-30",
    status: "approved",
  },
];

// Sample portrait links for fast preview testing in modals
const SAMPLE_PORTRAITS = [
  { label: "Male Student", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80" },
  { label: "Female Student", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80" },
  { label: "Executive Leader", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80" },
  { label: "Research Innovator", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80" },
  { label: "Tech Specialist", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80" },
];

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Default active tab is "team" (Manage TESA Team is #1)
  const [activeTab, setActiveTab] = useState<"team" | "events" | "registrations" | "all">("team");

  // Connectivity state for Firestore
  const [firestoreStatus, setFirestoreStatus] = useState<
    "checking" | "connected" | "missing_env" | "not_provisioned"
  >(!isFirebaseConfigured ? "missing_env" : "checking");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // --------------------------------------------------------------------------
  // 1. STATE: TESA TEAM (PRIMARY MANAGEMENT SECTION)
  // --------------------------------------------------------------------------
  const [teamList, setTeamList] = useState<TeamMember[]>(INITIAL_TEAM);
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<string>("all");
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  const [teamForm, setTeamForm] = useState<TeamMember>({
    id: "",
    name: "",
    role: "",
    designation: "",
    year: "Third Year B.Tech",
    category: "core",
    bio: "",
    specialization: "",
    skills: [],
    photoPlaceholder: "",
    photoUrl: "",
    accentColor: "from-cyan-500/20 to-blue-600/30",
  });
  const [skillsInput, setSkillsInput] = useState<string>("");
  const teamFileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // 2. STATE: EVENTS (SECONDARY SECTION DIRECTLY BELOW TEAM)
  // --------------------------------------------------------------------------
  const [eventsList, setEventsList] = useState<EventItem[]>(INITIAL_EVENTS);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState<boolean>(false);

  const [eventForm, setEventForm] = useState<EventItem>({
    id: "",
    title: "",
    category: "National Conclave",
    date: "",
    venue: "SGGSIE&T Main Auditorium",
    deadline: "",
    capacity: 150,
    status: "open",
    eventStatus: "Upcoming",
    mediaUrl: "",
    summary: "",
    highlights: "",
    galleryUrls: [],
  });
  const eventFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // 3. STATE: REGISTRATIONS & EXCEL EXPORT
  // --------------------------------------------------------------------------
  const [registrations, setRegistrations] = useState<Registration[]>(INITIAL_REGISTRATIONS);
  const [registrationSearch, setRegistrationSearch] = useState<string>("");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // --------------------------------------------------------------------------
  // TOP CONNECTION CHECKER BANNER
  // --------------------------------------------------------------------------
  const renderConnectionBanner = () => {
    if (!isFirebaseConfigured || firestoreStatus === "missing_env") {
      return (
        <div
          id="firebase-conn-missing"
          className="w-full bg-gradient-to-r from-red-950 via-red-900 to-red-950 border-b border-red-500/60 px-4 py-3 text-red-100 text-xs font-mono flex items-center justify-between gap-3 shadow-[0_4px_25px_rgba(239,68,68,0.3)] z-50 sticky top-0"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
            </span>
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-bold uppercase tracking-wider text-white">
                Error: Firebase Environment Variables Missing.
              </span>
              <span className="hidden sm:inline text-red-300">
                NEXT_PUBLIC_FIREBASE_PROJECT_ID is not configured in environment variables.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Open Vercel →
            </a>
          </div>
        </div>
      );
    }

    if (firestoreStatus === "not_provisioned") {
      return (
        <div
          id="firebase-conn-not-provisioned"
          className="w-full bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-b border-amber-500/60 px-4 py-3 text-amber-100 text-xs font-mono flex items-center justify-between gap-3 shadow-[0_4px_25px_rgba(245,158,11,0.3)] z-50 sticky top-0"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-bold uppercase tracking-wider text-amber-200">
                Database &apos;(default)&apos; Not Found in Firebase Console.
              </span>
              <span className="hidden sm:inline text-amber-300">
                Open Firebase Console &gt; Firestore Database &gt; Click &apos;Create database&apos; (Start in Test mode).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
            >
              Firebase Console →
            </a>
          </div>
        </div>
      );
    }

    if (firestoreStatus === "connected") {
      return (
        <div
          id="firebase-conn-active"
          className="w-full bg-gradient-to-r from-emerald-950/95 via-emerald-900/90 to-emerald-950/95 border-b border-emerald-500/60 px-4 py-2.5 text-emerald-100 text-xs font-mono flex items-center justify-between gap-3 shadow-[0_4px_20px_rgba(16,185,129,0.25)] z-50 sticky top-0"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 animate-pulse" />
            </span>
            <div className="flex flex-wrap items-center gap-x-2">
              <span className="font-bold uppercase tracking-wider text-white">
                Firebase Database Connected.
              </span>
              <span className="hidden sm:inline text-emerald-300">
                Cloud Firestore &quot;(default)&quot; is live and operational.
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-500/40 text-[10px] text-emerald-300 font-bold shrink-0">
            ONLINE
          </span>
        </div>
      );
    }

    return (
      <div
        id="firebase-conn-checking"
        className="w-full bg-slate-900/90 border-b border-white/10 px-4 py-2 text-slate-300 text-xs font-mono flex items-center gap-2.5 z-50 sticky top-0"
      >
        <div className="w-3 h-3 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
        <span className="text-[11px] text-slate-400">Verifying Cloud Firestore connectivity...</span>
      </div>
    );
  };

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // --------------------------------------------------------------------------
  // DATA HYDRATION & FIRESTORE LIVE SYNC
  // --------------------------------------------------------------------------
  useEffect(() => {
    try {
      const storedTeam = localStorage.getItem("tesa_team");
      if (storedTeam) {
        const parsed = JSON.parse(storedTeam);
        if (Array.isArray(parsed) && parsed.length > 0) setTeamList(parsed);
      } else {
        localStorage.setItem("tesa_team", JSON.stringify(INITIAL_TEAM));
      }

      const storedEvents = localStorage.getItem("tesa_events");
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) setEventsList(parsed);
      } else {
        localStorage.setItem("tesa_events", JSON.stringify(INITIAL_EVENTS));
      }

      const storedRegs = localStorage.getItem("tesa_registrations");
      if (storedRegs) {
        const parsed = JSON.parse(storedRegs);
        if (Array.isArray(parsed) && parsed.length > 0) setRegistrations(parsed);
      } else {
        localStorage.setItem("tesa_registrations", JSON.stringify(INITIAL_REGISTRATIONS));
      }
    } catch (err) {
      console.warn("localStorage note:", err);
    }

    // Probe Firestore connectivity immediately
    if (!isFirebaseConfigured) {
      setFirestoreStatus("missing_env");
    } else {
      (async () => {
        try {
          await getDocs(query(collection(db, "events"), limit(1)));
          setFirestoreStatus("connected");
        } catch (err: any) {
          const msg = err?.message || "";
          if (
            msg.includes("Database '(default)' not found") ||
            err?.code === "not-found"
          ) {
            setFirestoreStatus("not_provisioned");
          } else if (err?.code === "permission-denied") {
            setFirestoreStatus("connected");
          } else if (!isFirebaseConfigured) {
            setFirestoreStatus("missing_env");
          }
        }
      })();
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        syncFromFirestore();
      }
    });

    return () => unsubscribe();
  }, []);

  const syncFromFirestore = async () => {
    if (!isFirebaseConfigured) {
      setFirestoreStatus("missing_env");
      return;
    }
    try {
      // 1. Team sync
      const teamSnap = await getDocs(collection(db, "team"));
      if (!teamSnap.empty) {
        const items: TeamMember[] = [];
        teamSnap.forEach((d) => items.push({ ...(d.data() as TeamMember), id: d.id }));
        setTeamList(items);
        localStorage.setItem("tesa_team", JSON.stringify(items));
      }

      // 2. Events sync
      const evSnap = await getDocs(query(collection(db, "events"), orderBy("createdAt", "desc")));
      if (!evSnap.empty) {
        const items: EventItem[] = [];
        evSnap.forEach((d) => items.push({ ...(d.data() as EventItem), id: d.id }));
        setEventsList(items);
        localStorage.setItem("tesa_events", JSON.stringify(items));
      }

      // 3. Registrations sync (both event_registrations and registrations collections)
      const items: Registration[] = [];

      try {
        const evRegSnap = await getDocs(collection(db, "event_registrations"));
        if (!evRegSnap.empty) {
          evRegSnap.forEach((d) => {
            const data = d.data();
            items.push({
              id: d.id,
              studentName: data.fullName || data.studentName || "Student",
              prn: data.prn || "N/A",
              email: data.contactNumber || data.email || "",
              department: "Textile Technology",
              year: data.year || "B.Tech",
              eventTitle: data.eventTitle || "Conclave",
              registeredAt: data.registeredAt ? data.registeredAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
              status: data.status || "pending",
              paymentScreenshotUrl: data.paymentScreenshotUrl,
            });
          });
        }
      } catch (e) {
        console.warn("event_registrations sync fallback:", e);
      }

      try {
        const regSnap = await getDocs(collection(db, "registrations"));
        if (!regSnap.empty) {
          regSnap.forEach((d) => items.push({ ...(d.data() as Registration), id: d.id }));
        }
      } catch (e) {
        console.warn("registrations sync fallback:", e);
      }

      if (items.length > 0) {
        setRegistrations(items);
        localStorage.setItem("tesa_registrations", JSON.stringify(items));
      }

      setFirestoreStatus("connected");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Database '(default)' not found") || err?.code === "not-found") {
        setFirestoreStatus("not_provisioned");
      } else {
        console.warn("Firestore sync status:", msg);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      showToast("Authentication successful! Welcome to TESA Admin.");
    } catch (error: any) {
      console.error("Login failed:", error);
      showToast(error?.message || "Google sign-in failed.", "error");
    }
  };

  // Cloudinary media uploads handled universally via uploadToCloudinary (@/lib/cloudinary)

  // --------------------------------------------------------------------------
  // TEAM ACTIONS (Photo Upload & Firestore Save)
  // --------------------------------------------------------------------------

  const handleOpenAddTeamModal = () => {
    setEditingTeamMember(null);
    setTeamForm({
      id: "",
      name: "",
      role: "",
      designation: "",
      year: "Third Year B.Tech",
      category: "core",
      bio: "",
      specialization: "",
      skills: [],
      photoPlaceholder: "",
      photoUrl: "",
      accentColor: "from-cyan-500/20 to-blue-600/30",
    });
    setSkillsInput("");
    setIsTeamModalOpen(true);
  };

  const handleOpenEditTeamModal = (m: TeamMember) => {
    setEditingTeamMember(m);
    setTeamForm({
      ...m,
      skills: m.skills || [],
      photoUrl: m.photoUrl || "",
    });
    setSkillsInput(m.skills ? m.skills.join(", ") : "");
    setIsTeamModalOpen(true);
  };

  const handleTeamPhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("Photo exceeds 8MB limit. Please upload a smaller image.", "error");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      showToast("Uploading Media... Sending portrait photo to Cloudinary...", "info");
      const url = await uploadToCloudinary(file);
      setTeamForm((prev) => ({ ...prev, photoUrl: url }));
      showToast("Portrait photo uploaded to Cloudinary successfully!");
    } catch (err: any) {
      console.error("Cloudinary portrait upload error:", err);
      showToast(err?.message || "Could not upload photo to Cloudinary. Try choosing another file.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      showToast("Error: Firebase Environment Variables Missing. Database disconnected.", "error");
      return;
    }
    if (!teamForm.name.trim() || !teamForm.role.trim()) {
      showToast("Please provide Member Name and Role.", "error");
      return;
    }

    const initials = teamForm.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "TM";

    const parsedSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: TeamMember = {
      ...teamForm,
      photoPlaceholder: initials,
      skills: parsedSkills.length > 0 ? parsedSkills : ["Leadership", "Textile Tech"],
    };

    if (editingTeamMember) {
      const updated = teamList.map((m) =>
        m.id === editingTeamMember.id ? { ...payload, id: editingTeamMember.id } : m
      );
      setTeamList(updated);
      localStorage.setItem("tesa_team", JSON.stringify(updated));

      try {
        await setDoc(doc(db, "team", editingTeamMember.id), payload, { merge: true });
      } catch (e) {
        console.warn("Saved to localStorage; Firestore sync will retry.");
      }

      showToast(`Updated council member ${payload.name}!`);
    } else {
      const newId = `lead-${Date.now()}`;
      const newMember = { ...payload, id: newId };
      const updated = [newMember, ...teamList];
      setTeamList(updated);
      localStorage.setItem("tesa_team", JSON.stringify(updated));

      try {
        const docRef = await addDoc(collection(db, "team"), {
          ...newMember,
          createdAt: serverTimestamp(),
          addedBy: user?.email || "admin",
        });
        newMember.id = docRef.id;
      } catch (e) {
        console.warn("Saved to localStorage; Firestore sync will retry.");
      }

      showToast(`Added ${payload.name} to TESA Council!`);
    }

    setIsTeamModalOpen(false);
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove council member ${name}?`)) return;

    const filtered = teamList.filter((m) => m.id !== id);
    setTeamList(filtered);
    localStorage.setItem("tesa_team", JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, "team", id));
    } catch (e) {}

    showToast(`Removed council member ${name}.`);
  };

  // --------------------------------------------------------------------------
  // EVENT ACTIONS (Banner Upload & Firestore Save)
  // --------------------------------------------------------------------------

  const handleOpenAddEventModal = () => {
    setEditingEventId(null);
    setGalleryFiles([]);
    setEventForm({
      id: "",
      title: "",
      category: "National Conclave",
      date: "",
      venue: "SGGSIE&T Main Auditorium",
      deadline: "",
      capacity: 150,
      status: "open",
      eventStatus: "Upcoming",
      mediaUrl: "",
      summary: "",
      highlights: "",
      galleryUrls: [],
    });
    setIsEventModalOpen(true);
  };

  const handleOpenEditEventModal = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setGalleryFiles([]);
    const resolvedStatus: "Upcoming" | "Concluded" =
      ev.eventStatus || (ev.status === "closed" ? "Concluded" : "Upcoming");
    setEventForm({
      ...ev,
      eventStatus: resolvedStatus,
      galleryUrls: ev.galleryUrls || [],
    });
    setIsEventModalOpen(true);
  };

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setGalleryFiles((prev) => [...prev, ...selected]);
      showToast(`Selected ${selected.length} gallery file(s). Will upload to Cloudinary.`);
    }
  };

  const handleRemoveGalleryFile = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingGalleryUrl = (urlToRemove: string) => {
    setEventForm((prev) => ({
      ...prev,
      galleryUrls: (prev.galleryUrls || []).filter((u) => u !== urlToRemove),
    }));
  };

  const handleEventBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("Banner image exceeds 8MB. Please choose a smaller image.", "error");
      return;
    }

    try {
      setIsUploadingBanner(true);
      showToast("Uploading Media... Sending event banner to Cloudinary...", "info");
      const url = await uploadToCloudinary(file);
      setEventForm((prev) => ({ ...prev, mediaUrl: url }));
      showToast("Event banner uploaded to Cloudinary successfully!");
    } catch (err: any) {
      console.error("Cloudinary event banner upload error:", err);
      showToast(err?.message || "Failed to upload banner to Cloudinary.", "error");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      showToast("Error: Firebase Environment Variables Missing. Database disconnected.", "error");
      return;
    }
    if (!eventForm.title.trim() || !eventForm.date.trim()) {
      showToast("Please provide an Event Title and Date.", "error");
      return;
    }

    try {
      setIsSubmittingEvent(true);

      // Loop through selected gallery files and upload each to Cloudinary (using unsigned preset)
      let finalGalleryUrls: string[] = [...(eventForm.galleryUrls || [])];
      if (eventForm.eventStatus === "Concluded" && galleryFiles.length > 0) {
        setIsUploadingGallery(true);
        showToast(`Uploading ${galleryFiles.length} photo(s) to Cloudinary...`, "info");
        try {
          for (let i = 0; i < galleryFiles.length; i++) {
            const file = galleryFiles[i];
            const url = await uploadToCloudinary(file);
            finalGalleryUrls.push(url);
          }
          showToast(`Uploaded ${galleryFiles.length} gallery photo(s) to Cloudinary!`);
        } catch (uploadErr) {
          console.error("Gallery upload error:", uploadErr);
          showToast("Some gallery photos failed to upload to Cloudinary. Saving event.", "error");
        } finally {
          setIsUploadingGallery(false);
        }
      }

      const isConcluded = eventForm.eventStatus === "Concluded";
      const mappedStatus: "open" | "upcoming" | "closed" = isConcluded
        ? "closed"
        : eventForm.status === "closed"
        ? "upcoming"
        : eventForm.status || "upcoming";

      const eventPayload: EventItem = {
        ...eventForm,
        eventStatus: eventForm.eventStatus || (isConcluded ? "Concluded" : "Upcoming"),
        status: mappedStatus,
        galleryUrls: finalGalleryUrls,
      };

      if (editingEventId) {
        const updatedEvents = eventsList.map((ev) =>
          ev.id === editingEventId ? { ...eventPayload, id: editingEventId } : ev
        );
        setEventsList(updatedEvents);
        localStorage.setItem("tesa_events", JSON.stringify(updatedEvents));

        try {
          await setDoc(
            doc(db, "events", editingEventId),
            {
              ...eventPayload,
              updatedAt: serverTimestamp(),
              updatedBy: user?.email || "admin",
            },
            { merge: true }
          );
        } catch (err) {}

        showToast("Event updated successfully!");
      } else {
        const newId = `ev-${Date.now()}`;
        const newEvent: EventItem = {
          ...eventPayload,
          id: newId,
          capacity: Number(eventForm.capacity) || 100,
          createdAt: new Date().toISOString(),
        };

        const updatedEvents = [newEvent, ...eventsList];
        setEventsList(updatedEvents);
        localStorage.setItem("tesa_events", JSON.stringify(updatedEvents));

        try {
          const docRef = await addDoc(collection(db, "events"), {
            ...newEvent,
            createdAt: serverTimestamp(),
            authorEmail: user?.email || "admin",
          });
          newEvent.id = docRef.id;
        } catch (err) {}

        showToast(`Published "${newEvent.title}"!`);
      }
      setGalleryFiles([]);
      setIsEventModalOpen(false);
    } finally {
      setIsSubmittingEvent(false);
      setIsUploadingGallery(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return;

    const filtered = eventsList.filter((e) => e.id !== id);
    setEventsList(filtered);
    localStorage.setItem("tesa_events", JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, "events", id));
    } catch (err) {}

    showToast(`Removed event: ${title}`);
  };

  // --------------------------------------------------------------------------
  // REGISTRATIONS & EXCEL EXPORT (XLSX)
  // --------------------------------------------------------------------------

  const handleUpdateRegStatus = async (
    regId: string,
    newStatus: "approved" | "rejected" | "pending"
  ) => {
    const updated = registrations.map((r) =>
      r.id === regId ? { ...r, status: newStatus } : r
    );
    setRegistrations(updated);
    localStorage.setItem("tesa_registrations", JSON.stringify(updated));

    try {
      await updateDoc(doc(db, "event_registrations", regId), { status: newStatus });
    } catch {
      try {
        await updateDoc(doc(db, "registrations", regId), { status: newStatus });
      } catch (err) {}
    }

    showToast(`Registration marked as ${newStatus.toUpperCase()}`);
  };

  const handleDeleteRegistration = async (regId: string) => {
    if (!confirm("Are you sure you want to delete this student registration record?")) return;
    const updated = registrations.filter((r) => r.id !== regId);
    setRegistrations(updated);
    localStorage.setItem("tesa_registrations", JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, "event_registrations", regId));
    } catch {
      try {
        await deleteDoc(doc(db, "registrations", regId));
      } catch (err) {}
    }

    showToast("Registration record deleted.");
  };

  const handleExportToExcel = () => {
    if (registrations.length === 0) {
      showToast("No registrations available to export.", "error");
      return;
    }

    const excelData = registrations.map((r, idx) => ({
      "Sr No": idx + 1,
      "Student Name": r.studentName,
      "PRN / Roll No": r.prn,
      "Contact / Email": r.email,
      Department: r.department,
      "Academic Year": r.year,
      "Registered Event": r.eventTitle,
      "Registration Date": r.registeredAt,
      Status: r.status.toUpperCase(),
      "Payment Proof URL": r.paymentScreenshotUrl || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TESA_Registrations");

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 16 },
      { wch: 28 },
      { wch: 22 },
      { wch: 18 },
      { wch: 45 },
      { wch: 16 },
      { wch: 12 },
      { wch: 45 },
    ];

    const fileName = `TESA_Event_Registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    showToast(`Successfully exported ${registrations.length} student records to Excel!`);
  };

  const filteredRegistrations = registrations.filter((r) => {
    const matchesSearch =
      r.studentName.toLowerCase().includes(registrationSearch.toLowerCase()) ||
      r.prn.toLowerCase().includes(registrationSearch.toLowerCase()) ||
      r.email.toLowerCase().includes(registrationSearch.toLowerCase());

    const matchesEvent =
      filterEvent === "all" ||
      r.eventTitle.toLowerCase().includes(filterEvent.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || r.status === filterStatus;

    return matchesSearch && matchesEvent && matchesStatus;
  });

  // --------------------------------------------------------------------------
  // AUTH GUARDS & LOGIN SCREEN
  // --------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06070a] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 font-mono text-xs text-cyan-400">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>INITIALIZING TESA ADMIN CONSOLE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col justify-between relative overflow-hidden">
        {/* Top Connection Checker Banner */}
        {renderConnectionBanner()}

        <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
          <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-30" />
          <div className="relative z-10 w-full max-w-md p-8 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-mono font-bold text-white mb-2 uppercase tracking-wider">
              TESA Administrative Access
            </h1>
            <p className="text-xs text-slate-400 font-mono mb-6 leading-relaxed">
              Restricted portal for SGGSIE&amp;T Textile Engineering Students Association authorized executives. Sign in with Google to manage the Council Team and Events.
            </p>
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Authorize with Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DASHBOARD MAIN UI
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden w-full max-w-full">
      {/* Top Connection Checker Banner */}
      {renderConnectionBanner()}

      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 bg-tech-grid opacity-30" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#06070a]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="min-h-[44px] px-3.5 py-2 rounded-lg bg-white/[0.05] border border-white/10 hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>←</span>
              <span>Public Website</span>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full border border-cyan-400/40 p-0.5 overflow-hidden bg-slate-950 shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
                <Image
                  src="/tesa-logo.png"
                  alt="TESA Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                    TESA CONTROL SUITE
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                    MINIMALIST v4.0
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 hidden sm:block">
                  SGGSIE&amp;T Textile Engineering Students Association
                </span>
              </div>
            </div>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
              {user.photoURL && (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "Admin"}
                  width={28}
                  height={28}
                  unoptimized
                  className="w-7 h-7 rounded-lg border border-cyan-400/40 object-cover"
                />
              )}
              <div className="hidden md:block text-left text-xs font-mono">
                <span className="font-bold text-white block leading-none">
                  {user.displayName || "Admin"}
                </span>
                <span className="text-[10px] text-emerald-400 leading-none">
                  AUTHORIZED
                </span>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 hover:bg-red-950/40 hover:border-red-500/40 hover:text-red-300 text-xs font-mono transition-colors cursor-pointer"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-12">
        {/* Navigation Tabs Bar: Team is #1 */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "team", label: "MANAGE TESA TEAM", icon: "👥", count: teamList.length },
              { id: "events", label: "MANAGE EVENTS", icon: "📅", count: eventsList.length },
              { id: "registrations", label: "STUDENT REGISTRATIONS", icon: "📋", count: registrations.length },
              { id: "all", label: "STACKED VIEW (ALL)", icon: "🌟", count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold tracking-wide border transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-cyan-500/40 hover:text-white"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.id ? "bg-black/30 text-black font-bold" : "bg-white/10 text-slate-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <span>DATA ENGINE:</span>
            {firestoreStatus === "connected" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FIRESTORE LIVE
              </span>
            ) : firestoreStatus === "missing_env" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/70 text-red-300 border border-red-500/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                DATABASE DISCONNECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                LOCAL STORE RESILIENT
              </span>
            )}
          </div>
        </div>

        {/* Global Toast */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl text-xs font-mono border transition-all ${
              toastMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
                : toastMessage.type === "info"
                ? "bg-cyan-950/80 border-cyan-500/50 text-cyan-200"
                : "bg-red-950/80 border-red-500/50 text-red-200"
            }`}
          >
            {toastMessage.type === "success" ? "✔" : toastMessage.type === "info" ? "ℹ" : "⚠"} {toastMessage.text}
          </div>
        )}

        {/* =====================================================================
            STEP 1: SECTION 1 — MANAGE TESA TEAM (POSITION #1 AT THE VERY TOP)
            ===================================================================== */}
        {(activeTab === "team" || activeTab === "all") && (
          <section id="section-team" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border border-cyan-500/30 bg-slate-950/80 backdrop-blur-xl shadow-xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/50 text-[11px] font-mono text-cyan-300 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <span>PRIMARY MANAGEMENT • POSITION #1</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Manage TESA Council Team
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Upload portrait photos, update leadership roles, technical specializations, and manage the student council displayed on the homepage.
                </p>
              </div>

              <button
                onClick={handleOpenAddTeamModal}
                className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>+</span>
                <span>Add Council Member</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "ALL MEMBERS" },
                { id: "core", label: "CORE COUNCIL" },
                { id: "technical", label: "TECHNICAL & RESEARCH" },
                { id: "events", label: "EVENTS & OPERATIONS" },
                { id: "outreach", label: "OUTREACH & ALUMNI" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTeamCategoryFilter(c.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    teamCategoryFilter === c.id
                      ? "bg-cyan-500 text-black font-bold border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                      : "bg-slate-950/60 text-slate-400 border border-white/10 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Team Members Grid: Medium Rectangular Portraits (NEVER rounded-full) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {teamList
                .filter((m) => teamCategoryFilter === "all" || m.category === teamCategoryFilter)
                .map((member) => (
                  <div
                    key={member.id}
                    className="group rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:p-5 backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all font-mono"
                  >
                    <div>
                      {/* Medium Rectangular Portrait Frame with Theme-Blending CSS Filters */}
                      <div className="relative w-full h-48 sm:h-52 mb-3.5 rounded-xl border border-cyan-500/30 bg-zinc-950 overflow-hidden group-hover:border-cyan-400/80 transition-all duration-500 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                        {member.photoUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={member.photoUrl}
                              alt={member.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover mix-blend-luminosity grayscale-[40%] contrast-110 group-hover:grayscale-0 group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-700 ease-out"
                            />
                            {/* Dark Theme Gradient Overlay */}
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

                        {/* Category & Year Tag Overlays */}
                        <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-md uppercase">
                          {member.category}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 z-10 text-[9px] font-mono px-2 py-0.5 rounded-full bg-black/80 text-cyan-400 border border-cyan-500/30 backdrop-blur-md">
                          {member.year}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white mb-0.5 group-hover:text-cyan-300 transition-colors">
                        {member.name}
                      </h3>
                      <div className="text-[11px] text-cyan-400 font-semibold mb-0.5">
                        {member.role}
                      </div>
                      <div className="text-[10px] text-slate-400 mb-2 truncate">
                        {member.designation}
                      </div>

                      <p className="text-xs text-slate-300 font-normal mb-2.5 line-clamp-2">
                        {member.bio}
                      </p>

                      <div className="text-[10px] text-purple-300 mb-2.5 truncate">
                        ⚡ {member.specialization}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {member.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/5 text-[9px] text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditTeamModal(member)}
                        className="flex-1 py-2 rounded-lg bg-white/[0.05] hover:bg-cyan-950/60 hover:text-cyan-300 text-xs text-slate-300 border border-white/10 transition-colors cursor-pointer text-center"
                      >
                        ✏ Edit Details &amp; Photo
                      </button>
                      <button
                        onClick={() => handleDeleteTeamMember(member.id, member.name)}
                        className="py-2 px-3 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-xs text-red-300 transition-colors cursor-pointer"
                        title="Delete member"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* =====================================================================
            STEP 1: SECTION 2 — MANAGE EVENTS (DIRECTLY BELOW TEAM)
            ===================================================================== */}
        {(activeTab === "events" || activeTab === "all") && (
          <section id="section-events" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-xl">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  EVENT OPERATIONS • POSITION #2
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Manage Events &amp; Conclaves
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Publish and organize national symposiums, hackathons, and workshops displayed on the public events feed.
                </p>
              </div>

              <button
                onClick={handleOpenAddEventModal}
                className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>+</span>
                <span>Publish New Event</span>
              </button>
            </div>

            {/* Events Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsList.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 overflow-hidden flex flex-col justify-between hover:border-cyan-500/40 transition-all backdrop-blur-md"
                >
                  <div>
                    {ev.mediaUrl ? (
                      <div className="h-44 w-full overflow-hidden relative">
                        <Image
                          src={ev.mediaUrl}
                          alt={ev.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent pointer-events-none" />
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 backdrop-blur-md">
                          {ev.category}
                        </span>
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-cyan-950/30 border-b border-white/10 flex items-center justify-center text-xs font-mono text-cyan-400">
                        NO BANNER ATTACHED
                      </div>
                    )}

                    <div className="p-5 font-mono">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            ev.status === "open"
                              ? "text-emerald-400"
                              : ev.status === "upcoming"
                              ? "text-amber-400"
                              : "text-slate-500"
                          }`}
                        >
                          ● STATUS: {ev.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Capacity: {ev.capacity || "Unlimited"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                        {ev.title}
                      </h3>

                      <p className="text-xs text-slate-300 line-clamp-3 mb-4 font-normal">
                        {ev.summary}
                      </p>

                      <div className="space-y-1 text-[11px] text-slate-400 border-t border-white/5 pt-3">
                        <div>📅 <span className="text-slate-200">{ev.date}</span></div>
                        <div>📍 <span className="text-slate-200">{ev.venue}</span></div>
                        {ev.deadline && <div>⏳ Deadline: <span className="text-amber-300">{ev.deadline}</span></div>}
                        {ev.highlights && <div>🏆 <span className="text-cyan-300">{ev.highlights}</span></div>}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditEventModal(ev)}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-white/[0.06] hover:bg-cyan-950/60 hover:text-cyan-300 border border-white/10 text-xs font-mono text-slate-300 transition-colors cursor-pointer text-center"
                    >
                      ✏ Edit Details &amp; Banner
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id, ev.title)}
                      className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-xs font-mono text-red-300 transition-colors cursor-pointer"
                      title="Delete event"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================================
            SECTION 3: STUDENT REGISTRATIONS & EXCEL EXPORT
            ===================================================================== */}
        {(activeTab === "registrations" || activeTab === "all") && (
          <section id="section-registrations" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-xl">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  ATTENDEE RECORDS &amp; REPORTING
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Student Registrations &amp; Export
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Review student attendee applications, verify collegiate credentials, and download complete rosters in Microsoft Excel format.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportToExcel}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center gap-2 cursor-pointer"
                >
                  <span>📊</span>
                  <span>Export to Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur-md flex flex-col md:flex-row items-center gap-3 font-mono text-xs">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by student name, PRN, or email..."
                  value={registrationSearch}
                  onChange={(e) => setRegistrationSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-black/60 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">All Registered Events</option>
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.title}>
                      {ev.title}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-slate-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Registrations Data Table */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 overflow-hidden backdrop-blur-md font-mono text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">PRN / Roll</th>
                      <th className="py-3 px-4">Event Name</th>
                      <th className="py-3 px-4">Year</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Proof</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg, idx) => (
                        <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 text-slate-500">{idx + 1}</td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-white block">{reg.studentName}</span>
                            <span className="text-[10px] text-slate-400">{reg.email}</span>
                          </td>
                          <td className="py-3.5 px-4 text-cyan-300">{reg.prn}</td>
                          <td className="py-3.5 px-4 text-slate-200 max-w-xs truncate">{reg.eventTitle}</td>
                          <td className="py-3.5 px-4 text-slate-400">{reg.year}</td>
                          <td className="py-3.5 px-4 text-slate-400">{reg.registeredAt}</td>
                          <td className="py-3.5 px-4">
                            {reg.paymentScreenshotUrl ? (
                              <a
                                href={reg.paymentScreenshotUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold transition-all hover:scale-105"
                                title="Open payment screenshot on Cloudinary"
                              >
                                <span>🧾</span>
                                <span>Receipt</span>
                                <span className="text-[9px] opacity-70">↗</span>
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">None</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                reg.status === "approved"
                                    ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/30"
                                    : reg.status === "pending"
                                    ? "bg-amber-950/80 text-amber-300 border border-amber-500/30"
                                    : "bg-red-950/80 text-red-300 border border-red-500/30"
                              }`}
                            >
                              {reg.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-1.5">
                            {reg.status !== "approved" && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.id, "approved")}
                                className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-[10px] transition-colors cursor-pointer"
                                title="Approve"
                              >
                                ✔
                              </button>
                            )}
                            {reg.status !== "rejected" && (
                              <button
                                onClick={() => handleUpdateRegStatus(reg.id, "rejected")}
                                className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/30 text-[10px] transition-colors cursor-pointer"
                                title="Reject"
                              >
                                ✖
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteRegistration(reg.id)}
                              className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900 text-red-300 border border-red-500/30 text-[10px] transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              🗑
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-500">
                          No student registrations matching your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* =======================================================================
          MODAL: ADD / EDIT COUNCIL MEMBER (With Large Rectangular Photo Preview)
          ======================================================================= */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#090b10] border border-cyan-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl font-mono text-xs my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
                  COUNCIL DIRECTORY
                </span>
                <h3 className="text-xl font-bold text-white">
                  {editingTeamMember ? "Edit Council Member & Portrait" : "Add New Council Member"}
                </h3>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeamMember} className="space-y-5">
              {/* Image Preview & Upload Section (Large Tall Rectangle - NEVER rounded-full) */}
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-950/80 space-y-4">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide block">
                  1. Member Portrait Photo (Theme-Blended Tall Rectangle)
                </span>

                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  {/* Portrait Frame Preview */}
                  <div className="relative w-36 aspect-[3/4] rounded-xl border border-cyan-500/40 bg-zinc-950 overflow-hidden shrink-0 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                    {teamForm.photoUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={teamForm.photoUrl}
                          alt="Preview"
                          fill
                          unoptimized
                          className="object-cover mix-blend-luminosity grayscale-[40%] contrast-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/40 to-transparent pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-xl" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-slate-500">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-[9px] leading-tight">No Photo Attached</span>
                      </div>
                    )}

                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-[10px] text-cyan-300">
                        <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-1" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls & URL input */}
                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1.5 uppercase">
                        Upload Portrait Photo to Cloudinary (Unsigned):
                      </label>
                      <input
                        ref={teamFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleTeamPhotoFileChange}
                        disabled={isUploadingPhoto}
                        className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 file:cursor-pointer cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    {isUploadingPhoto && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-xs animate-pulse">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                        <span>Uploading Media... Sending portrait photo to Cloudinary...</span>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 uppercase">
                        Or Paste Direct Image URL:
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={teamForm.photoUrl || ""}
                        onChange={(e) => setTeamForm({ ...teamForm, photoUrl: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    {/* Quick Sample Portraits Picker */}
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-1.5">
                        Quick testing portraits:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_PORTRAITS.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTeamForm({ ...teamForm, photoUrl: sample.url })}
                            className="px-2 py-1 rounded bg-white/[0.04] hover:bg-cyan-950 hover:text-cyan-300 border border-white/10 text-[10px] text-slate-400 transition-colors cursor-pointer"
                          >
                            {sample.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Deshmukh"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Role / Position *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. President"
                    value={teamForm.role}
                    onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Official Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Executive Head, TESA Council"
                    value={teamForm.designation}
                    onChange={(e) => setTeamForm({ ...teamForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Academic Year</label>
                  <select
                    value={teamForm.year}
                    onChange={(e) => setTeamForm({ ...teamForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="Final Year B.Tech">Final Year B.Tech</option>
                    <option value="Third Year B.Tech">Third Year B.Tech</option>
                    <option value="Second Year B.Tech">Second Year B.Tech</option>
                    <option value="First Year B.Tech">First Year B.Tech</option>
                    <option value="M.Tech Scholar">M.Tech Scholar</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <select
                    value={teamForm.category}
                    onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="core">Core Council</option>
                    <option value="technical">Technical &amp; Research</option>
                    <option value="events">Events &amp; Operations</option>
                    <option value="outreach">Public Relations &amp; Outreach</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Technical Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart &amp; Conductive Textiles"
                    value={teamForm.specialization}
                    onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. E-Textiles, Project Leadership, Research &amp; Dev"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Member Bio / Overview</label>
                <textarea
                  rows={3}
                  placeholder="Short bio detailing council leadership contributions..."
                  value={teamForm.bio}
                  onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFirebaseConfigured || isUploadingPhoto}
                  className={`px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    !isFirebaseConfigured
                      ? "bg-red-950/70 border border-red-500/40 text-red-300 cursor-not-allowed opacity-75"
                      : "bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {!isFirebaseConfigured ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Database Disconnected</span>
                    </>
                  ) : isUploadingPhoto ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>Uploading Media...</span>
                    </>
                  ) : editingTeamMember ? (
                    "Save Changes"
                  ) : (
                    "Create Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL: ADD / EDIT EVENT
          ======================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#090b10] border border-cyan-500/40 rounded-2xl p-6 sm:p-7 shadow-2xl font-mono text-xs my-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest block">
                  EVENT OPERATIONS
                </span>
                <h3 className="text-xl font-bold text-white">
                  {editingEventId ? "Edit Event Details & Banner" : "Publish New Event"}
                </h3>
              </div>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              {/* Event Banner Section */}
              <div className="p-4 rounded-xl border border-white/10 bg-slate-950/80 space-y-3">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide block">
                  Event Banner Image (Cloudinary Unsigned Upload / URL)
                </span>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-40 h-24 rounded-lg border border-white/10 bg-black overflow-hidden shrink-0 relative">
                    {eventForm.mediaUrl ? (
                      <Image
                        src={eventForm.mediaUrl}
                        alt="Banner"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500 text-center p-2">
                        No Banner
                      </div>
                    )}
                    {isUploadingBanner && (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-cyan-300 text-[10px] animate-pulse">
                        <div className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin mb-1" />
                        <span>Uploading Media...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <input
                      ref={eventFileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={isUploadingBanner}
                      onChange={handleEventBannerFileChange}
                      className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 file:cursor-pointer cursor-pointer disabled:opacity-50"
                    />
                    <input
                      type="url"
                      placeholder="Or paste banner image URL..."
                      value={eventForm.mediaUrl || ""}
                      onChange={(e) => setEventForm({ ...eventForm, mediaUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEX-CONCLAVE 2026: National Smart Fibers Symposium"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. National Conclave / Hackathon"
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Event Status (eventStatus) *</label>
                  <select
                    value={eventForm.eventStatus || (eventForm.status === "closed" ? "Concluded" : "Upcoming")}
                    onChange={(e) => {
                      const val = e.target.value as "Upcoming" | "Concluded";
                      setEventForm({
                        ...eventForm,
                        eventStatus: val,
                        status: val === "Concluded" ? "closed" : "upcoming",
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer font-mono"
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Concluded">Concluded</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Date &amp; Schedule *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. April 28–29, 2026"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Venue / Complex</label>
                  <input
                    type="text"
                    placeholder="e.g. SGGSIE&amp;T Main Auditorium"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Registration Capacity</label>
                  <input
                    type="number"
                    value={eventForm.capacity || 100}
                    onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Registration Deadline</label>
                  <input
                    type="text"
                    placeholder="e.g. April 15, 2026"
                    value={eventForm.deadline || ""}
                    onChange={(e) => setEventForm({ ...eventForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Event Gallery Photos Section (Visible for Concluded events) */}
              {(eventForm.eventStatus === "Concluded" || eventForm.status === "closed") && (
                <div className="p-4 rounded-xl border border-cyan-500/30 bg-slate-950/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide block">
                        Event Gallery Photos
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Choose multiple photos. Upon submitting this Concluded event, they will upload to Cloudinary (unsigned preset) and save to Firestore as galleryUrls.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                      {(eventForm.galleryUrls?.length || 0) + galleryFiles.length} Photos Attached
                    </span>
                  </div>

                  <input
                    ref={galleryFileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleGalleryFilesChange}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 file:cursor-pointer cursor-pointer"
                  />

                  {/* Previews of newly selected files & existing gallery URLs */}
                  {((eventForm.galleryUrls && eventForm.galleryUrls.length > 0) || galleryFiles.length > 0) && (
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Gallery Photographs Preview:
                      </span>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
                        {eventForm.galleryUrls?.map((url, uIdx) => (
                          <div key={`existing-${uIdx}`} className="relative aspect-square rounded-lg border border-cyan-500/30 overflow-hidden group bg-black">
                            <Image src={url} alt={`Gallery ${uIdx}`} fill unoptimized className="object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveExistingGalleryUrl(url)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-950/90 text-red-300 border border-red-500/40 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete from gallery"
                            >
                              ✕
                            </button>
                          </div>
                        ))}

                        {galleryFiles.map((file, fIdx) => (
                          <div key={`file-${fIdx}`} className="relative aspect-square rounded-lg border border-amber-500/40 overflow-hidden group bg-zinc-900 flex flex-col items-center justify-center p-1 text-center">
                            <span className="text-base">📷</span>
                            <span className="text-[8px] text-amber-300 truncate w-full px-1">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveGalleryFile(fIdx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-950/90 text-red-300 border border-red-500/40 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Remove file"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isUploadingGallery && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-xs font-mono animate-pulse">
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                      <span>Uploading Media... Uploading event gallery photos to Cloudinary...</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">Key Highlights Pill</label>
                <input
                  type="text"
                  placeholder="e.g. ₹1,50,000 Cash Pool • 30+ Engineering Colleges • IEEE"
                  value={eventForm.highlights || ""}
                  onChange={(e) => setEventForm({ ...eventForm, highlights: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Event Summary</label>
                <textarea
                  rows={3}
                  placeholder="Detailed synopsis of symposium tracks, competitions..."
                  value={eventForm.summary}
                  onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  disabled={isSubmittingEvent || isUploadingBanner || isUploadingGallery}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFirebaseConfigured || isSubmittingEvent || isUploadingBanner || isUploadingGallery}
                  className={`px-5 py-2.5 rounded-lg font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    !isFirebaseConfigured
                      ? "bg-red-950/70 border border-red-500/40 text-red-300 cursor-not-allowed opacity-75"
                      : "bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {!isFirebaseConfigured ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Database Disconnected</span>
                    </>
                  ) : (isUploadingGallery || isUploadingBanner || isSubmittingEvent) ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>
                        {isUploadingGallery || isUploadingBanner
                          ? "Uploading Media..."
                          : "Saving Event..."}
                      </span>
                    </>
                  ) : (
                    <span>{editingEventId ? "Save Changes" : "Save Event"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
