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
  limit,
  onSnapshot,
} from "firebase/firestore";
import { auth, googleProvider, db, isFirebaseConfigured } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import AuroraBackground from "@/components/AuroraBackground";
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
  imageUrl?: string;
  image?: string;
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
  bannerUrl?: string;
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
    upiId: "tesa@sggs",
    registrationFee: "₹150 / ₹250",
    paymentInstructions: "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.",
    acceptedPaymentApps: "GPay • PhonePe • Paytm • BHIM",
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

// No dummy registrations - clean slate for live student submissions
const INITIAL_REGISTRATIONS: Registration[] = [];

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
    paymentQrUrl: "",
    qrCodeUrl: "",
    upiId: "tesa@sggs",
    registrationFee: "₹150 / ₹250",
    paymentInstructions: "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.",
    acceptedPaymentApps: "GPay • PhonePe • Paytm • BHIM",
    summary: "",
    highlights: "",
    galleryUrls: [],
    customFormFields: [],
  });
  const eventFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const eventQrFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);

  // Dedicated Payment QR Code & UPI Gateway configuration for Event Registration tab
  const [registrationQrUrl, setRegistrationQrUrl] = useState<string>("");
  const [selectedQrEventId, setSelectedQrEventId] = useState<string>("all");
  const [isUploadingRegQr, setIsUploadingRegQr] = useState<boolean>(false);
  const regQrFileInputRef = useRef<HTMLInputElement>(null);

  // Customizable UPI ID & Payment text state for Gateway management card
  const [regUpiId, setRegUpiId] = useState<string>("tesa@sggs");
  const [regFee, setRegFee] = useState<string>("₹150 / ₹250");
  const [regInstructions, setRegInstructions] = useState<string>("Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.");
  const [regAcceptedApps, setRegAcceptedApps] = useState<string>("GPay • PhonePe • Paytm • BHIM");

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
      if (storedTeam !== null) {
        const parsed = JSON.parse(storedTeam);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasCore = parsed.some((m: any) =>
            (m.category || "").toLowerCase().includes("core") ||
            (m.role || "").toLowerCase().includes("president") ||
            (m.role || "").toLowerCase().includes("secretary")
          );
          const validatedTeam = hasCore
            ? parsed
            : [...parsed, ...INITIAL_TEAM.filter((m) => !parsed.some((p: any) => p.id === m.id))];
          setTeamList(validatedTeam);
        }
      } else {
        localStorage.setItem("tesa_team", JSON.stringify(INITIAL_TEAM));
      }

      const storedEvents = localStorage.getItem("tesa_events");
      if (storedEvents !== null) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed)) setEventsList(parsed);
      } else {
        localStorage.setItem("tesa_events", JSON.stringify(INITIAL_EVENTS));
      }

      const storedRegs = localStorage.getItem("tesa_registrations");
      if (storedRegs) {
        try {
          const parsed = JSON.parse(storedRegs);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Strip any dummy / mock registrations
            const cleanRegs = parsed.filter(
              (r: any) =>
                r.id !== "reg-1" &&
                r.id !== "reg-2" &&
                r.id !== "reg-3" &&
                r.studentName !== "Aditya Deshmukh" &&
                r.studentName !== "Priyanka Joshi" &&
                r.studentName !== "Kunal Shinde"
            );
            setRegistrations(cleanRegs);
            localStorage.setItem("tesa_registrations", JSON.stringify(cleanRegs));
          } else {
            setRegistrations([]);
          }
        } catch {
          setRegistrations([]);
        }
      } else {
        localStorage.setItem("tesa_registrations", JSON.stringify([]));
        setRegistrations([]);
      }

      const storedQr = localStorage.getItem("tesa_payment_qr");
      if (storedQr) {
        setRegistrationQrUrl(storedQr);
      } else {
        const defaultQr = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=tesa@sggs%26pn=TESA%20SGGSIET%26cu=INR";
        setRegistrationQrUrl(defaultQr);
      }

      const storedUpi = localStorage.getItem("tesa_payment_upi");
      if (storedUpi) setRegUpiId(storedUpi);
      const storedFee = localStorage.getItem("tesa_payment_fee");
      if (storedFee) setRegFee(storedFee);
      const storedInst = localStorage.getItem("tesa_payment_instructions");
      if (storedInst) setRegInstructions(storedInst);
      const storedApps = localStorage.getItem("tesa_payment_apps");
      if (storedApps) setRegAcceptedApps(storedApps);
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

  // Real-time synchronization with Firestore ('events', 'team_members', 'event_registrations')
  useEffect(() => {
    if (!isFirebaseConfigured) return;

    // 1. Live Events Listener (collection: 'events')
    // CRITICAL: Fetch root collection and sort in JS; do NOT use .orderBy('createdAt') in query()
    const unsubEvents = onSnapshot(
      collection(db, "events"),
      (snapshot) => {
        const remoteEvents: EventItem[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const cover = data.bannerUrl || data.imageUrl || data.image || data.mediaUrl || "";
          const gallery = Array.isArray(data.galleryUrls)
            ? data.galleryUrls
            : Array.isArray(data.gallery)
            ? data.gallery
            : [];
          remoteEvents.push({
            ...(data as EventItem),
            id: d.id,
            mediaUrl: cover,
            bannerUrl: cover,
            imageUrl: cover,
            image: cover,
            galleryUrls: gallery,
            gallery: gallery,
            customFormFields: data.customFormFields || [],
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
        try { localStorage.setItem("tesa_events", JSON.stringify(remoteEvents)); } catch {}
        setFirestoreStatus("connected");
      },
      (err) => {
        console.warn("Live events listener error:", err);
      }
    );

    // 2. Live Team Members Listener (collection: 'team_members')
    const unsubTeam = onSnapshot(
      collection(db, "team_members"),
      async (snapshot) => {
        if (snapshot.empty) {
          // Check if legacy 'team' collection has docs to migrate
          try {
            const legacySnap = await getDocs(collection(db, "team"));
            if (!legacySnap.empty) {
              console.log("Migrating legacy team documents to team_members...");
              const migrated: TeamMember[] = [];
              for (const docSnap of legacySnap.docs) {
                const data = docSnap.data();
                await setDoc(doc(db, "team_members", docSnap.id), data, { merge: true });
                migrated.push({ ...(data as TeamMember), id: docSnap.id });
              }
              setTeamList(migrated);
              return;
            }
          } catch {}
          setTeamList([]);
          return;
        }

        const remoteTeam: TeamMember[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          const photo = data.photoUrl || data.imageUrl || data.image || data.photoPlaceholder || "";
          remoteTeam.push({
            ...(data as TeamMember),
            id: d.id,
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

        setTeamList(remoteTeam);
        try { localStorage.setItem("tesa_team", JSON.stringify(remoteTeam)); } catch {}
      },
      (err) => {
        console.warn("Live team_members listener error:", err);
      }
    );

    // 3. Live Registrations Listener (collection: 'event_registrations')
    const unsubRegs = onSnapshot(
      collection(db, "event_registrations"),
      (snapshot) => {
        const itemsRegs: Registration[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          itemsRegs.push({
            id: d.id,
            studentName: data.fullName || data.studentName || "Student",
            prn: data.prn || "N/A",
            email: data.contactNumber || data.email || "",
            department: "Textile Technology",
            year: data.year || "B.Tech",
            eventTitle: data.eventTitle || "Conclave",
            eventId: data.eventId,
            registeredAt: data.registeredAt ? data.registeredAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            status: data.status || (data.verified ? "verified" : "pending"),
            paymentScreenshotUrl: data.paymentScreenshotUrl,
            submissionFileUrl: data.submissionFileUrl,
            bannerUrl: data.bannerUrl || data.posterUrl || "",
            customAnswers: data.customAnswers || {},
          });
        });

        const cleanItemsRegs = itemsRegs.filter(
          (r) =>
            r.id !== "reg-1" &&
            r.id !== "reg-2" &&
            r.id !== "reg-3" &&
            r.studentName !== "Aditya Deshmukh" &&
            r.studentName !== "Priyanka Joshi" &&
            r.studentName !== "Kunal Shinde"
        );
        setRegistrations(cleanItemsRegs);
        try { localStorage.setItem("tesa_registrations", JSON.stringify(cleanItemsRegs)); } catch {}
      },
      (err) => {
        console.warn("Live event_registrations listener error:", err);
      }
    );

    return () => {
      unsubEvents();
      unsubTeam();
      unsubRegs();
    };
  }, []);

  const syncFromFirestore = async () => {
    if (!isFirebaseConfigured) {
      setFirestoreStatus("missing_env");
      return;
    }
    try {
      // 1. Team sync (read from 'team_members', fallback to 'team')
      let itemsTeam: TeamMember[] = [];
      const teamSnap = await getDocs(collection(db, "team_members"));
      if (!teamSnap.empty) {
        teamSnap.forEach((d) => {
          const data = d.data();
          const photo = data.photoUrl || data.imageUrl || data.image || data.photoPlaceholder || "";
          itemsTeam.push({ ...(data as TeamMember), id: d.id, photoUrl: photo, imageUrl: photo, image: photo });
        });
      } else {
        const legacySnap = await getDocs(collection(db, "team"));
        legacySnap.forEach((d) => {
          const data = d.data();
          itemsTeam.push({ ...(data as TeamMember), id: d.id });
        });
      }
      setTeamList(itemsTeam);
      localStorage.setItem("tesa_team", JSON.stringify(itemsTeam));

      // 2. Events sync (read from 'events')
      const evSnap = await getDocs(collection(db, "events"));
      const itemsEvents: EventItem[] = [];
      evSnap.forEach((d) => {
        const data = d.data();
        const cover = data.bannerUrl || data.imageUrl || data.image || data.mediaUrl || "";
        const gallery = Array.isArray(data.galleryUrls) ? data.galleryUrls : Array.isArray(data.gallery) ? data.gallery : [];
        itemsEvents.push({
          ...(data as EventItem),
          id: d.id,
          mediaUrl: cover,
          bannerUrl: cover,
          imageUrl: cover,
          image: cover,
          galleryUrls: gallery,
          gallery: gallery,
          customFormFields: data.customFormFields || [],
        });
      });
      itemsEvents.sort((a: any, b: any) => {
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
      setEventsList(itemsEvents);
      localStorage.setItem("tesa_events", JSON.stringify(itemsEvents));

      // 3. Registrations sync ('event_registrations')
      const itemsRegs: Registration[] = [];
      const evRegSnap = await getDocs(collection(db, "event_registrations"));
      evRegSnap.forEach((d) => {
        const data = d.data();
        itemsRegs.push({
          id: d.id,
          studentName: data.fullName || data.studentName || "Student",
          prn: data.prn || "N/A",
          email: data.contactNumber || data.email || "",
          department: "Textile Technology",
          year: data.year || "B.Tech",
          eventTitle: data.eventTitle || "Conclave",
          eventId: data.eventId,
          registeredAt: data.registeredAt ? data.registeredAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          status: data.status || (data.verified ? "verified" : "pending"),
          paymentScreenshotUrl: data.paymentScreenshotUrl,
          submissionFileUrl: data.submissionFileUrl,
          bannerUrl: data.bannerUrl || data.posterUrl || "",
          customAnswers: data.customAnswers || {},
        });
      });

      const cleanItemsRegs = itemsRegs.filter(
        (r) =>
          r.id !== "reg-1" &&
          r.id !== "reg-2" &&
          r.id !== "reg-3" &&
          r.studentName !== "Aditya Deshmukh" &&
          r.studentName !== "Priyanka Joshi" &&
          r.studentName !== "Kunal Shinde"
      );
      setRegistrations(cleanItemsRegs);
      localStorage.setItem("tesa_registrations", JSON.stringify(cleanItemsRegs));

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

  const handleSeedDefaultData = async () => {
    if (!isFirebaseConfigured) {
      showToast("Cannot seed data: Firebase is not configured.", "error");
      return;
    }
    if (!confirm("Seed default TESA Events and Council Members into Firestore collections 'events' and 'team_members'? This will create permanent documents.")) return;

    try {
      showToast("Seeding events and team to Firestore...", "info");
      for (const ev of INITIAL_EVENTS) {
        await setDoc(doc(db, "events", ev.id), {
          ...ev,
          bannerUrl: ev.mediaUrl,
          imageUrl: ev.mediaUrl,
          image: ev.mediaUrl,
          galleryUrls: ev.galleryUrls || (ev.mediaUrl ? [ev.mediaUrl] : []),
          gallery: ev.galleryUrls || (ev.mediaUrl ? [ev.mediaUrl] : []),
          customFormFields: ev.customFormFields || [],
          createdAt: serverTimestamp(),
          authorEmail: user?.email || "admin",
        }, { merge: true });
      }

      for (const member of INITIAL_TEAM) {
        await setDoc(doc(db, "team_members", member.id), {
          ...member,
          photoUrl: member.photoUrl,
          imageUrl: member.photoUrl,
          image: member.photoUrl,
          createdAt: serverTimestamp(),
          addedBy: user?.email || "admin",
        }, { merge: true });
      }

      showToast("Successfully seeded real documents to Firestore! Both portals synchronized.", "success");
    } catch (err: any) {
      console.error("Seed error:", err);
      showToast("Seed error: " + (err?.message || "Check Firestore rules"), "error");
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

    const photo = teamForm.photoUrl || (teamForm as any).imageUrl || (teamForm as any).image || "";
    const payload: TeamMember = {
      ...teamForm,
      photoUrl: photo,
      imageUrl: photo,
      image: photo,
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
        await setDoc(doc(db, "team_members", editingTeamMember.id), payload, { merge: true });
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
        const docRef = await addDoc(collection(db, "team_members"), {
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
      await deleteDoc(doc(db, "team_members", id));
      try {
        await deleteDoc(doc(db, "team", id));
      } catch {}
    } catch (e) {}

    showToast(`Removed council member ${name}.`);
  };

  const isMatchAdminCategory = (m: TeamMember, cat: string) => {
    if (cat === "all") return true;
    const memberCat = (m.category || "").toLowerCase().trim();
    const filterCat = cat.toLowerCase().trim();
    if (memberCat === filterCat) return true;
    if (filterCat === "core") {
      const role = (m.role || "").toLowerCase();
      const designation = (m.designation || "").toLowerCase();
      return (
        memberCat.includes("core") ||
        memberCat.includes("council") ||
        role.includes("president") ||
        role.includes("secretary") ||
        role.includes("treasurer") ||
        designation.includes("council") ||
        designation.includes("executive")
      );
    }
    if (filterCat === "technical") {
      const role = (m.role || "").toLowerCase();
      return memberCat.includes("tech") || memberCat.includes("research") || role.includes("tech");
    }
    if (filterCat === "events") {
      const role = (m.role || "").toLowerCase();
      return memberCat.includes("event") || memberCat.includes("hack") || role.includes("event");
    }
    if (filterCat === "outreach") {
      const role = (m.role || "").toLowerCase();
      return memberCat.includes("outreach") || memberCat.includes("pr") || memberCat.includes("media") || memberCat.includes("alumni") || role.includes("outreach");
    }
    return false;
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
      paymentQrUrl: registrationQrUrl || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=tesa@sggs%26pn=TESA%20SGGSIET%26cu=INR",
      qrCodeUrl: registrationQrUrl || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=tesa@sggs%26pn=TESA%20SGGSIET%26cu=INR",
      upiId: regUpiId || "tesa@sggs",
      registrationFee: regFee || "₹150 / ₹250",
      paymentInstructions: regInstructions || "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.",
      acceptedPaymentApps: regAcceptedApps || "GPay • PhonePe • Paytm • BHIM",
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
    const resolvedQr = ev.paymentQrUrl || ev.qrCodeUrl || registrationQrUrl || "";
    const cover = ev.bannerUrl || ev.imageUrl || ev.image || ev.mediaUrl || "";
    const gallery = (ev.galleryUrls && ev.galleryUrls.length > 0) ? ev.galleryUrls : (ev.gallery || []);
    setEventForm({
      ...ev,
      mediaUrl: cover,
      bannerUrl: cover,
      imageUrl: cover,
      image: cover,
      eventStatus: resolvedStatus,
      paymentQrUrl: resolvedQr,
      qrCodeUrl: resolvedQr,
      upiId: ev.upiId || regUpiId || "tesa@sggs",
      registrationFee: ev.registrationFee || regFee || "₹150 / ₹250",
      paymentInstructions: ev.paymentInstructions || regInstructions || "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.",
      acceptedPaymentApps: ev.acceptedPaymentApps || regAcceptedApps || "GPay • PhonePe • Paytm • BHIM",
      galleryUrls: gallery,
      gallery: gallery,
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
    // If setting to File Upload (PPT/PDF/Image), media is always kept optional per requirement
    if (updates.fieldType === "File Upload (PPT/PDF/Image)") {
      updates.required = false;
    }
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
      setEventForm((prev) => ({
        ...prev,
        mediaUrl: url,
        bannerUrl: url,
        imageUrl: url,
        image: url,
      }));
      showToast("Event banner uploaded to Cloudinary successfully!");
    } catch (err: any) {
      console.error("Cloudinary event banner upload error:", err);
      showToast(err?.message || "Failed to upload banner to Cloudinary.", "error");
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleEventQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("Payment QR Code image exceeds 8MB. Please choose a smaller image.", "error");
      return;
    }

    try {
      setIsUploadingQr(true);
      showToast("Uploading Payment QR Code to Cloudinary...", "info");
      const url = await uploadToCloudinary(file);
      setEventForm((prev) => ({ ...prev, paymentQrUrl: url, qrCodeUrl: url }));
      showToast("Payment QR Code uploaded to Cloudinary successfully!");
    } catch (err: any) {
      console.error("Cloudinary QR upload error:", err);
      showToast(err?.message || "Failed to upload Payment QR to Cloudinary.", "error");
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleRegQrFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("Payment QR Code image exceeds 8MB. Please choose a smaller image.", "error");
      return;
    }

    try {
      setIsUploadingRegQr(true);
      showToast("Uploading Payment QR Code to Cloudinary...", "info");
      const url = await uploadToCloudinary(file);
      setRegistrationQrUrl(url);
      localStorage.setItem("tesa_payment_qr", url);

      if (selectedQrEventId === "all") {
        const updated = eventsList.map((ev) => ({
          ...ev,
          paymentQrUrl: url,
          qrCodeUrl: url,
        }));
        setEventsList(updated);
        localStorage.setItem("tesa_events", JSON.stringify(updated));
        for (const ev of updated) {
          try {
            await setDoc(doc(db, "events", ev.id), { paymentQrUrl: url, qrCodeUrl: url }, { merge: true });
          } catch {}
        }
        showToast("Payment QR Code updated for all events successfully!");
      } else {
        const updated = eventsList.map((ev) =>
          ev.id === selectedQrEventId ? { ...ev, paymentQrUrl: url, qrCodeUrl: url } : ev
        );
        setEventsList(updated);
        localStorage.setItem("tesa_events", JSON.stringify(updated));
        try {
          await setDoc(doc(db, "events", selectedQrEventId), { paymentQrUrl: url, qrCodeUrl: url }, { merge: true });
        } catch {}
        showToast("Payment QR Code updated for selected event successfully!");
      }
    } catch (err: any) {
      console.error("Cloudinary QR upload error:", err);
      showToast(err?.message || "Failed to upload Payment QR to Cloudinary.", "error");
    } finally {
      setIsUploadingRegQr(false);
    }
  };

  const handleSaveRegQrUrl = async () => {
    const paymentUpdates = {
      paymentQrUrl: registrationQrUrl.trim(),
      qrCodeUrl: registrationQrUrl.trim(),
      upiId: regUpiId.trim() || "tesa@sggs",
      registrationFee: regFee.trim() || "₹150 / ₹250",
      paymentInstructions: regInstructions.trim() || "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.",
      acceptedPaymentApps: regAcceptedApps.trim() || "GPay • PhonePe • Paytm • BHIM",
    };

    localStorage.setItem("tesa_payment_qr", paymentUpdates.paymentQrUrl);
    localStorage.setItem("tesa_payment_upi", paymentUpdates.upiId);
    localStorage.setItem("tesa_payment_fee", paymentUpdates.registrationFee);
    localStorage.setItem("tesa_payment_instructions", paymentUpdates.paymentInstructions);
    localStorage.setItem("tesa_payment_apps", paymentUpdates.acceptedPaymentApps);

    if (selectedQrEventId === "all") {
      const updated = eventsList.map((ev) => ({
        ...ev,
        ...paymentUpdates,
      }));
      setEventsList(updated);
      localStorage.setItem("tesa_events", JSON.stringify(updated));
      for (const ev of updated) {
        try {
          await setDoc(doc(db, "events", ev.id), paymentUpdates, { merge: true });
        } catch {}
      }
      showToast("UPI ID, Fee & Payment settings updated for ALL events!");
    } else {
      const updated = eventsList.map((ev) =>
        ev.id === selectedQrEventId ? { ...ev, ...paymentUpdates } : ev
      );
      setEventsList(updated);
      localStorage.setItem("tesa_events", JSON.stringify(updated));
      try {
        await setDoc(doc(db, "events", selectedQrEventId), paymentUpdates, { merge: true });
      } catch {}
      showToast("UPI ID, Fee & Payment settings updated for selected event!");
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

      const finalCover = eventForm.bannerUrl || eventForm.imageUrl || eventForm.image || eventForm.mediaUrl || "";
      if (!finalCover) {
        showToast("Event Banner is required (*). Please upload a banner image or provide an image URL.", "error");
        setIsSubmittingEvent(false);
        return;
      }

      const isConcluded = (eventForm.eventStatus || "").toLowerCase() === "concluded" || (eventForm.status || "").toLowerCase() === "closed";
      const resolvedEventStatus: "Upcoming" | "Concluded" = isConcluded ? "Concluded" : "Upcoming";
      const mappedStatus: "open" | "upcoming" | "closed" = isConcluded
        ? "closed"
        : eventForm.status === "closed"
        ? "upcoming"
        : eventForm.status || "upcoming";

      const resolvedQr = eventForm.paymentQrUrl || eventForm.qrCodeUrl || registrationQrUrl || "";
      if (resolvedEventStatus === "Upcoming" && !resolvedQr) {
        showToast("Payment QR Code is required for Upcoming events (*). Please upload or provide a QR code.", "error");
        setIsSubmittingEvent(false);
        return;
      }

      const eventPayload: EventItem = {
        ...eventForm,
        eventStatus: resolvedEventStatus,
        status: mappedStatus,
        mediaUrl: finalCover,
        bannerUrl: finalCover,
        imageUrl: finalCover,
        image: finalCover,
        paymentQrUrl: resolvedQr,
        qrCodeUrl: resolvedQr,
        galleryUrls: finalGalleryUrls,
        gallery: finalGalleryUrls,
        customFormFields: eventForm.customFormFields || [],
      };

      if (editingEventId) {
        const updatedEvents = eventsList.map((ev) =>
          ev.id === editingEventId ? { ...eventPayload, id: editingEventId } : ev
        );
        setEventsList(updatedEvents);
        localStorage.setItem("tesa_events", JSON.stringify(updatedEvents));

        try {
          await updateDoc(doc(db, "events", editingEventId), {
            ...eventPayload,
            updatedAt: serverTimestamp(),
            updatedBy: user?.email || "admin",
          });
        } catch {
          await setDoc(
            doc(db, "events", editingEventId),
            {
              ...eventPayload,
              updatedAt: serverTimestamp(),
              updatedBy: user?.email || "admin",
            },
            { merge: true }
          );
        }

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
    const isVerified = newStatus === "verified" || newStatus === "approved";
    const updated = registrations.map((r) =>
      r.id === regId ? { ...r, status: newStatus } : r
    );
    setRegistrations(updated);
    localStorage.setItem("tesa_registrations", JSON.stringify(updated));

    try {
      await updateDoc(doc(db, "event_registrations", regId), {
        status: newStatus,
        verified: isVerified,
      });
    } catch {
      try {
        await updateDoc(doc(db, "registrations", regId), {
          status: newStatus,
          verified: isVerified,
        });
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

  const handleClearDummyRegistrations = async () => {
    const cleanList = registrations.filter(
      (r) =>
        r.id !== "reg-1" &&
        r.id !== "reg-2" &&
        r.id !== "reg-3" &&
        r.studentName !== "Aditya Deshmukh" &&
        r.studentName !== "Priyanka Joshi" &&
        r.studentName !== "Kunal Shinde"
    );
    setRegistrations(cleanList);
    try {
      localStorage.setItem("tesa_registrations", JSON.stringify(cleanList));
      localStorage.removeItem("tesa_event_registrations");
    } catch {}

    const dummyIds = ["reg-1", "reg-2", "reg-3"];
    for (const dId of dummyIds) {
      try {
        await deleteDoc(doc(db, "event_registrations", dId));
      } catch {}
      try {
        await deleteDoc(doc(db, "registrations", dId));
      } catch {}
    }
    showToast("All dummy and mock registrations cleared.", "success");
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
      "Uploaded Poster / Banner URL": r.bannerUrl || "N/A",
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
      <div className="min-h-screen bg-[#050508] text-zinc-100 flex items-center justify-center p-4 relative">
        <AuroraBackground />
        <div className="relative z-10 flex flex-col items-center gap-3 font-mono text-xs text-purple-300 p-8 rounded-3xl bg-[#0b0c10]/90 backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <div className="w-8 h-8 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
          <span>INITIALIZING TESA ADMIN CONSOLE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col justify-between relative overflow-hidden">
        {/* Top Connection Checker Banner */}
        {renderConnectionBanner()}

        {/* Ambient Aurora Light Orbs Background */}
        <AuroraBackground />

        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
          <div className="glass-modal-panel group relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl text-center overflow-hidden">
            {/* Top-Right Ambient Glow */}
            <div className="bento-glow" />

            <div className="relative z-10">
              <div className="relative w-20 h-20 rounded-full border border-white/40 p-1 overflow-hidden bg-white mx-auto mb-6 shadow-[0_0_35px_rgba(168,85,247,0.45)]">
                <Image
                  src="/tesa-logo.png"
                  alt="TESA Official Emblem"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover rounded-full"
                  priority
                />
              </div>
              <h1 className="text-xl font-mono font-bold text-white mb-2 uppercase tracking-wider">
                TESA Administrative Access
              </h1>
              <p className="text-xs text-zinc-400 font-mono mb-6 leading-relaxed">
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
                className="w-full py-3.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-zinc-200 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
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
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DASHBOARD MAIN UI
  // --------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden w-full max-w-full relative">
      {/* Top Connection Checker Banner */}
      {renderConnectionBanner()}

      {/* Ambient Aurora Light Orbs Background */}
      <AuroraBackground />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#050508]/85 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="min-h-[38px] px-2.5 sm:px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-purple-500/40 text-[11px] sm:text-xs font-mono text-zinc-300 hover:text-purple-300 transition-colors flex items-center gap-1.5 cursor-pointer backdrop-blur-xl shrink-0"
            >
              <span>←</span>
              <span className="hidden sm:inline">Public Website</span>
              <span className="sm:hidden">Site</span>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/40 p-[1.5px] overflow-hidden bg-white shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <Image
                  src="/tesa-logo.png"
                  alt="TESA Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover rounded-full"
                  priority
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                    TESA CONTROL
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    STUDIO
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              {user.photoURL && (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "Admin"}
                  width={24}
                  height={24}
                  unoptimized
                  className="w-6 h-6 rounded-md border border-purple-400/40 object-cover"
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
                className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-red-950/40 hover:border-red-500/40 hover:text-red-300 text-xs font-mono transition-colors cursor-pointer"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full space-y-8 sm:space-y-12">
        {/* Navigation Tabs Bar: Team is #1 */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {[
              { id: "team", label: "TEAM", fullLabel: "MANAGE TESA TEAM", icon: "👥", count: teamList.length },
              { id: "events", label: "EVENTS", fullLabel: "MANAGE EVENTS", icon: "📅", count: eventsList.length },
              { id: "registrations", label: "REGISTRATIONS", fullLabel: "MANAGE REGISTRATIONS", icon: "📋", count: registrations.length },
              { id: "all", label: "ALL", fullLabel: "STACKED VIEW", icon: "🌟", count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[11px] sm:text-xs font-mono font-semibold tracking-wide border transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white border-white/20 shadow-[0_0_20px_rgba(139,92,246,0.4)] font-bold"
                    : "bg-white/[0.03] text-zinc-300 border-white/10 hover:border-purple-500/40 hover:text-white"
                }`}
              >
                <span>{tab.icon}</span>
                <span className="sm:hidden">{tab.label}</span>
                <span className="hidden sm:inline">{tab.fullLabel}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] ${
                    activeTab === tab.id ? "bg-black/40 text-white font-extrabold" : "bg-white/10 text-purple-300"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-zinc-400 flex flex-wrap items-center gap-2">
            <span>DATA ENGINE:</span>
            {firestoreStatus === "connected" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                FIRESTORE LIVE
              </span>
            ) : firestoreStatus === "missing_env" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/70 text-red-300 border border-red-500/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                DATABASE DISCONNECTED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                LOCAL STORE RESILIENT
              </span>
            )}

            <button
              onClick={handleSeedDefaultData}
              className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 hover:text-white border border-purple-500/40 text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Seed default TESA Events & Council Members into Firestore ('events' & 'team_members')"
            >
              <span>🌱 Seed Default Data</span>
            </button>
          </div>
        </div>

        {/* Global Toast */}
        {toastMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-mono border backdrop-blur-xl transition-all shadow-xl ${
              toastMessage.type === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-200"
                : toastMessage.type === "info"
                ? "bg-purple-950/80 border-purple-500/40 text-purple-200"
                : "bg-red-950/80 border-red-500/40 text-red-200"
            }`}
          >
            {toastMessage.type === "success" ? "✔" : toastMessage.type === "info" ? "ℹ" : "⚠"} {toastMessage.text}
          </div>
        )}

        {/* =====================================================================
            SECTION 1 — MANAGE TESA COUNCIL TEAM (POSITION #1 AT TOP)
            ===================================================================== */}
        {(activeTab === "team" || activeTab === "all") && (
          <section id="section-team" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl glass-card">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-[11px] font-mono text-purple-300 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>STUDIO DIRECTORY • POSITION #1</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Manage TESA Council Team
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Upload portrait photos, update leadership roles, technical specializations, and manage the student council displayed on the homepage.
                </p>
              </div>

              <button
                onClick={handleOpenAddTeamModal}
                className="glow-button-primary px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span className="text-sm">+</span>
                <span>Add Council Member</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "all", label: "All Members" },
                { id: "core", label: "Core Council" },
                { id: "technical", label: "Technical & Research" },
                { id: "events", label: "Events & Operations" },
                { id: "outreach", label: "Outreach & Alumni" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTeamCategoryFilter(c.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    teamCategoryFilter === c.id
                      ? "bg-white text-zinc-950 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      : "bg-white/[0.04] text-zinc-400 border border-white/[0.07] hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Team Members Grid: Bento Cards with Hover Spotlight Glow */}
            {teamList.filter((m) => isMatchAdminCategory(m, teamCategoryFilter)).length === 0 ? (
              <div className="py-14 px-6 text-center rounded-3xl border border-white/10 bg-[#0b0c10]/70 backdrop-blur-xl shadow-2xl max-w-xl mx-auto">
                <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl text-purple-300">
                  👥
                </div>
                <h3 className="text-lg font-mono font-bold text-white mb-1.5">
                  No Members Found in this Category
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md mx-auto mb-5">
                  There are currently no council members assigned to this category.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setTeamCategoryFilter("all")}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    View All ({teamList.length})
                  </button>
                  <button
                    onClick={handleOpenAddTeamModal}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
                  >
                    + Add Member
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {teamList
                  .filter((m) => isMatchAdminCategory(m, teamCategoryFilter))
                  .map((member) => (
                  <div
                    key={member.id}
                    className="bento-card group rounded-3xl p-5 flex flex-col justify-between hover:border-purple-500/40 hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden"
                  >
                    {/* Hover Radial Spotlight Glow */}
                    <div className="bento-glow" />

                    <div>
                      {/* Portrait Frame */}
                      <div className="relative w-full h-52 mb-4 rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden group-hover:border-purple-500/40 transition-all duration-500 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                        {member.photoUrl ? (
                          <div className="relative w-full h-full">
                            <Image
                              src={member.photoUrl}
                              alt={member.name}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                              className="object-cover contrast-105 group-hover:scale-105 transition-all duration-700 ease-out"
                            />
                            {/* Dark Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
                          </div>
                        ) : (
                          <div className="relative w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-purple-950/30 flex flex-col items-center justify-center p-4 text-center">
                            <div className="w-14 h-14 rounded-2xl border border-purple-500/30 bg-purple-950/40 flex items-center justify-center font-mono text-xl font-bold text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.2)] mb-2">
                              {member.photoPlaceholder || "TE"}
                            </div>
                            <span className="text-[10px] tracking-wider text-zinc-500 uppercase">
                              PORTRAIT ARCHIVE
                            </span>
                          </div>
                        )}

                        {/* Category & Year Tag Overlays */}
                        <span className="absolute top-2.5 left-2.5 z-10 text-[10px] px-2.5 py-0.5 rounded-full bg-zinc-950/80 text-violet-300 border border-violet-500/30 backdrop-blur-md uppercase font-medium">
                          {member.category}
                        </span>
                        <span className="absolute bottom-2.5 right-2.5 z-10 text-[10px] px-2.5 py-0.5 rounded-full bg-black/80 text-zinc-300 border border-white/10 backdrop-blur-md">
                          {member.year}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-0.5 group-hover:text-purple-300 transition-colors">
                        {member.name}
                      </h3>
                      <div className="text-xs text-purple-400 font-medium mb-0.5">
                        {member.role}
                      </div>
                      <div className="text-[11px] text-zinc-400 mb-2 truncate">
                        {member.designation}
                      </div>

                      <p className="text-xs text-zinc-300 font-normal mb-3 line-clamp-2">
                        {member.bio}
                      </p>

                      <div className="text-xs text-violet-300/90 mb-3 truncate flex items-center gap-1.5">
                        <span>⚡</span>
                        <span>{member.specialization}</span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {member.skills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] text-zinc-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditTeamModal(member)}
                        className="glass-button-secondary flex-1 py-2 rounded-xl text-xs text-zinc-300 hover:text-white border border-white/10 hover:border-purple-500/40 transition-colors cursor-pointer text-center"
                      >
                        ✏ Edit Details &amp; Photo
                      </button>
                      <button
                        onClick={() => handleDeleteTeamMember(member.id, member.name)}
                        className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-400 transition-colors cursor-pointer"
                        title="Delete member"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION DIVIDER: TEAM -> EVENTS */}
        {(activeTab === "all" || activeTab === "team" || activeTab === "events") && (
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />
        )}

        {/* =====================================================================
            SECTION 2 — MANAGE EVENTS (DIRECTLY BELOW TEAM)
            ===================================================================== */}
        {(activeTab === "events" || activeTab === "all") && (
          <section id="section-events" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl glass-card">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-[11px] font-mono text-purple-300 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  <span>EVENT OPERATIONS • POSITION #2</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Manage Events &amp; Conclaves
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Publish and organize national symposiums, hackathons, and workshops displayed on the public events feed.
                </p>
              </div>

              <button
                onClick={handleOpenAddEventModal}
                className="glow-button-primary px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold text-xs tracking-wide transition-all shadow-[0_0_25px_rgba(139,92,246,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span className="text-sm">+</span>
                <span>Publish New Event</span>
              </button>
            </div>

            {/* Events Cards Grid: Dark Bento Cards */}
            {eventsList.length === 0 ? (
              <div className="py-14 px-6 text-center rounded-3xl border border-white/10 bg-[#0b0c10]/70 backdrop-blur-xl shadow-2xl max-w-xl mx-auto">
                <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-2xl text-purple-300">
                  📅
                </div>
                <h3 className="text-lg font-mono font-bold text-white mb-1.5">
                  No Events in Archive
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-sans max-w-md mx-auto mb-5">
                  There are currently no events published to Firestore. You can publish a new event or seed default events below.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleOpenAddEventModal}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer"
                  >
                    + Publish New Event
                  </button>
                  <button
                    onClick={handleSeedDefaultData}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                  >
                    🌱 Seed Default Events
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventsList.map((ev) => (
                <div
                  key={ev.id}
                  className="bento-card group rounded-3xl overflow-hidden flex flex-col justify-between hover:border-purple-500/40 transition-all hover:-translate-y-1.5 duration-300 relative"
                >
                  {/* Hover Radial Spotlight Glow */}
                  <div className="bento-glow" />

                  <div>
                    {ev.mediaUrl ? (
                      <div className="h-44 w-full overflow-hidden relative">
                        <Image
                          src={ev.mediaUrl}
                          alt={ev.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-black/30 to-transparent pointer-events-none" />
                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 text-[10px] font-medium text-purple-300 border border-purple-500/30 backdrop-blur-md">
                          {ev.category}
                        </span>
                      </div>
                    ) : (
                      <div className="h-32 w-full bg-purple-950/20 border-b border-white/[0.08] flex items-center justify-center text-xs font-mono text-purple-400">
                        NO BANNER ATTACHED
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full ${
                            ev.status === "open"
                              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                              : ev.status === "upcoming"
                              ? "text-amber-400 bg-amber-500/10 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                              : "text-zinc-400 bg-zinc-800/60 border border-white/10"
                          }`}
                        >
                          ● {ev.status}
                        </span>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          Capacity: {ev.capacity || "Unlimited"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {ev.title}
                      </h3>

                      <p className="text-xs text-zinc-400 line-clamp-3 mb-4 leading-relaxed font-normal">
                        {ev.summary}
                      </p>

                      <div className="space-y-1.5 text-xs text-zinc-400 border-t border-white/[0.08] pt-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">📅</span>
                          <span className="text-zinc-200">{ev.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-500">📍</span>
                          <span className="text-zinc-200">{ev.venue}</span>
                        </div>
                        {ev.deadline && (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-400/80">⏳</span>
                            <span className="text-zinc-300">Deadline: <span className="text-amber-300 font-medium">{ev.deadline}</span></span>
                          </div>
                        )}
                        {ev.highlights && (
                          <div className="flex items-center gap-2 text-violet-300">
                            <span>🏆</span>
                            <span className="truncate">{ev.highlights}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEditEventModal(ev)}
                      className="glass-button-secondary flex-1 py-2 px-3 rounded-xl border border-white/10 hover:border-purple-500/40 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer text-center"
                    >
                      ✏ Edit Details &amp; Banner
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(ev.id, ev.title)}
                      className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs text-red-400 transition-colors cursor-pointer"
                      title="Delete event"
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        )}

        {/* SECTION DIVIDER: EVENTS -> REGISTRATIONS */}
        {(activeTab === "all" || activeTab === "events" || activeTab === "registrations") && (
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-10" />
        )}

        {/* =====================================================================
            SECTION 3: MANAGE REGISTRATIONS & VERIFY
            ===================================================================== */}
        {(activeTab === "registrations" || activeTab === "all") && (
          <section id="section-registrations" className="space-y-6 pt-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl glass-card">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-[11px] font-mono text-emerald-300 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>DELEGATE VERIFICATION &amp; EXPORT</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Manage Registrations &amp; Verify
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Inspect student submissions, open uploaded presentations (PPT/PDF/Image) &amp; payment receipts via Cloudinary, review custom Google Forms-style answers, and verify registrations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleExportToExcel}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] flex items-center gap-2 cursor-pointer"
                >
                  <span>📊</span>
                  <span>Export to Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar: Dark Bento Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bento-card p-4 rounded-2xl relative overflow-hidden group">
                <span className="text-[11px] text-zinc-400 block uppercase tracking-wider mb-1">Total Submissions</span>
                <span className="text-2xl font-bold text-white">{registrations.length}</span>
              </div>
              <div className="bento-card p-4 rounded-2xl relative overflow-hidden group border-emerald-500/20 bg-emerald-500/[0.03]">
                <div className="flex items-center justify-between text-[10px] text-emerald-400/80 mb-1">
                  <span className="uppercase tracking-wider">Verified</span>
                  <span>✔ Pass</span>
                </div>
                <span className="text-2xl font-bold text-emerald-400">
                  {registrations.filter((r) => r.status === "verified" || r.status === "approved").length}
                </span>
              </div>
              <div className="bento-card p-4 rounded-2xl relative overflow-hidden group border-amber-500/20 bg-amber-500/[0.03]">
                <div className="flex items-center justify-between text-[10px] text-amber-400/80 mb-1">
                  <span className="uppercase tracking-wider">Pending</span>
                  <span>⏳ Queue</span>
                </div>
                <span className="text-2xl font-bold text-amber-400">
                  {registrations.filter((r) => r.status === "pending").length}
                </span>
              </div>
              <div className="bento-card p-4 rounded-2xl relative overflow-hidden group border-rose-500/20 bg-rose-500/[0.03]">
                <div className="flex items-center justify-between text-[10px] text-rose-400/80 mb-1">
                  <span className="uppercase tracking-wider">Rejected</span>
                  <span>✖ Closed</span>
                </div>
                <span className="text-2xl font-bold text-rose-400">
                  {registrations.filter((r) => r.status === "rejected").length}
                </span>
              </div>
            </div>

            {/* EVENT PAYMENT QR CODE MANAGER (For Event Registration & Payment Verification) */}
            <div className="p-5 sm:p-6 rounded-3xl glass-card border border-purple-500/30 bg-gradient-to-br from-purple-950/20 via-[#0b0c10] to-[#07080c] space-y-4 shadow-[0_10px_35px_rgba(0,0,0,0.6)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-xl text-purple-300 shrink-0">
                    💳
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        Event Payment QR Code &amp; UPI Gateway
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold">
                        LIVE ON REGISTRATION FORM
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Upload or update the payment QR code image displayed to students in the registration modal when they sign up for events.
                    </p>
                  </div>
                </div>

                {/* Event Target Selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-400">Target Event:</span>
                  <select
                    value={selectedQrEventId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setSelectedQrEventId(selectedId);
                      if (selectedId === "all") {
                        const stored = localStorage.getItem("tesa_payment_qr");
                        if (stored) setRegistrationQrUrl(stored);
                        const storedUpi = localStorage.getItem("tesa_payment_upi");
                        setRegUpiId(storedUpi || "tesa@sggs");
                        const storedFee = localStorage.getItem("tesa_payment_fee");
                        setRegFee(storedFee || "₹150 / ₹250");
                        const storedInst = localStorage.getItem("tesa_payment_instructions");
                        setRegInstructions(storedInst || "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.");
                        const storedApps = localStorage.getItem("tesa_payment_apps");
                        setRegAcceptedApps(storedApps || "GPay • PhonePe • Paytm • BHIM");
                      } else {
                        const targetEv = eventsList.find((ev) => ev.id === selectedId);
                        if (targetEv) {
                          setRegistrationQrUrl(targetEv.paymentQrUrl || targetEv.qrCodeUrl || "");
                          setRegUpiId(targetEv.upiId || "tesa@sggs");
                          setRegFee(targetEv.registrationFee || "₹150 / ₹250");
                          setRegInstructions(targetEv.paymentInstructions || "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.");
                          setRegAcceptedApps(targetEv.acceptedPaymentApps || "GPay • PhonePe • Paytm • BHIM");
                        }
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="all">★ All Events (Master Default QR)</option>
                    {eventsList.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* QR Code Preview & Upload Area */}
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                {/* QR Code Thumbnail Preview */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative w-32 h-32 rounded-2xl bg-white p-2 border-2 border-purple-400/50 shadow-xl overflow-hidden group">
                    <Image
                      src={
                        registrationQrUrl ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(regUpiId)}%26pn=TESA%20SGGSIET%26cu=INR`
                      }
                      alt="Payment QR Code"
                      width={128}
                      height={128}
                      unoptimized
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <a
                      href={
                        registrationQrUrl ||
                        `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=upi://pay?pa=${encodeURIComponent(regUpiId)}%26pn=TESA%20SGGSIET%26cu=INR`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono font-bold"
                    >
                      🔍 Full View
                    </a>
                    {isUploadingRegQr && (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-purple-300 text-[10px] animate-pulse">
                        <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mb-1" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-purple-300 mt-1.5 font-bold">
                    UPI: {regUpiId || "tesa@sggs"}
                  </span>
                </div>

                {/* Upload & Configuration Controls */}
                <div className="flex-1 w-full space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                      Upload Payment QR Code Image (File from Device / Cloudinary)
                    </label>
                    <input
                      ref={regQrFileInputRef}
                      type="file"
                      accept="image/*"
                      disabled={isUploadingRegQr}
                      onChange={handleRegQrFileChange}
                      className="w-full text-xs text-zinc-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-violet-600 file:to-purple-600 file:text-white hover:file:opacity-90 file:cursor-pointer cursor-pointer disabled:opacity-50"
                    />
                    <span className="text-[10px] text-zinc-400 block mt-1">
                      Upload your GPay / PhonePe / Paytm UPI QR code screenshot or image. Auto-optimizes on Cloudinary.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-400 block">
                      Or Provide Hosted QR Image URL:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://res.cloudinary.com/.../image/upload/qr.png"
                        value={registrationQrUrl}
                        onChange={(e) => setRegistrationQrUrl(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleSaveRegQrUrl}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      >
                        Save &amp; Apply
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const def = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=tesa@sggs%26pn=TESA%20SGGSIET%26cu=INR";
                          setRegistrationQrUrl(def);
                          setRegUpiId("tesa@sggs");
                          setRegFee("₹150 / ₹250");
                          setRegInstructions("Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.");
                          setRegAcceptedApps("GPay • PhonePe • Paytm • BHIM");
                          localStorage.setItem("tesa_payment_qr", def);
                          localStorage.setItem("tesa_payment_upi", "tesa@sggs");
                          localStorage.setItem("tesa_payment_fee", "₹150 / ₹250");
                          localStorage.setItem("tesa_payment_instructions", "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.");
                          localStorage.setItem("tesa_payment_apps", "GPay • PhonePe • Paytm • BHIM");
                          showToast("Reset to official dynamic UPI QR code!");
                        }}
                        className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-zinc-300 text-xs shrink-0 cursor-pointer"
                        title="Reset to default UPI QR"
                      >
                        Reset Default
                      </button>
                    </div>
                  </div>

                  {/* Customizable UPI ID & Payment Text Form */}
                  <div className="pt-3 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Custom UPI ID (VPA):
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. tesa@sggs or your-event@upi"
                        value={regUpiId}
                        onChange={(e) => setRegUpiId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Registration Fee Text:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ₹150 / ₹250 or ₹100 per person or Free"
                        value={regFee}
                        onChange={(e) => setRegFee(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Accepted UPI Apps:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. GPay • PhonePe • Paytm • BHIM"
                        value={regAcceptedApps}
                        onChange={(e) => setRegAcceptedApps(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-zinc-300 block mb-1">
                        Payment Instructions Note:
                      </label>
                      <input
                        type="text"
                        placeholder="Instructions displayed on registration form..."
                        value={regInstructions}
                        onChange={(e) => setRegInstructions(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Bar: Dark Command Center */}
            <div className="p-4 rounded-2xl glass-card flex flex-col md:flex-row items-center gap-3 text-xs">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Search by student name, PRN, or contact number..."
                  value={registrationSearch}
                  onChange={(e) => setRegistrationSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                />
                <span className="absolute left-3.5 top-3 text-zinc-500">🔍</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0c10] border border-white/10 text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
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
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b0c10] border border-white/10 text-zinc-300 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="verified">Verified (✔)</option>
                  <option value="pending">Pending (⏳)</option>
                  <option value="rejected">Rejected (✖)</option>
                </select>
              </div>
            </div>

            {/* Registrations Data Table: Dark Bento Card Table */}
            <div className="bento-card rounded-3xl overflow-hidden relative">
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-white/[0.02] border-b border-white/[0.08] text-xs">
                <span className="flex items-center gap-2 text-purple-300 font-medium">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                  Live Participant Registry
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearDummyRegistrations}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-500/30 text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Remove any dummy or mock registrations"
                  >
                    <span>🗑</span>
                    <span>Clear Dummy Records</span>
                  </button>
                  <span className="text-zinc-500 text-[11px] font-mono hidden sm:inline">
                    Real-time sync with Firestore
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-white/[0.01] text-zinc-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">#</th>
                      <th className="py-3.5 px-4">Student &amp; PRN</th>
                      <th className="py-3.5 px-4">Event Title</th>
                      <th className="py-3.5 px-4">Year &amp; Contact</th>
                      <th className="py-3.5 px-4">Uploaded Media / Banner</th>
                      <th className="py-3.5 px-4">Payment Proof</th>
                      <th className="py-3.5 px-4">Form Answers</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((reg, idx) => {
                        const isVerified = reg.status === "verified" || reg.status === "approved";
                        const isPending = reg.status === "pending";
                        const isRejected = reg.status === "rejected";
                        const answerCount = reg.customAnswers ? Object.keys(reg.customAnswers).length : 0;

                        return (
                          <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 text-zinc-500 font-mono">{idx + 1}</td>
                            
                            {/* Student & PRN */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-white block">{reg.studentName}</span>
                              <span className="text-[11px] text-purple-300 font-mono font-medium">{reg.prn}</span>
                            </td>

                            {/* Event Title */}
                            <td className="py-3.5 px-4 text-zinc-300 max-w-xs">
                              <span className="line-clamp-2">{reg.eventTitle}</span>
                              <span className="text-[10px] text-zinc-500 block mt-0.5">{reg.registeredAt}</span>
                            </td>

                            {/* Year & Contact */}
                            <td className="py-3.5 px-4 text-zinc-400">
                              <span className="block text-zinc-200">{reg.year}</span>
                              <span className="text-[11px] text-zinc-500">{reg.email}</span>
                            </td>

                            {/* Uploaded Files: Poster Banner & Presentation */}
                            <td className="py-3.5 px-4">
                              <div className="flex flex-col gap-1 items-start">
                                {reg.bannerUrl && (
                                  <a
                                    href={reg.bannerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-500/30 text-[11px] font-medium transition-all hover:scale-105 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                                    title="Open uploaded poster banner on Cloudinary"
                                  >
                                    <span>🎨</span>
                                    <span>Poster Banner</span>
                                    <span className="text-[9px] opacity-70">↗</span>
                                  </a>
                                )}
                                {reg.submissionFileUrl && (
                                  <a
                                    href={reg.submissionFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-500/30 text-[11px] font-medium transition-all hover:scale-105 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                                    title="Open presentation/media uploaded to Cloudinary"
                                  >
                                    <span>📄</span>
                                    <span>Presentation</span>
                                    <span className="text-[9px] opacity-70">↗</span>
                                  </a>
                                )}
                                {!reg.bannerUrl && !reg.submissionFileUrl && (
                                  <span className="text-[11px] text-zinc-500 italic">None attached</span>
                                )}
                              </div>
                            </td>

                            {/* Payment Proof Screenshot */}
                            <td className="py-3.5 px-4">
                              {reg.paymentScreenshotUrl ? (
                                <a
                                  href={reg.paymentScreenshotUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-all hover:scale-105 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                                  title="Open payment screenshot on Cloudinary"
                                >
                                  <span>🧾</span>
                                  <span>Receipt</span>
                                  <span className="text-[9px] opacity-70">↗</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-zinc-500 italic">None</span>
                              )}
                            </td>

                            {/* Custom Form Answers */}
                            <td className="py-3.5 px-4">
                              {answerCount > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRegForAnswers(reg)}
                                  className="px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 border border-purple-500/30 text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  <span>📋</span>
                                  <span>Answers ({answerCount})</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRegForAnswers(reg)}
                                  className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer underline"
                                >
                                  Details
                                </button>
                              )}
                            </td>

                            {/* Status Badge: Neon Status Pills */}
                            <td className="py-3.5 px-4">
                              {isVerified ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)]">
                                  <span>✔</span>
                                  <span>Verified</span>
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-semibold shadow-[0_0_12px_rgba(245,158,11,0.25)]">
                                  <span>⏳</span>
                                  <span>Pending</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-semibold shadow-[0_0_12px_rgba(244,63,94,0.25)]">
                                  <span>✖</span>
                                  <span>Rejected</span>
                                </span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isVerified ? (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegStatus(reg.id, "verified")}
                                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-[11px] transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer"
                                    title="Click to Verify Registration (updates status to verified in Firestore)"
                                  >
                                    <span>✔</span>
                                    <span>Verify</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegStatus(reg.id, "pending")}
                                    className="glass-button-secondary px-2.5 py-1.5 rounded-lg text-zinc-300 hover:text-white text-[11px] border border-white/10 transition-colors cursor-pointer"
                                    title="Revert to pending"
                                  >
                                    Revert
                                  </button>
                                )}

                                {!isRejected && (
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateRegStatus(reg.id, "rejected")}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] transition-colors cursor-pointer"
                                    title="Reject registration"
                                  >
                                    ✖
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDeleteRegistration(reg.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] transition-colors cursor-pointer"
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
                        <td colSpan={9} className="py-12 text-center text-zinc-500">
                          <p className="text-sm text-zinc-400 font-semibold mb-1">No registration submissions matching filters.</p>
                          <p className="text-xs text-zinc-500">Students registering on the public portal will appear here in real-time.</p>
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
              <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto overscroll-contain">
                <div className="relative w-full max-w-2xl glass-modal-panel rounded-3xl p-5 sm:p-7 text-xs my-auto sm:my-8 max-h-[94vh] sm:max-h-none overflow-y-auto">
                  {/* Top Modal Header */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-950/40 text-[10px] font-mono text-purple-300 mb-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                        <span>REGISTRATION DOSSIER • SUBMISSION DETAILS</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedRegForAnswers.studentName}
                      </h3>
                      <span className="text-xs text-zinc-400">
                        PRN: <span className="text-purple-300 font-mono font-semibold">{selectedRegForAnswers.prn}</span> • {selectedRegForAnswers.eventTitle}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedRegForAnswers(null)}
                      className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Delegate Summary Box */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Year of Study:</span>
                      <span className="text-white font-medium">{selectedRegForAnswers.year}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Contact / WhatsApp:</span>
                      <span className="text-white font-medium">{selectedRegForAnswers.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Registration Date:</span>
                      <span className="text-zinc-300 font-mono">{selectedRegForAnswers.registeredAt}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">Current Status:</span>
                      <span className={`font-semibold ${
                        selectedRegForAnswers.status === "verified" || selectedRegForAnswers.status === "approved"
                          ? "text-emerald-400"
                          : selectedRegForAnswers.status === "pending"
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}>
                        {selectedRegForAnswers.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Uploaded Files Section */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3 mb-5">
                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide block">
                      Uploaded Files &amp; Media Attachments
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Uploaded Poster / Banner */}
                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-1.5 uppercase font-medium">Event Poster / Banner:</span>
                          {selectedRegForAnswers.bannerUrl ? (
                            <a
                              href={selectedRegForAnswers.bannerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/30 text-pink-300 font-semibold text-xs mt-1 transition-all hover:scale-105 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                            >
                              <span>🎨 Open Banner (Image) ↗</span>
                            </a>
                          ) : (
                            <span className="text-zinc-500 text-xs italic">No banner attached</span>
                          )}
                        </div>
                      </div>

                      {/* Presentation / Media File */}
                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-1.5 uppercase font-medium">Project Presentation / Media:</span>
                          {selectedRegForAnswers.submissionFileUrl ? (
                            <a
                              href={selectedRegForAnswers.submissionFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 font-semibold text-xs mt-1 transition-all hover:scale-105 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                            >
                              <span>📄 Open Presentation (PPT/PDF) ↗</span>
                            </a>
                          ) : (
                            <span className="text-zinc-500 text-xs italic">No presentation file attached</span>
                          )}
                        </div>
                      </div>

                      {/* Payment Screenshot */}
                      <div className="p-3.5 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] text-zinc-400 block mb-1.5 uppercase font-medium">Payment Screenshot Proof:</span>
                          {selectedRegForAnswers.paymentScreenshotUrl ? (
                            <a
                              href={selectedRegForAnswers.paymentScreenshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-semibold text-xs mt-1 transition-all hover:scale-105 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            >
                              <span>🧾 View Receipt Proof ↗</span>
                            </a>
                          ) : (
                            <span className="text-zinc-500 text-xs italic">No screenshot attached</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Form Answers */}
                  <div className="space-y-2 mb-6">
                    <span className="text-xs font-semibold text-white uppercase tracking-wide block">
                      Custom Form Field Responses
                    </span>

                    {selectedRegForAnswers.customAnswers && Object.keys(selectedRegForAnswers.customAnswers).length > 0 ? (
                      <div className="rounded-2xl border border-white/[0.08] bg-black/40 overflow-hidden divide-y divide-white/[0.06]">
                        {Object.entries(selectedRegForAnswers.customAnswers).map(([qTitle, answer], aIdx) => (
                          <div key={aIdx} className="p-3.5 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <span className="text-zinc-400 text-xs sm:w-1/3 shrink-0 font-medium">
                              {qTitle}:
                            </span>
                            <div className="sm:w-2/3 text-white text-xs break-words">
                              {typeof answer === "string" && (answer.startsWith("http://") || answer.startsWith("https://")) ? (
                                <a
                                  href={answer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-300 hover:text-purple-200 underline inline-flex items-center gap-1"
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
                      <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-zinc-500 text-xs">
                        No additional custom fields were required for this event.
                      </div>
                    )}
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setSelectedRegForAnswers(null)}
                      className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
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
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs tracking-wide transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] cursor-pointer flex items-center gap-1.5"
                        >
                          <span>✔</span>
                          <span>Verify Registration Now</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
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
          MODAL: ADD / EDIT COUNCIL MEMBER (With Sleek Portrait Frame Preview)
          ======================================================================= */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl overflow-y-auto overscroll-contain">
          <div className="relative w-full max-w-2xl glass-modal-panel rounded-3xl p-5 sm:p-7 text-xs my-auto sm:my-8 max-h-[94vh] sm:max-h-none overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
              <div>
                <span className="text-[10px] text-purple-400 uppercase tracking-widest block font-mono">
                  COUNCIL DIRECTORY
                </span>
                <h3 className="text-xl font-bold text-white">
                  {editingTeamMember ? "Edit Council Member & Portrait" : "Add New Council Member"}
                </h3>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeamMember} className="space-y-5">
              {/* Image Preview & Upload Section */}
              <div className="p-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] space-y-4">
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide block">
                  1. Member Portrait Photo
                </span>

                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  {/* Portrait Frame Preview */}
                  <div className="relative w-36 aspect-[3/4] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden shrink-0 shadow-[0_10px_25px_rgba(0,0,0,0.8)]">
                    {teamForm.photoUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={teamForm.photoUrl}
                          alt="Preview"
                          fill
                          unoptimized
                          className="object-cover contrast-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none rounded-2xl" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-3 text-zinc-500">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-[10px] leading-tight">No Photo Attached</span>
                      </div>
                    )}

                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-[10px] text-purple-300">
                        <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mb-1" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls & URL input */}
                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1.5 uppercase font-medium">
                        Upload Portrait Photo to Cloudinary (Unsigned):
                      </label>
                      <input
                        ref={teamFileInputRef}
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleTeamPhotoFileChange}
                        disabled={isUploadingPhoto}
                        className="w-full text-xs text-zinc-300 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-gradient-to-r file:from-violet-600 file:to-purple-600 file:text-white hover:file:opacity-90 file:cursor-pointer cursor-pointer disabled:opacity-50"
                      />
                    </div>

                    {isUploadingPhoto && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs animate-pulse">
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin shrink-0" />
                        <span>Uploading Media... Sending portrait photo to Cloudinary...</span>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] text-zinc-400 block mb-1 uppercase font-medium">
                        Or Paste Direct Image URL:
                      </label>
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={teamForm.photoUrl || ""}
                        onChange={(e) => setTeamForm({ ...teamForm, photoUrl: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                      />
                    </div>

                    {/* Quick Sample Portraits Picker */}
                    <div>
                      <span className="text-[10px] text-zinc-500 block mb-1.5 font-medium">
                        Quick testing portraits:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {SAMPLE_PORTRAITS.map((sample, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTeamForm({ ...teamForm, photoUrl: sample.url })}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-purple-950/60 hover:text-purple-300 border border-white/10 text-[10px] text-zinc-400 transition-colors cursor-pointer"
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
                  <label className="text-zinc-400 block mb-1 font-medium">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Deshmukh"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-medium">Role / Position *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. President"
                    value={teamForm.role}
                    onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-medium">Official Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Executive Head, TESA Council"
                    value={teamForm.designation}
                    onChange={(e) => setTeamForm({ ...teamForm, designation: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-medium">Academic Year</label>
                  <select
                    value={teamForm.year}
                    onChange={(e) => setTeamForm({ ...teamForm, year: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="Final Year B.Tech">Final Year B.Tech</option>
                    <option value="Third Year B.Tech">Third Year B.Tech</option>
                    <option value="Second Year B.Tech">Second Year B.Tech</option>
                    <option value="First Year B.Tech">First Year B.Tech</option>
                    <option value="M.Tech Scholar">M.Tech Scholar</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-medium">Category</label>
                  <select
                    value={teamForm.category}
                    onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="core">Core Council</option>
                    <option value="technical">Technical &amp; Research</option>
                    <option value="events">Events &amp; Operations</option>
                    <option value="outreach">Public Relations &amp; Outreach</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1 font-medium">Technical Specialization</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart &amp; Conductive Textiles"
                    value={teamForm.specialization}
                    onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. E-Textiles, Project Leadership, Research &amp; Dev"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1 font-medium">Member Bio / Overview</label>
                <textarea
                  rows={3}
                  placeholder="Short bio detailing council leadership contributions..."
                  value={teamForm.bio}
                  onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 font-sans text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFirebaseConfigured || isUploadingPhoto}
                  className={`glow-button-primary px-5 py-2.5 rounded-xl font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
                    !isFirebaseConfigured
                      ? "bg-red-950/70 border border-red-500/40 text-red-300 cursor-not-allowed opacity-75"
                      : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {!isFirebaseConfigured ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Database Disconnected</span>
                    </>
                  ) : isUploadingPhoto ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
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
          MODAL: ADD / EDIT EVENT (Compact 1-Screen Viewport Fit Layout)
          ======================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="relative w-full max-w-5xl max-h-[86vh] flex flex-col bg-[#0b0c10] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
            {/* Sticky Top Bar (shrink-0 px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#0f1016]) */}
            <div className="shrink-0 px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#0f1016]">
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] text-purple-400 uppercase tracking-widest font-mono font-bold px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                  EVENT OPERATIONS
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {editingEventId ? "Edit Event Details & Media" : "Publish New Event"}
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase">
                  {eventForm.eventStatus || "Upcoming"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsEventModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Compact 2-Column Scrollable Body (flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5) */}
              <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 custom-scrollbar text-xs">
                {/* Left Column (lg:col-span-5 space-y-4) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Compact Upload Boxes for Event Banner (h-24) & Payment QR (h-24 w-24) */}
                  <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                    {/* Event Banner (h-24) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                          Event Banner <span className="text-purple-400">*</span>
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">Cloudinary Upload</span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="w-36 h-24 rounded-xl border border-white/10 bg-black overflow-hidden shrink-0 relative flex items-center justify-center shadow-md">
                          {eventForm.mediaUrl || eventForm.bannerUrl ? (
                            <Image
                              src={eventForm.bannerUrl || eventForm.mediaUrl || ""}
                              alt="Banner"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="text-[10px] text-zinc-500 text-center p-2">
                              No Banner
                            </div>
                          )}
                          {isUploadingBanner && (
                            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-purple-300 text-[10px] animate-pulse">
                              <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mb-1" />
                              <span>Uploading Media...</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            ref={eventFileInputRef}
                            type="file"
                            accept="image/*"
                            disabled={isUploadingBanner}
                            onChange={handleEventBannerFileChange}
                            className="w-full text-[11px] text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-gradient-to-r file:from-violet-600 file:to-purple-600 file:text-white hover:file:opacity-90 file:cursor-pointer cursor-pointer disabled:opacity-50"
                          />
                          <input
                            type="url"
                            placeholder="Or paste banner image URL..."
                            value={eventForm.bannerUrl || eventForm.mediaUrl || ""}
                            onChange={(e) =>
                              setEventForm({
                                ...eventForm,
                                mediaUrl: e.target.value,
                                bannerUrl: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Payment QR Code (h-24 w-24) */}
                    <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                          Payment QR Code <span className="text-purple-400">*</span>
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">For Student UPI Fee</span>
                      </div>

                      <div className="flex gap-3 items-center">
                        <div className="w-24 h-24 rounded-xl border border-purple-500/30 bg-white p-1 overflow-hidden shrink-0 relative flex items-center justify-center shadow-md">
                          {eventForm.paymentQrUrl || eventForm.qrCodeUrl ? (
                            <Image
                              src={eventForm.paymentQrUrl || eventForm.qrCodeUrl || ""}
                              alt="Payment QR"
                              fill
                              unoptimized
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="text-[9px] text-zinc-500 text-center font-mono">
                              <span className="text-base block">📱</span>
                              <span>No QR</span>
                            </div>
                          )}
                          {isUploadingQr && (
                            <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center text-purple-300 text-[10px] animate-pulse">
                              <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mb-1" />
                              <span>Uploading...</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            ref={eventQrFileInputRef}
                            type="file"
                            accept="image/*"
                            disabled={isUploadingQr}
                            onChange={handleEventQrFileChange}
                            className="w-full text-[11px] text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-gradient-to-r file:from-violet-600 file:to-purple-600 file:text-white hover:file:opacity-90 file:cursor-pointer cursor-pointer disabled:opacity-50"
                          />
                          <div className="flex gap-1.5">
                            <input
                              type="url"
                              placeholder="Or paste QR image URL..."
                              value={eventForm.paymentQrUrl || eventForm.qrCodeUrl || ""}
                              onChange={(e) =>
                                setEventForm({
                                  ...eventForm,
                                  paymentQrUrl: e.target.value,
                                  qrCodeUrl: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-xs"
                            />
                            {(eventForm.paymentQrUrl || eventForm.qrCodeUrl) && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEventForm({ ...eventForm, paymentQrUrl: "", qrCodeUrl: "" })
                                }
                                className="px-2 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-[10px] shrink-0 cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UPI ID & Fee Customization */}
                  <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                          Event UPI ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. tesa@sggs"
                          value={eventForm.upiId || ""}
                          onChange={(e) => setEventForm({ ...eventForm, upiId: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                          Registration Fee Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ₹150 / ₹250 or Free"
                          value={eventForm.registrationFee || ""}
                          onChange={(e) => setEventForm({ ...eventForm, registrationFee: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                          Accepted Payment Apps
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GPay • PhonePe • Paytm • BHIM"
                          value={eventForm.acceptedPaymentApps || ""}
                          onChange={(e) => setEventForm({ ...eventForm, acceptedPaymentApps: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                          Event Status *
                        </label>
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
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0b0c10] border border-white/10 text-white focus:outline-none focus:border-purple-500 cursor-pointer font-mono text-xs"
                        >
                          <option value="Upcoming">Upcoming</option>
                          <option value="Concluded">Concluded</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-zinc-300 block mb-1">
                        Payment Instructions Note
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Instructions displayed below the QR code to students..."
                        value={eventForm.paymentInstructions || ""}
                        onChange={(e) => setEventForm({ ...eventForm, paymentInstructions: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white text-xs placeholder-zinc-500 focus:outline-none focus:border-purple-500 font-sans"
                      />
                    </div>
                  </div>

                  {/* Event Gallery Photos Section (Visible if Concluded) */}
                  {(eventForm.eventStatus === "Concluded" || eventForm.status === "closed") && (
                    <div className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/10 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide block">
                          Event Gallery Photos
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30">
                          {(eventForm.galleryUrls?.length || 0) + galleryFiles.length} Photos
                        </span>
                      </div>

                      <input
                        ref={galleryFileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleGalleryFilesChange}
                        className="w-full text-xs text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer cursor-pointer"
                      />

                      {((eventForm.galleryUrls && eventForm.galleryUrls.length > 0) || galleryFiles.length > 0) && (
                        <div className="grid grid-cols-4 gap-1.5 max-h-28 overflow-y-auto p-1">
                          {eventForm.galleryUrls?.map((url, uIdx) => (
                            <div key={`existing-${uIdx}`} className="relative aspect-square rounded-lg border border-white/10 overflow-hidden group bg-black">
                              <Image src={url} alt={`Gallery ${uIdx}`} fill unoptimized className="object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveExistingGalleryUrl(url)}
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-950/90 text-red-300 border border-red-500/40 text-[9px] flex items-center justify-center cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          {galleryFiles.map((file, fIdx) => (
                            <div key={`file-${fIdx}`} className="relative aspect-square rounded-lg border border-amber-500/40 overflow-hidden group bg-zinc-900 flex flex-col items-center justify-center p-1 text-center">
                              <span className="text-xs">📷</span>
                              <span className="text-[8px] text-amber-300 truncate w-full">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryFile(fIdx)}
                                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-950/90 text-red-300 border border-red-500/40 text-[9px] flex items-center justify-center cursor-pointer"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column (lg:col-span-7 space-y-3): Compact Form Fields & Dynamic Questions */}
                <div className="lg:col-span-7 space-y-3">
                  {/* Title */}
                  <div>
                    <label className="text-zinc-400 block mb-1 font-medium">Event Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TEX-CONCLAVE 2026: National Smart Fibers Symposium"
                      value={eventForm.title}
                      onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                      className="w-full py-2 px-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 font-sans"
                    />
                  </div>

                  {/* Category, Date, Venue, Capacity, Deadline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-zinc-400 block mb-1 font-medium">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. National Conclave / Hackathon"
                        value={eventForm.category}
                        onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                        className="w-full py-2 px-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1 font-medium">Date &amp; Schedule *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. April 28–29, 2026"
                        value={eventForm.date}
                        onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                        className="w-full py-2 px-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1 font-medium">Venue / Complex</label>
                      <input
                        type="text"
                        placeholder="e.g. SGGSIE&amp;T Main Auditorium"
                        value={eventForm.venue}
                        onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                        className="w-full py-2 px-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1 font-medium">Registration Capacity</label>
                      <input
                        type="number"
                        value={eventForm.capacity || 100}
                        onChange={(e) => setEventForm({ ...eventForm, capacity: Number(e.target.value) })}
                        className="w-full py-2 px-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1 font-medium">Registration Deadline</label>
                      <input
                        type="text"
                        placeholder="e.g. April 15, 2026"
                        value={eventForm.deadline || ""}
                        onChange={(e) => setEventForm({ ...eventForm, deadline: e.target.value })}
                        className="w-full py-2 px-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="text-zinc-400 block mb-1 font-medium">Key Highlights Pill</label>
                      <input
                        type="text"
                        placeholder="e.g. ₹1,50,000 Cash Pool • IEEE"
                        value={eventForm.highlights || ""}
                        onChange={(e) => setEventForm({ ...eventForm, highlights: e.target.value })}
                        className="w-full py-2 px-3 text-sm rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="text-zinc-400 block mb-1 font-medium">Event Summary</label>
                    <textarea
                      rows={2}
                      placeholder="Detailed synopsis of symposium tracks, competitions..."
                      value={eventForm.summary}
                      onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                      className="w-full py-2 px-3 text-xs rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-purple-500 font-sans"
                    />
                  </div>

                  {/* Custom Registration Form Builder */}
                  <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-500/30 uppercase">
                          CUSTOM REGISTRATION QUESTIONS
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Configure specialized fields (Team Name, Abstract, PPT/PDF Upload, etc.).
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddCustomQuestion}
                        className="glass-button-secondary text-purple-300 hover:text-white border-purple-500/30 hover:border-purple-500/60 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        <span>+ Add Question</span>
                      </button>
                    </div>

                    {/* Question List */}
                    {(!eventForm.customFormFields || eventForm.customFormFields.length === 0) ? (
                      <div className="py-3 px-3 rounded-lg border border-dashed border-white/10 text-center text-zinc-500 text-[11px]">
                        No custom questions added. Standard fields (Name, PRN, Year, Phone, Payment Screenshot, Media) are automatically included.
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-44 overflow-y-auto p-1">
                        {eventForm.customFormFields.map((field, index) => (
                          <div
                            key={field.id}
                            className="p-3 rounded-xl border border-white/[0.08] bg-black/40 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/[0.06]">
                              <span className="text-[10px] font-mono font-bold text-purple-400">
                                QUESTION #{index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveCustomQuestion(field.id)}
                                className="text-[10px] font-mono text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 cursor-pointer"
                              >
                                ✕ Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div className="sm:col-span-2">
                                <label className="text-[10px] text-zinc-400 block mb-0.5 uppercase font-semibold">
                                  Title <span className="text-purple-400">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Team Name, Abstract Title..."
                                  value={field.questionTitle}
                                  onChange={(e) =>
                                    handleUpdateCustomQuestion(field.id, { questionTitle: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 text-xs"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] text-zinc-400 block mb-0.5 uppercase font-semibold">
                                  Type <span className="text-purple-400">*</span>
                                </label>
                                <select
                                  value={field.fieldType}
                                  onChange={(e) =>
                                    handleUpdateCustomQuestion(field.id, {
                                      fieldType: e.target.value as CustomFieldType,
                                    })
                                  }
                                  className="w-full px-2 py-1.5 rounded-lg bg-[#0b0c10] border border-white/10 text-white text-xs cursor-pointer font-mono"
                                >
                                  <option value="Short Text">Short Text</option>
                                  <option value="Paragraph">Paragraph</option>
                                  <option value="Dropdown Options">Dropdown Options</option>
                                  <option value="File Upload (PPT/PDF/Image)">File Upload (PPT/PDF)</option>
                                </select>
                              </div>
                            </div>

                            {field.fieldType === "Dropdown Options" && (
                              <div>
                                <label className="text-[10px] text-amber-300 block mb-0.5">
                                  Dropdown Options (Comma-separated)
                                </label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Option 1, Option 2, Option 3..."
                                  value={field.options || ""}
                                  onChange={(e) =>
                                    handleUpdateCustomQuestion(field.id, { options: e.target.value })
                                  }
                                  className="w-full px-2.5 py-1.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-white text-xs"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                              {field.fieldType === "File Upload (PPT/PDF/Image)" ? (
                                <span className="text-[10px] text-amber-300 font-mono">
                                  ⚡ Presentation/Media uploads are always optional for students
                                </span>
                              ) : (
                                <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={field.required}
                                    onChange={(e) =>
                                      handleUpdateCustomQuestion(field.id, { required: e.target.checked })
                                    }
                                    className="w-3.5 h-3.5 rounded border-white/20 bg-black text-purple-500 cursor-pointer"
                                  />
                                  <span className="text-xs text-zinc-300">Required Question</span>
                                </label>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Action Bar (shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0f1016] flex items-center justify-end gap-3) */}
              <div className="shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0f1016] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  disabled={isSubmittingEvent || isUploadingBanner || isUploadingGallery || isUploadingQr}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFirebaseConfigured || isSubmittingEvent || isUploadingBanner || isUploadingGallery || isUploadingQr}
                  className={`glow-button-primary px-5 py-2.5 rounded-xl font-semibold uppercase tracking-wider text-xs transition-all flex items-center gap-2 ${
                    !isFirebaseConfigured
                      ? "bg-red-950/70 border border-red-500/40 text-red-300 cursor-not-allowed opacity-75"
                      : "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {!isFirebaseConfigured ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      <span>Database Disconnected</span>
                    </>
                  ) : (isUploadingGallery || isUploadingBanner || isUploadingQr || isSubmittingEvent) ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>
                        {isUploadingGallery || isUploadingBanner || isUploadingQr
                          ? "Uploading Media..."
                          : "Saving Event..."}
                      </span>
                    </>
                  ) : (
                    <span>{editingEventId ? "Save Event Changes" : "Publish Event"}</span>
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
