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
import dynamic from "next/dynamic";
import { auth, googleProvider, db, isFirebaseConfigured } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import ConductiveThreadDivider from "@/components/ConductiveThreadDivider";
import FabricSwatchPicker from "@/components/FabricSwatchPicker";
import * as XLSX from "xlsx";

// Client-only dynamic WebGL 3D Live Textile & Woven Fabric Simulation (ssr: false prevents hydration mismatches)
const TextileCanvas3D = dynamic(
  () => import("@/components/TextileCanvas3D"),
  { ssr: false }
);

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

export type CustomFieldType =
  | "Short Text"
  | "Paragraph"
  | "Dropdown Options"
  | "File Upload (PPT/PDF/Image)";

export interface CustomFormField {
  id: string;
  questionTitle: string;
  fieldType: CustomFieldType;
  options?: string;
  required: boolean;
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
  customFormFields?: CustomFormField[];
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
  eventId?: string;
  registeredAt: string;
  status: "pending" | "approved" | "verified" | "rejected";
  paymentScreenshotUrl?: string;
  submissionFileUrl?: string;
  customAnswers?: Record<string, any>;
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

  // Authentication error state for surfacing exact error code & message
  const [authError, setAuthError] = useState<{ code?: string; message: string } | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

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
    customFormFields: [],
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
  const [selectedRegForAnswers, setSelectedRegForAnswers] = useState<Registration | null>(null);

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
              eventId: data.eventId,
              registeredAt: data.registeredAt ? data.registeredAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
              status: data.status || "pending",
              paymentScreenshotUrl: data.paymentScreenshotUrl,
              submissionFileUrl: data.submissionFileUrl,
              customAnswers: data.customAnswers || {},
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
      setAuthError(null);
      setIsLoggingIn(true);
      await signInWithPopup(auth, googleProvider);
      showToast("Authentication successful! Welcome to TESA Admin.");
    } catch (error: any) {
      console.error("Auth Error Code:", error.code);
      console.error("Auth Error Message:", error.message);
      console.error("Auth Full Error:", error);

      const code = error?.code || "unknown-code";
      const message = error?.message || "Google authentication encountered an unexpected error.";

      setAuthError({
        code,
        message,
      });

      alert(`Firebase Auth Error [${code}]:\n${message}`);
      showToast(`Auth Error [${code}]: ${message}`, "error");
    } finally {
      setIsLoggingIn(false);
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
      customFormFields: [],
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
      customFormFields: ev.customFormFields ? JSON.parse(JSON.stringify(ev.customFormFields)) : [],
    });
    setIsEventModalOpen(true);
  };

  const handleAddCustomQuestion = () => {
    const newField: CustomFormField = {
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      questionTitle: "",
      fieldType: "Short Text",
      options: "",
      required: false,
    };
    setEventForm((prev) => ({
      ...prev,
      customFormFields: [...(prev.customFormFields || []), newField],
    }));
  };

  const handleUpdateCustomQuestion = (
    fieldId: string,
    updates: Partial<CustomFormField>
  ) => {
    setEventForm((prev) => ({
      ...prev,
      customFormFields: (prev.customFormFields || []).map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      ),
    }));
  };

  const handleRemoveCustomQuestion = (fieldId: string) => {
    setEventForm((prev) => ({
      ...prev,
      customFormFields: (prev.customFormFields || []).filter(
        (field) => field.id !== fieldId
      ),
    }));
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
        customFormFields: eventForm.customFormFields || [],
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
    newStatus: "verified" | "approved" | "rejected" | "pending"
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
      Status: (r.status === "verified" || r.status === "approved" ? "VERIFIED" : r.status.toUpperCase()),
      "Presentation Media / PPT / PDF URL": r.submissionFileUrl || "N/A",
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
      { wch: 14 },
      { wch: 45 },
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

    const isVerified = r.status === "verified" || r.status === "approved";
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "verified" && isVerified) ||
      (filterStatus === "pending" && r.status === "pending") ||
      (filterStatus === "rejected" && r.status === "rejected");

    return matchesSearch && matchesEvent && matchesStatus;
  });

  // --------------------------------------------------------------------------
  // AUTH GUARDS & LOGIN SCREEN
  // --------------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen bg-transparent text-slate-100 flex items-center justify-center p-4 relative">
        <TextileCanvas3D />
        <div className="relative z-10 flex flex-col items-center gap-3 font-mono text-xs text-cyan-400 p-6 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/15 shadow-2xl">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>INITIALIZING TESA ADMIN CONSOLE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-between relative overflow-hidden">
        {/* Top Connection Checker Banner */}
        {renderConnectionBanner()}

        {/* Live Interactive 3D Textile & Woven Fabric Simulation */}
        <TextileCanvas3D />

        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
          <div className="relative z-10 w-full max-w-md p-8 rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl text-center shadow-2xl selvedge-card relative overflow-hidden group">
            {/* Industrial Serged Seam Top Edge */}
            <div className="serged-seam absolute top-0 left-0 right-0 z-20 pointer-events-none" />

            {/* Corner Selvedge Telemetry */}
            <div className="flex items-center justify-between text-[8px] font-mono text-cyan-400/60 tracking-wider mb-4 uppercase">
              <span className="flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                SECURITY MATRIX ACTIVE
              </span>
              <span className="text-slate-500">DENIER: 900D</span>
            </div>

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

            {/* Highly Visible Auth Error Banner */}
            {authError && (
              <div
                id="auth-error-banner"
                className="mb-6 p-4 rounded-xl border border-red-500/60 bg-red-950/90 text-left shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-in fade-in"
              >
                <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-red-500/30">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
                    <span className="font-mono text-xs font-bold text-red-200 uppercase tracking-wider">
                      Google Sign-In Error
                    </span>
                  </div>
                  <button
                    onClick={() => setAuthError(null)}
                    className="text-red-400 hover:text-white text-xs font-mono px-2 py-0.5 rounded bg-red-900/60 hover:bg-red-800 transition-colors cursor-pointer"
                  >
                    ✕ Dismiss
                  </button>
                </div>

                <div className="space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-red-400 text-[10px] uppercase font-bold block mb-0.5">Error Code:</span>
                    <code className="px-2 py-1 rounded bg-black/80 border border-red-500/50 text-amber-300 font-bold text-xs inline-block break-all">
                      {authError.code}
                    </code>
                  </div>

                  <div>
                    <span className="text-red-400 text-[10px] uppercase font-bold block mb-0.5">Firebase Error Message:</span>
                    <div className="p-2.5 rounded bg-black/60 border border-red-500/30 text-red-100 text-xs break-words leading-relaxed">
                      {authError.message}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-red-500/20 text-[10px] font-mono text-red-300 space-y-1">
                  <span className="font-bold text-white block">400 Bad Request Diagnostic Guide:</span>
                  <p>• <strong>auth/operation-not-allowed:</strong> Google provider is disabled. Go to Firebase Console &gt; Authentication &gt; Sign-in method &gt; Enable Google.</p>
                  <p>• <strong>auth/unauthorized-domain:</strong> Go to Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains &gt; Add your Vercel URL and localhost.</p>
                  <p>• <strong>auth/configuration-not-found:</strong> Ensure support email is set under Project Settings &gt; General in Firebase Console.</p>
                </div>
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Authorize with Google</span>
                </>
              )}
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
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden w-full max-w-full relative">
      {/* Top Connection Checker Banner */}
      {renderConnectionBanner()}

      {/* Live Interactive 3D Textile & Woven Fabric Simulation */}
      <TextileCanvas3D />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
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
          <div className="flex items-center gap-2 sm:gap-3">
            <FabricSwatchPicker />

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
              { id: "team", label: "MANAGE TESA TEAM", icon: "👥", count: teamList.length, spec: "COUNCIL" },
              { id: "events", label: "MANAGE EVENTS", icon: "📅", count: eventsList.length, spec: "LOOM" },
              { id: "registrations", label: "MANAGE REGISTRATIONS & VERIFY", icon: "📋", count: registrations.length, spec: "VERIFICATION" },
              { id: "all", label: "STACKED VIEW (ALL)", icon: "🌟", count: null, spec: "SYNC" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold tracking-wide border transition-all cursor-pointer care-label-badge ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-cyan-500 to-teal-400 bg-twill-cyan text-black border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.4)] font-bold"
                    : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-cyan-500/40 hover:text-white"
                }`}
              >
                <span className="text-[10px] opacity-75">☷</span>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    activeTab === tab.id ? "bg-black/30 text-black font-extrabold" : "bg-white/10 text-cyan-300"
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 font-bold care-label-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FIRESTORE LIVE • WEFT SYNC
              </span>
            ) : firestoreStatus === "missing_env" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/70 text-red-300 border border-red-500/40 font-bold care-label-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                DATABASE DISCONNECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 font-bold care-label-badge">
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl shadow-2xl">
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

            {/* Category Filter with Care/Spec Label Styling */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "ALL MEMBERS", spec: "100% FIBER" },
                { id: "core", label: "CORE COUNCIL", spec: "EXECUTIVE" },
                { id: "technical", label: "TECHNICAL & RESEARCH", spec: "LAB DEV" },
                { id: "events", label: "EVENTS & OPERATIONS", spec: "LOGISTICS" },
                { id: "outreach", label: "OUTREACH & ALUMNI", spec: "PR BUS" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTeamCategoryFilter(c.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer care-label-badge ${
                    teamCategoryFilter === c.id
                      ? "bg-cyan-500 bg-twill-cyan text-black font-bold border border-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                      : "bg-slate-950/60 text-slate-400 border border-white/10 hover:text-white"
                  }`}
                >
                  <span className="text-[10px] opacity-75 mr-1">☷</span>
                  {c.label}
                </button>
              ))}
            </div>

            {/* Team Members Grid: Medium Rectangular Portraits with Jacquard Selvedge Aesthetics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {teamList
                .filter((m) => teamCategoryFilter === "all" || m.category === teamCategoryFilter)
                .map((member) => (
                  <div
                    key={member.id}
                    className="group rounded-3xl border border-white/15 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between hover:border-cyan-400 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 font-mono selvedge-card relative overflow-hidden"
                  >
                    {/* Industrial Serged Seam Top Edge */}
                    <div className="serged-seam absolute top-0 left-0 right-0 z-20 pointer-events-none" />

                    <div>
                      {/* Corner Selvedge Telemetry */}
                      <div className="flex items-center justify-between text-[8px] font-mono text-cyan-400/60 tracking-wider mb-2.5 uppercase">
                        <span className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                          WARP // WEFT SYNC
                        </span>
                        <span className="text-slate-500">DENIER: 900D</span>
                      </div>

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
                        <span className="absolute top-2.5 left-2.5 z-10 text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-md uppercase care-label-badge">
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
                            className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/5 text-[9px] text-slate-300 care-label-badge"
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

        {/* CONDUCTIVE THREAD SECTION DIVIDER: SECTION 1 (TEAM) -> SECTION 2 (EVENTS) */}
        {(activeTab === "all" || activeTab === "team" || activeTab === "events") && (
          <ConductiveThreadDivider
            label="LOOM MATRIX CONTROL // BUS 01"
            subLabel="COUNCIL ARCHIVE • 400nm WAVEGUIDE • EXECUTIVE SYNAPSE"
            accent="cyan"
          />
        )}

        {/* =====================================================================
            STEP 1: SECTION 2 — MANAGE EVENTS (DIRECTLY BELOW TEAM)
            ===================================================================== */}
        {(activeTab === "events" || activeTab === "all") && (
          <section id="section-events" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl shadow-2xl">
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

            {/* Events Cards Grid with Jacquard Selvedge Borders */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsList.map((ev) => (
                <div
                  key={ev.id}
                  className="rounded-3xl border border-white/15 bg-white/[0.04] overflow-hidden flex flex-col justify-between hover:border-cyan-400 transition-all backdrop-blur-xl shadow-2xl hover:-translate-y-1 duration-300 selvedge-card relative group"
                >
                  {/* Industrial Serged Seam Top Edge */}
                  <div className="serged-seam absolute top-0 left-0 right-0 z-20 pointer-events-none" />

                  <div>
                    {/* Corner Selvedge Telemetry */}
                    <div className="flex items-center justify-between text-[8px] font-mono text-cyan-400/60 tracking-wider px-4 pt-3 pb-1 uppercase">
                      <span className="flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                        LOOM MATRIX ACTIVE
                      </span>
                      <span className="text-slate-500">SPEC: {ev.eventStatus || "UPCOMING"}</span>
                    </div>

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
                        <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30 backdrop-blur-md care-label-badge">
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
                          className={`text-[10px] font-bold uppercase care-label-badge px-2 py-0.5 rounded ${
                            ev.status === "open"
                              ? "text-emerald-400 bg-emerald-950/50 border border-emerald-500/30"
                              : ev.status === "upcoming"
                              ? "text-amber-400 bg-amber-950/50 border border-amber-500/30"
                              : "text-slate-500 bg-slate-900 border border-white/10"
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

        {/* CONDUCTIVE THREAD SECTION DIVIDER: SECTION 2 (EVENTS) -> SECTION 3 (REGISTRATIONS) */}
        {(activeTab === "all" || activeTab === "events" || activeTab === "registrations") && (
          <ConductiveThreadDivider
            label="CONDUCTIVE THREAD REGISTRY // BUS 02"
            subLabel="VERIFIED REGISTRATIONS & CLOUDINARY MEDIA VAULT • 280 GSM"
            accent="violet"
          />
        )}

        {/* =====================================================================
            SECTION 3: MANAGE REGISTRATIONS & VERIFY
            ===================================================================== */}
        {(activeTab === "registrations" || activeTab === "all") && (
          <section id="section-registrations" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur-xl shadow-2xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/40 bg-cyan-950/50 text-[11px] font-mono text-cyan-300 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>DELEGATE VERIFICATION &amp; EXPORT</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Manage Registrations &amp; Verify
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Inspect student submissions, open uploaded presentations (PPT/PDF/Image) &amp; payment receipts via Cloudinary, review custom Google Forms-style answers, and verify registrations.
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

            {/* Quick Metrics Bar with Jacquard Selvedge Aesthetics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 selvedge-card relative overflow-hidden group">
                <div className="serged-seam absolute top-0 left-0 right-0 z-10 pointer-events-none" />
                <div className="flex items-center justify-between text-[8px] text-cyan-400/60 uppercase mb-1">
                  <span>METRIC // WEFT</span>
                  <span>SYNC ACTIVE</span>
                </div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Submissions</span>
                <span className="text-xl font-bold text-white">{registrations.length}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 selvedge-card relative overflow-hidden group">
                <div className="serged-seam absolute top-0 left-0 right-0 z-10 pointer-events-none" />
                <div className="flex items-center justify-between text-[8px] text-emerald-400/60 uppercase mb-1">
                  <span>TENSILE VERIFIED</span>
                  <span>✔ 100% PASS</span>
                </div>
                <span className="text-[10px] text-emerald-300 block uppercase">Verified Delegates</span>
                <span className="text-xl font-bold text-emerald-400">
                  {registrations.filter((r) => r.status === "verified" || r.status === "approved").length}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-500/30 selvedge-card relative overflow-hidden group">
                <div className="serged-seam absolute top-0 left-0 right-0 z-10 pointer-events-none" />
                <div className="flex items-center justify-between text-[8px] text-amber-400/60 uppercase mb-1">
                  <span>LOOM QUEUE</span>
                  <span>DENIER: 450D</span>
                </div>
                <span className="text-[10px] text-amber-300 block uppercase">Pending Verification</span>
                <span className="text-xl font-bold text-amber-400">
                  {registrations.filter((r) => r.status === "pending").length}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/30 selvedge-card relative overflow-hidden group">
                <div className="serged-seam absolute top-0 left-0 right-0 z-10 pointer-events-none" />
                <div className="flex items-center justify-between text-[8px] text-red-400/60 uppercase mb-1">
                  <span>WARP DEFECT</span>
                  <span>REJECTED</span>
                </div>
                <span className="text-[10px] text-red-300 block uppercase">Rejected</span>
                <span className="text-xl font-bold text-red-400">
                  {registrations.filter((r) => r.status === "rejected").length}
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 rounded-xl border border-white/10 bg-slate-950/60 backdrop-blur-md flex flex-col md:flex-row items-center gap-3 font-mono text-xs care-label-badge">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by student name, PRN, or contact number..."
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
                  <option value="verified">Verified (✔)</option>
                  <option value="pending">Pending (⏳)</option>
                  <option value="rejected">Rejected (✖)</option>
                </select>
              </div>
            </div>

            {/* Registrations Data Table with Selvedge & Serged Seam */}
            <div className="rounded-3xl border border-white/15 bg-white/[0.04] overflow-hidden backdrop-blur-xl font-mono text-xs shadow-2xl selvedge-card relative">
              <div className="serged-seam absolute top-0 left-0 right-0 z-20 pointer-events-none" />
              <div className="flex items-center justify-between px-4 py-2 bg-slate-950/90 border-b border-white/5 text-[9px] text-cyan-400/70 uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  JACQUARD REGISTRATION MATRIX // LIVE REGISTRY
                </span>
                <span className="text-slate-500">SPEC: SGGSIE&amp;T TEXTILE LOOM SUITE • 280 GSM</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Student &amp; PRN</th>
                      <th className="py-3.5 px-4">Event Title</th>
                      <th className="py-3.5 px-4">Year &amp; Contact</th>
                      <th className="py-3.5 px-4">Presentation / Media</th>
                      <th className="py-3.5 px-4">Payment Proof</th>
                      <th className="py-3.5 px-4">Form Answers</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg, idx) => {
                        const isVerified = reg.status === "verified" || reg.status === "approved";
                        const isPending = reg.status === "pending";
                        const isRejected = reg.status === "rejected";
                        const answerCount = reg.customAnswers ? Object.keys(reg.customAnswers).length : 0;

                        return (
                          <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 text-slate-500">{idx + 1}</td>
                            
                            {/* Student & PRN */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-white block">{reg.studentName}</span>
                              <span className="text-[11px] text-cyan-300 font-semibold">{reg.prn}</span>
                            </td>

                            {/* Event Title */}
                            <td className="py-3.5 px-4 text-slate-200 max-w-xs">
                              <span className="line-clamp-2">{reg.eventTitle}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">{reg.registeredAt}</span>
                            </td>

                            {/* Year & Contact */}
                            <td className="py-3.5 px-4 text-slate-400">
                              <span className="block text-slate-300">{reg.year}</span>
                              <span className="text-[10px] text-slate-500">{reg.email}</span>
                            </td>

                            {/* Uploaded Presentation / Media (PPT/PDF/Image) */}
                            <td className="py-3.5 px-4">
                              {reg.submissionFileUrl ? (
                                <a
                                  href={reg.submissionFileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-[10px] font-semibold transition-all hover:scale-105 shadow-[0_0_10px_rgba(0,240,255,0.15)]"
                                  title="Open presentation/media uploaded to Cloudinary"
                                >
                                  <span>📄</span>
                                  <span>View Media</span>
                                  <span className="text-[9px] opacity-70">↗</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">None attached</span>
                              )}
                            </td>

                            {/* Payment Proof Screenshot */}
                            <td className="py-3.5 px-4">
                              {reg.paymentScreenshotUrl ? (
                                <a
                                  href={reg.paymentScreenshotUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold transition-all hover:scale-105 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                  title="Open payment screenshot on Cloudinary"
                                >
                                  <span>🧾</span>
                                  <span>Screenshot</span>
                                  <span className="text-[9px] opacity-70">↗</span>
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-500 italic">None</span>
                              )}
                            </td>

                            {/* Custom Form Answers */}
                            <td className="py-3.5 px-4">
                              {answerCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRegForAnswers(reg)}
                                  className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/30 text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>📋</span>
                                  <span>Answers ({answerCount})</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRegForAnswers(reg)}
                                  className="text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer underline"
                                >
                                  Details
                                </button>
                              )}
                            </td>

                            {/* Status Badge with Care-Label Aesthetics */}
                            <td className="py-3.5 px-4">
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)] care-label-badge">
                                  <span>✔</span>
                                  <span>TENSILE VERIFIED</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[10px] font-bold care-label-badge">
                                  <span>⏳</span>
                                  <span>PENDING QUEUE</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 text-red-300 border border-red-500/40 text-[10px] font-bold care-label-badge">
                                  <span>✖</span>
                                  <span>DEFECT REJECTED</span>
                                </span>
                              )}
                            </td>

                            {/* Action Buttons: Verify Registration */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isVerified ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegStatus(reg.id, "verified")}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer"
                                    title="Click to Verify Registration (updates status to verified in Firestore)"
                                  >
                                    <span>✔</span>
                                    <span>Verify Registration</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegStatus(reg.id, "pending")}
                                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[10px] border border-white/10 transition-colors cursor-pointer"
                                    title="Revert to pending"
                                  >
                                    Revert
                                  </button>
                                )}

                                {!isRejected && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegStatus(reg.id, "rejected")}
                                    className="px-2 py-1 rounded-lg bg-amber-950/50 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 text-[10px] transition-colors cursor-pointer"
                                    title="Reject registration"
                                  >
                                    ✖
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRegistration(reg.id)}
                                  className="px-2 py-1 rounded-lg bg-red-950/40 hover:bg-red-900 text-red-300 border border-red-500/30 text-[10px] transition-colors cursor-pointer"
                                  title="Delete registration record"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500">
                          <p className="text-sm text-slate-400 font-semibold mb-1">No registration submissions matching filters.</p>
                          <p className="text-xs text-slate-600">Students registering on the public portal will appear here in real-time.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* =============================================================
                MODAL: STUDENT FORM RESPONSES & VERIFICATION INSPECTOR
                ============================================================= */}
            {selectedRegForAnswers && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
                <div className="relative w-full max-w-2xl bg-[#090b10] border border-cyan-500/50 rounded-2xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(0,240,255,0.25)] font-mono text-xs my-8">
                  {/* Top Modal Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
                    <div>
                      <span className="text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
                        REGISTRATION DOSSIER • SUBMISSION DETAILS
                      </span>
                      <h3 className="text-xl font-bold text-white mt-0.5">
                        {selectedRegForAnswers.studentName}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-sans">
                        PRN: <span className="text-cyan-300 font-mono font-bold">{selectedRegForAnswers.prn}</span> • {selectedRegForAnswers.eventTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedRegForAnswers(null)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Delegate Summary Box */}
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Year of Study:</span>
                      <span className="text-white font-semibold">{selectedRegForAnswers.year}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Contact / WhatsApp:</span>
                      <span className="text-white font-semibold">{selectedRegForAnswers.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Registration Date:</span>
                      <span className="text-slate-300">{selectedRegForAnswers.registeredAt}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Current Status:</span>
                      <span className={`font-bold ${
                        selectedRegForAnswers.status === "verified" || selectedRegForAnswers.status === "approved"
                          ? "text-emerald-400"
                          : selectedRegForAnswers.status === "pending"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}>
                        {selectedRegForAnswers.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Files Section */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 mb-5">
                    <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wide block">
                      Uploaded Files &amp; Media Attachments
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Presentation / Media File */}
                      <div className="p-3 rounded-lg bg-black/60 border border-white/10 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">PROJECT MEDIA / PRESENTATION:</span>
                          {selectedRegForAnswers.submissionFileUrl ? (
                            <a
                              href={selectedRegForAnswers.submissionFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs mt-1 transition-all"
                            >
                              <span>📄 Open Presentation (PPT/PDF/Image) ↗</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs italic">No presentation file attached</span>
                          )}
                        </div>
                      </div>

                      {/* Payment Screenshot */}
                      <div className="p-3 rounded-lg bg-black/60 border border-white/10 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">PAYMENT SCREENSHOT PROOF:</span>
                          {selectedRegForAnswers.paymentScreenshotUrl ? (
                            <a
                              href={selectedRegForAnswers.paymentScreenshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-xs mt-1 transition-all"
                            >
                              <span>🧾 View Receipt Proof ↗</span>
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs italic">No screenshot attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Form Answers */}
                  <div className="space-y-2 mb-6">
                    <span className="text-[11px] font-bold text-white uppercase tracking-wide block">
                      Custom Form Field Responses
                    </span>

                    {selectedRegForAnswers.customAnswers && Object.keys(selectedRegForAnswers.customAnswers).length > 0 ? (
                      <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden divide-y divide-white/5">
                        {Object.entries(selectedRegForAnswers.customAnswers).map(([qTitle, answer], aIdx) => (
                          <div key={aIdx} className="p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <span className="text-slate-400 text-xs sm:w-1/3 shrink-0 font-medium">
                              {qTitle}:
                            </span>
                            <div className="sm:w-2/3 text-white text-xs break-words">
                              {typeof answer === "string" && (answer.startsWith("http://") || answer.startsWith("https://")) ? (
                                <a
                                  href={answer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-300 hover:text-cyan-200 underline inline-flex items-center gap-1"
                                >
                                  <span>Open Uploaded File ↗</span>
                                </a>
                              ) : (
                                <span>{String(answer || "N/A")}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-slate-500 text-xs">
                        No additional custom fields were required for this event.
                      </div>
                    )}
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setSelectedRegForAnswers(null)}
                      className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
                    >
                      Close Window
                    </button>

                    <div className="flex items-center gap-2">
                      {selectedRegForAnswers.status !== "verified" && selectedRegForAnswers.status !== "approved" ? (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateRegStatus(selectedRegForAnswers.id, "verified");
                            setSelectedRegForAnswers(null);
                          }}
                          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-1.5"
                        >
                          <span>✔</span>
                          <span>Verify Registration Now</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
                          <span>✔ Already Verified</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

              {/* =============================================================
                  GOOGLE FORMS-STYLE CUSTOM REGISTRATION FORM BUILDER
                  ============================================================= */}
              <div className="p-4 sm:p-5 rounded-2xl border border-cyan-500/30 bg-slate-950/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 uppercase">
                        DYNAMIC QUESTIONS BUILDER
                      </span>
                      <span className="text-[11px] font-bold text-white uppercase tracking-wide">
                        Google Forms-Style Custom Fields
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Configure custom questions for students registering for this event (Team Name, Abstract, PPT/PDF Upload, etc.).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomQuestion}
                    className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 hover:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-[0_0_12px_rgba(0,240,255,0.2)]"
                  >
                    <span>+</span>
                    <span>Add Custom Question</span>
                  </button>
                </div>

                {/* Question List */}
                {(!eventForm.customFormFields || eventForm.customFormFields.length === 0) ? (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-white/10 text-center text-slate-500 text-xs font-mono">
                    <p className="mb-1 text-slate-400">No custom questions added for this event yet.</p>
                    <p className="text-[10px] text-slate-500">
                      Standard collegiate fields (Full Name, PRN, Year, Contact Number, Project Media &amp; Payment Screenshot) are always included.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {eventForm.customFormFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-3.5 rounded-xl border border-white/15 bg-black/60 space-y-3 relative group"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/5">
                          <span className="text-[10px] font-mono font-bold text-cyan-400">
                            QUESTION #{index + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomQuestion(field.id)}
                            className="text-[10px] font-mono text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-950/40 hover:bg-red-950/80 border border-red-500/30 transition-colors cursor-pointer"
                          >
                            ✕ Remove Question
                          </button>
                        </div>

                        {/* Title and Field Type Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                              Question Title <span className="text-cyan-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Team Name, Abstract Title, PPT Upload..."
                              value={field.questionTitle}
                              onChange={(e) =>
                                handleUpdateCustomQuestion(field.id, { questionTitle: e.target.value })
                              }
                              className="w-full px-3 py-1.5 rounded-lg bg-black/70 border border-white/10 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 text-xs"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1 uppercase font-semibold">
                              Field Type <span className="text-cyan-400">*</span>
                            </label>
                            <select
                              value={field.fieldType}
                              onChange={(e) =>
                                handleUpdateCustomQuestion(field.id, {
                                  fieldType: e.target.value as CustomFieldType,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 text-xs cursor-pointer font-mono"
                            >
                              <option value="Short Text">Short Text</option>
                              <option value="Paragraph">Paragraph</option>
                              <option value="Dropdown Options">Dropdown Options</option>
                              <option value="File Upload (PPT/PDF/Image)">File Upload (PPT/PDF/Image)</option>
                            </select>
                          </div>
                        </div>

                        {/* Dropdown Options Input if selected */}
                        {field.fieldType === "Dropdown Options" && (
                          <div className="pt-1">
                            <label className="text-[10px] text-amber-300 block mb-1 font-semibold">
                              Dropdown Options (Comma-separated) <span className="text-amber-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Option 1, Option 2, Option 3..."
                              value={field.options || ""}
                              onChange={(e) =>
                                handleUpdateCustomQuestion(field.id, { options: e.target.value })
                              }
                              className="w-full px-3 py-1.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                            />
                            <span className="text-[9px] text-slate-400 mt-0.5 block">
                              Enter values separated by commas. Students will select one from this dropdown.
                            </span>
                          </div>
                        )}

                        {/* Required Checkbox Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                handleUpdateCustomQuestion(field.id, { required: e.target.checked })
                              }
                              className="w-3.5 h-3.5 rounded border-white/20 bg-black text-cyan-500 focus:ring-0 focus:outline-none cursor-pointer"
                            />
                            <span className="text-[11px] text-slate-300 font-mono">
                              Required Question
                            </span>
                          </label>

                          <span className="text-[10px] font-mono text-cyan-400/80">
                            {field.fieldType === "File Upload (PPT/PDF/Image)"
                              ? "Cloudinary /auto/upload"
                              : field.fieldType}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
