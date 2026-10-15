"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
} from "firebase/firestore";
import { auth, googleProvider, db } from "@/lib/firebase";
import * as XLSX from "xlsx";

// ==========================================
// DATA INTERFACES & SCHEMAS
// ==========================================

export interface EventItem {
  id: string;
  title: string;
  category: string;
  date: string;
  venue: string;
  deadline: string;
  capacity: number;
  status: "open" | "upcoming" | "closed";
  mediaUrl: string;
  summary: string;
  highlights: string;
  createdAt?: any;
}

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

export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  specialization: string;
  experience: string;
  email: string;
  researchFocus: string[];
  photoUrl?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  designation: string;
  labAssigned: string;
  qualification: string;
  experience: string;
  skills: string;
  photoUrl?: string;
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
}

export interface SiteContent {
  announcementBanner: string;
  heroHeadline: string;
  heroSubheadline: string;
  upcomingConclaveDate: string;
  registrationStatus: string;
  departmentNotice: string;
}

export interface MediaAsset {
  id: string;
  name: string;
  url: string;
  category: "event" | "lab" | "banner" | "general" | "portrait";
  uploadedAt: string;
}

// Sample portraits for quick testing in edit modals
const SAMPLE_PORTRAITS = [
  { label: "Male Student", url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80" },
  { label: "Female Student", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80" },
  { label: "Senior Professor", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80" },
  { label: "Female Professor", url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80" },
  { label: "Technical Specialist", url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80" },
];

// ==========================================
// DEFAULT SEED DATA
// ==========================================

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
    mediaUrl: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
    summary: "Hands-on synthesis of polymeric nanofibers for high-efficiency air filters and biomedical wound dressings.",
    highlights: "Live Electrospinner Demo • ASTM Characterization • Kit Provided",
  },
];

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

const INITIAL_FACULTY: FacultyMember[] = [
  {
    id: "fac-1",
    name: "Dr. Ravindra V. Adivarekar",
    designation: "Professor & Head of Department",
    qualification: "Ph.D. (Tech) Textile Chemistry, ICT Mumbai",
    specialization: "Eco-Friendly Wet Processing, Natural Dyeing & Surface Functionalization",
    experience: "28+ Years Academic & Research",
    email: "hod.textile@sggs.ac.in",
    researchFocus: ["Green Chemistry", "Nanoparticle Finishing", "Plasma Technology"],
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "fac-2",
    name: "Dr. Arvind S. Patil",
    designation: "Professor",
    qualification: "Ph.D. Textile Technology, IIT Delhi",
    specialization: "Yarn Manufacturing, Texturizing & Advanced Fiber Mechanics",
    experience: "25+ Years Experience",
    email: "aspatil@sggs.ac.in",
    researchFocus: ["Rotor Spinning Dynamics", "Air-Vortex Yarns", "Polymer Blends"],
  },
  {
    id: "fac-3",
    name: "Dr. Milind S. Kulkarni",
    designation: "Associate Professor",
    qualification: "Ph.D. Textile Engineering, VJTI Mumbai",
    specialization: "Weaving Automation, Electronic Jacquards & 3D Fabric Geometry",
    experience: "20+ Years Experience",
    email: "mskulkarni@sggs.ac.in",
    researchFocus: ["Shuttleless Weaving", "3D Woven Preforms", "Loom Sensors"],
  },
  {
    id: "fac-4",
    name: "Dr. Snehalata R. Joshi",
    designation: "Associate Professor",
    qualification: "Ph.D. Technical Textiles, IIT Delhi",
    specialization: "Smart Textiles, Nanofibers & Conductive Polymeric Weaves",
    experience: "16+ Years Experience",
    email: "srjoshi@sggs.ac.in",
    researchFocus: ["Electrospinning", "Wearable Electronics", "Biomedical Implants"],
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "fac-5",
    name: "Prof. Dnyaneshwar B. Shinde",
    designation: "Assistant Professor",
    qualification: "M.Tech Textile Technology, DKTE Ichalkaranji",
    specialization: "Textile Quality Testing, Statistical Process Control & Standards",
    experience: "12+ Years Experience",
    email: "dbshinde@sggs.ac.in",
    researchFocus: ["Tensile Failure Mechanics", "ISO Test Protocols", "Fiber Identification"],
  },
  {
    id: "fac-6",
    name: "Prof. Priya K. Deshmukh",
    designation: "Assistant Professor",
    qualification: "M.Tech Apparel Production, NIFT / SGGSIE&T",
    specialization: "Garment Manufacturing CAD/CAM, Ergonomics & Fashion Tech",
    experience: "9+ Years Experience",
    email: "pkdeshmukh@sggs.ac.in",
    researchFocus: ["3D Body Scanning", "Automated Marker Planning", "Apparel Sizing"],
  },
];

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "stf-1",
    name: "Mr. Sunil V. Rathod",
    designation: "Senior Technical Superintendent",
    labAssigned: "Fabric Weaving & Loom Shed",
    qualification: "Diploma in Textile Manufacturing (DTM)",
    experience: "22 Years",
    skills: "Electronic Jacquard Card Punching, Rapier Loom Timing Calibration, Loom Maintenance",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "stf-2",
    name: "Mr. Balaji M. Khandare",
    designation: "Laboratory Assistant",
    labAssigned: "Chemical Wet Processing & Dyeing Lab",
    qualification: "B.Sc. (Chemistry), ADT (Textile)",
    experience: "18 Years",
    skills: "HTHP Beaker Dyeing Vessel Operation, Spectrophotometer Calibration, Chemical Bath Prep",
  },
  {
    id: "stf-3",
    name: "Mr. Ramesh P. Gaikwad",
    designation: "Technical Instructor",
    labAssigned: "Fiber Spinning & Yarn Prep Lab",
    qualification: "Diploma in Textile Technology",
    experience: "15 Years",
    skills: "Mini-Blowroom Maintenance, Carding Clothing Maintenance, Ring Frame Spindle Alignment",
  },
  {
    id: "stf-4",
    name: "Mrs. Shobha S. Mane",
    designation: "Senior Testing Assistant",
    labAssigned: "Quality Assurance & Tensile Testing Lab",
    qualification: "Diploma in Textile Testing",
    experience: "14 Years",
    skills: "Universal Tensile Machine (UTM) Operation, Yarn Evenness Tester, Abrasion & Pilling Analytics",
  },
  {
    id: "stf-5",
    name: "Mr. Ajay K. Chavan",
    designation: "CAD/CAM & Computation Lab Assistant",
    labAssigned: "Textile CAD & Design Studio",
    qualification: "B.C.A. & Textile CAD Certification",
    experience: "8 Years",
    skills: "Richpeace Textile CAD Station Setup, Jacquard Weave File Simulation, Network Lab Admin",
  },
];

const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: "reg-101",
    studentName: "Aditya Deshpande",
    prn: "2022BTE045",
    email: "2022bte045@sggs.ac.in",
    department: "Textile Technology",
    year: "Final Year B.Tech",
    eventTitle: "TEX-CONCLAVE 2026: National Smart Fibers Symposium",
    registeredAt: "2026-03-28 14:30",
    status: "approved",
  },
  {
    id: "reg-102",
    studentName: "Priyanka More",
    prn: "2023BTE012",
    email: "2023bte012@sggs.ac.in",
    department: "Textile Technology",
    year: "Third Year B.Tech",
    eventTitle: "SMART WEAVES HACKATHON 2026",
    registeredAt: "2026-03-29 09:15",
    status: "pending",
  },
  {
    id: "reg-103",
    studentName: "Kunal Shinde",
    prn: "2023BME088",
    email: "2023bme088@sggs.ac.in",
    department: "Mechanical Engineering",
    year: "Third Year B.Tech",
    eventTitle: "SMART WEAVES HACKATHON 2026",
    registeredAt: "2026-03-29 11:40",
    status: "pending",
  },
  {
    id: "reg-104",
    studentName: "Sanya Sheikh",
    prn: "2024BTE007",
    email: "2024bte007@sggs.ac.in",
    department: "Textile Technology",
    year: "Second Year B.Tech",
    eventTitle: "NANOFIBER & ELECTROSPINNING WORKSHOP",
    registeredAt: "2026-03-30 16:20",
    status: "approved",
  },
  {
    id: "reg-105",
    studentName: "Rahul Chavan",
    prn: "2022BIT091",
    email: "2022bit091@sggs.ac.in",
    department: "Information Technology",
    year: "Final Year B.Tech",
    eventTitle: "TEX-CONCLAVE 2026: National Smart Fibers Symposium",
    registeredAt: "2026-03-31 10:05",
    status: "rejected",
  },
];

const INITIAL_MEDIA: MediaAsset[] = [
  {
    id: "med-1",
    name: "National Conclave Keynote Banner",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
    category: "event",
    uploadedAt: "2026-03-20",
  },
  {
    id: "med-2",
    name: "Smart Loom & Hackathon Studio",
    url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=60",
    category: "event",
    uploadedAt: "2026-03-22",
  },
  {
    id: "med-3",
    name: "Nanofiber Electrospinner Chamber",
    url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60",
    category: "lab",
    uploadedAt: "2026-03-25",
  },
  {
    id: "med-4",
    name: "Rapier Weaving Industrial Floor",
    url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=60",
    category: "lab",
    uploadedAt: "2026-03-26",
  },
];

// ==========================================
// COMPONENT MAIN
// ==========================================

export default function AdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "events" | "team" | "faculty_staff" | "registrations" | "media_cms"
  >("events");

  // Connectivity state for Firestore
  const [firestoreStatus, setFirestoreStatus] = useState<"checking" | "connected" | "not_provisioned">("checking");

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // ------------------------------------------
  // STATE: EVENTS
  // ------------------------------------------
  const [eventsList, setEventsList] = useState<EventItem[]>(INITIAL_EVENTS);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState<boolean>(false);
  const [eventForm, setEventForm] = useState<EventItem>({
    id: "",
    title: "",
    category: "National Conclave",
    date: "",
    venue: "SGGSIE&T Main Auditorium",
    deadline: "",
    capacity: 150,
    status: "open",
    mediaUrl: "",
    summary: "",
    highlights: "",
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);

  // ------------------------------------------
  // STATE: TEAM MEMBERS
  // ------------------------------------------
  const [teamList, setTeamList] = useState<TeamMember[]>(INITIAL_TEAM);
  const [teamCategoryFilter, setTeamCategoryFilter] = useState<string>("all");
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState<boolean>(false);
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

  // ------------------------------------------
  // STATE: FACULTY & STAFF
  // ------------------------------------------
  const [facultyList, setFacultyList] = useState<FacultyMember[]>(INITIAL_FACULTY);
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [facStaffSubTab, setFacStaffSubTab] = useState<"faculty" | "staff">("faculty");

  // Faculty edit/create modal
  const [isFacultyModalOpen, setIsFacultyModalOpen] = useState<boolean>(false);
  const [editingFacultyId, setEditingFacultyId] = useState<string | null>(null);
  const [facultyForm, setFacultyForm] = useState<FacultyMember>({
    id: "",
    name: "",
    designation: "Assistant Professor",
    qualification: "",
    specialization: "",
    experience: "",
    email: "",
    researchFocus: [],
    photoUrl: "",
  });
  const [researchFocusInput, setResearchFocusInput] = useState<string>("");

  // Staff edit/create modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [staffForm, setStaffForm] = useState<StaffMember>({
    id: "",
    name: "",
    designation: "Laboratory Assistant",
    labAssigned: "",
    qualification: "",
    experience: "",
    skills: "",
    photoUrl: "",
  });

  // ------------------------------------------
  // STATE: REGISTRATIONS & EXCEL EXPORT
  // ------------------------------------------
  const [registrations, setRegistrations] = useState<Registration[]>(INITIAL_REGISTRATIONS);
  const [registrationSearch, setRegistrationSearch] = useState<string>("");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isAddRegModalOpen, setIsAddRegModalOpen] = useState<boolean>(false);
  const [newRegForm, setNewRegForm] = useState<Partial<Registration>>({
    studentName: "",
    prn: "",
    email: "",
    department: "Textile Technology",
    year: "Third Year B.Tech",
    eventTitle: "TEX-CONCLAVE 2026: National Smart Fibers Symposium",
    status: "approved",
  });

  // ------------------------------------------
  // STATE: MEDIA & SITE CMS
  // ------------------------------------------
  const [mediaList, setMediaList] = useState<MediaAsset[]>(INITIAL_MEDIA);
  const [newMediaName, setNewMediaName] = useState<string>("");
  const [newMediaUrl, setNewMediaUrl] = useState<string>("");
  const [newMediaCategory, setNewMediaCategory] = useState<"event" | "lab" | "banner" | "general" | "portrait">("event");

  const [isSavingContent, setIsSavingContent] = useState<boolean>(false);
  const [siteContent, setSiteContent] = useState<SiteContent>({
    announcementBanner: "⚡ REGISTRATIONS FOR TEX-CONCLAVE 2026 ARE NOW LIVE — REGISTER BEFORE APR 10",
    heroHeadline: "ENGINEERING ADVANCED FIBERS & SMART TEXTILE SYSTEMS",
    heroSubheadline:
      "Gear up for TESA's flagship 2026 event season — featuring the National Textile Conclave, Smart Weaves Hackathon, and Industry 4.0 Nanofiber Expo.",
    upcomingConclaveDate: "April 28–29, 2026",
    registrationStatus: "OPEN",
    departmentNotice: "State-of-the-Art Electrospinning & Rapier Loom research slots open for B.Tech project students.",
  });

  // ------------------------------------------
  // TOAST HELPER
  // ------------------------------------------
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // ------------------------------------------
  // INITIAL DATA HYDRATION (localStorage & Firestore)
  // ------------------------------------------
  useEffect(() => {
    try {
      const storedEvents = localStorage.getItem("tesa_events");
      if (storedEvents) {
        const parsed = JSON.parse(storedEvents);
        if (Array.isArray(parsed) && parsed.length > 0) setEventsList(parsed);
      } else {
        localStorage.setItem("tesa_events", JSON.stringify(INITIAL_EVENTS));
      }

      const storedTeam = localStorage.getItem("tesa_team");
      if (storedTeam) {
        const parsed = JSON.parse(storedTeam);
        if (Array.isArray(parsed) && parsed.length > 0) setTeamList(parsed);
      } else {
        localStorage.setItem("tesa_team", JSON.stringify(INITIAL_TEAM));
      }

      const storedFaculty = localStorage.getItem("tesa_faculty");
      if (storedFaculty) {
        const parsed = JSON.parse(storedFaculty);
        if (Array.isArray(parsed) && parsed.length > 0) setFacultyList(parsed);
      } else {
        localStorage.setItem("tesa_faculty", JSON.stringify(INITIAL_FACULTY));
      }

      const storedStaff = localStorage.getItem("tesa_staff");
      if (storedStaff) {
        const parsed = JSON.parse(storedStaff);
        if (Array.isArray(parsed) && parsed.length > 0) setStaffList(parsed);
      } else {
        localStorage.setItem("tesa_staff", JSON.stringify(INITIAL_STAFF));
      }

      const storedRegs = localStorage.getItem("tesa_registrations");
      if (storedRegs) {
        const parsed = JSON.parse(storedRegs);
        if (Array.isArray(parsed) && parsed.length > 0) setRegistrations(parsed);
      } else {
        localStorage.setItem("tesa_registrations", JSON.stringify(INITIAL_REGISTRATIONS));
      }

      const storedContent = localStorage.getItem("tesa_content");
      if (storedContent) {
        setSiteContent(JSON.parse(storedContent));
      }

      const storedMedia = localStorage.getItem("tesa_media");
      if (storedMedia) {
        const parsed = JSON.parse(storedMedia);
        if (Array.isArray(parsed) && parsed.length > 0) setMediaList(parsed);
      } else {
        localStorage.setItem("tesa_media", JSON.stringify(INITIAL_MEDIA));
      }
    } catch (err) {
      console.warn("localStorage initialization note:", err);
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
    try {
      const evSnap = await getDocs(query(collection(db, "events"), orderBy("createdAt", "desc")));
      if (!evSnap.empty) {
        const items: EventItem[] = [];
        evSnap.forEach((d) => items.push({ ...(d.data() as EventItem), id: d.id }));
        setEventsList(items);
        localStorage.setItem("tesa_events", JSON.stringify(items));
      }

      const teamSnap = await getDocs(collection(db, "team"));
      if (!teamSnap.empty) {
        const items: TeamMember[] = [];
        teamSnap.forEach((d) => items.push({ ...(d.data() as TeamMember), id: d.id }));
        setTeamList(items);
        localStorage.setItem("tesa_team", JSON.stringify(items));
      }

      const facSnap = await getDocs(collection(db, "faculty"));
      if (!facSnap.empty) {
        const items: FacultyMember[] = [];
        facSnap.forEach((d) => items.push({ ...(d.data() as FacultyMember), id: d.id }));
        setFacultyList(items);
        localStorage.setItem("tesa_faculty", JSON.stringify(items));
      }

      const staffSnap = await getDocs(collection(db, "staff"));
      if (!staffSnap.empty) {
        const items: StaffMember[] = [];
        staffSnap.forEach((d) => items.push({ ...(d.data() as StaffMember), id: d.id }));
        setStaffList(items);
        localStorage.setItem("tesa_staff", JSON.stringify(items));
      }

      const regSnap = await getDocs(collection(db, "registrations"));
      if (!regSnap.empty) {
        const items: Registration[] = [];
        regSnap.forEach((d) => items.push({ ...(d.data() as Registration), id: d.id }));
        setRegistrations(items);
        localStorage.setItem("tesa_registrations", JSON.stringify(items));
      }

      const contentSnap = await getDocs(collection(db, "site_content"));
      contentSnap.forEach((d) => {
        if (d.id === "settings") {
          const content = d.data() as SiteContent;
          setSiteContent((prev) => ({ ...prev, ...content }));
          localStorage.setItem("tesa_content", JSON.stringify(content));
        }
      });

      setFirestoreStatus("connected");
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.includes("Database '(default)' not found") || err?.code === "not-found") {
        setFirestoreStatus("not_provisioned");
      }
      console.warn("Firestore sync status:", msg);
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

  // ==========================================
  // EVENT ACTIONS & MEDIA UPLOAD
  // ==========================================

  const handleOpenAddEventModal = () => {
    setEditingEventId(null);
    setEventForm({
      id: "",
      title: "",
      category: "National Conclave",
      date: "",
      venue: "SGGSIE&T Main Auditorium",
      deadline: "",
      capacity: 150,
      status: "open",
      mediaUrl: "",
      summary: "",
      highlights: "",
    });
    setIsEventModalOpen(true);
  };

  const handleOpenEditEventModal = (ev: EventItem) => {
    setEditingEventId(ev.id);
    setEventForm({ ...ev });
    setIsEventModalOpen(true);
  };

  const handleEventMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Banner image exceeds 2MB. Please choose a smaller image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setEventForm((prev) => ({ ...prev, mediaUrl: reader.result as string }));
        showToast("Event banner loaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim() || !eventForm.date.trim()) {
      showToast("Please provide an Event Title and Date.", "error");
      return;
    }

    try {
      setIsSubmittingEvent(true);
      if (editingEventId) {
        const updatedEvents = eventsList.map((ev) =>
          ev.id === editingEventId ? { ...eventForm, id: editingEventId } : ev
        );
        setEventsList(updatedEvents);
        localStorage.setItem("tesa_events", JSON.stringify(updatedEvents));

        try {
          await setDoc(doc(db, "events", editingEventId), {
            ...eventForm,
            updatedAt: serverTimestamp(),
            updatedBy: user?.email || "admin",
          }, { merge: true });
        } catch (err) {}

        showToast("Event updated successfully!");
      } else {
        const newId = `ev-${Date.now()}`;
        const newEvent: EventItem = {
          ...eventForm,
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

        showToast("New event published successfully!");
      }

      setIsEventModalOpen(false);
    } catch (err) {
      console.error(err);
      showToast("Action saved to local session.", "info");
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete event "${title}"?`)) return;

    const filtered = eventsList.filter((ev) => ev.id !== id);
    setEventsList(filtered);
    localStorage.setItem("tesa_events", JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, "events", id));
    } catch (err) {}

    showToast(`Deleted event "${title}".`);
  };

  // ==========================================
  // TEAM ACTIONS & PHOTO UPLOAD
  // ==========================================

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

  const handleOpenEditTeamModal = (member: TeamMember) => {
    setEditingTeamMember(member);
    setTeamForm({
      ...member,
      photoUrl: member.photoUrl || "",
    });
    setSkillsInput(member.skills.join(", "));
    setIsTeamModalOpen(true);
  };

  const handleTeamPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo exceeds 2MB limit. Please choose a smaller image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setTeamForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
        showToast("Member photo loaded!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim() || !teamForm.role.trim()) {
      showToast("Please provide team member Name and Role.", "error");
      return;
    }

    const initials = teamForm.name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const parsedSkills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const memberPayload: TeamMember = {
      ...teamForm,
      photoPlaceholder: teamForm.photoPlaceholder || initials || "TE",
      skills: parsedSkills.length > 0 ? parsedSkills : ["Textile Engineering", "TESA Council"],
    };

    if (editingTeamMember) {
      const updated = teamList.map((m) =>
        m.id === editingTeamMember.id ? { ...memberPayload, id: editingTeamMember.id } : m
      );
      setTeamList(updated);
      localStorage.setItem("tesa_team", JSON.stringify(updated));

      try {
        await setDoc(doc(db, "team", editingTeamMember.id), memberPayload, { merge: true });
      } catch (e) {}

      showToast(`Updated team profile for ${memberPayload.name}!`);
    } else {
      const newId = `lead-${Date.now()}`;
      const newMember = { ...memberPayload, id: newId };
      const updated = [...teamList, newMember];
      setTeamList(updated);
      localStorage.setItem("tesa_team", JSON.stringify(updated));

      try {
        await setDoc(doc(db, "team", newId), newMember);
      } catch (e) {}

      showToast(`Added ${memberPayload.name} to TESA Council!`);
    }

    setIsTeamModalOpen(false);
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the TESA Council?`)) return;

    const filtered = teamList.filter((m) => m.id !== id);
    setTeamList(filtered);
    localStorage.setItem("tesa_team", JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, "team", id));
    } catch (e) {}

    showToast(`Removed ${name} from council.`);
  };

  // ==========================================
  // FACULTY ACTIONS & PHOTO UPLOAD
  // ==========================================

  const handleOpenAddFacultyModal = () => {
    setEditingFacultyId(null);
    setFacultyForm({
      id: "",
      name: "",
      designation: "Assistant Professor",
      qualification: "",
      specialization: "",
      experience: "",
      email: "",
      researchFocus: [],
      photoUrl: "",
    });
    setResearchFocusInput("");
    setIsFacultyModalOpen(true);
  };

  const handleOpenEditFacultyModal = (fac: FacultyMember) => {
    setEditingFacultyId(fac.id);
    setFacultyForm({
      ...fac,
      photoUrl: fac.photoUrl || "",
    });
    setResearchFocusInput(fac.researchFocus.join(", "));
    setIsFacultyModalOpen(true);
  };

  const handleFacultyPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo exceeds 2MB limit. Please choose a smaller image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setFacultyForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
        showToast("Faculty portrait photo loaded!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facultyForm.name.trim() || !facultyForm.email.trim()) {
      showToast("Please provide Faculty Name and Official Email.", "error");
      return;
    }

    const parsedFocus = researchFocusInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const payload: FacultyMember = {
      ...facultyForm,
      researchFocus: parsedFocus.length > 0 ? parsedFocus : ["Textile Engineering"],
    };

    if (editingFacultyId) {
      const updated = facultyList.map((f) =>
        f.id === editingFacultyId ? { ...payload, id: editingFacultyId } : f
      );
      setFacultyList(updated);
      localStorage.setItem("tesa_faculty", JSON.stringify(updated));

      try {
        await setDoc(doc(db, "faculty", editingFacultyId), payload, { merge: true });
      } catch (e) {}

      showToast(`Updated faculty profile for ${payload.name}!`);
    } else {
      const newId = `fac-${Date.now()}`;
      const newFac = { ...payload, id: newId };
      const updated = [...facultyList, newFac];
      setFacultyList(updated);
      localStorage.setItem("tesa_faculty", JSON.stringify(updated));

      try {
        await setDoc(doc(db, "faculty", newId), newFac);
      } catch (e) {}

      showToast(`Added ${payload.name} to Faculty registry!`);
    }

    setIsFacultyModalOpen(false);
  };

  const handleDeleteFaculty = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove faculty member ${name}?`)) return;

    const filtered = facultyList.filter((f) => f.id !== id);
    setFacultyList(filtered);
    localStorage.setItem("tesa_faculty", JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, "faculty", id));
    } catch (e) {}

    showToast(`Removed faculty member ${name}.`);
  };

  // ==========================================
  // STAFF ACTIONS & PHOTO UPLOAD
  // ==========================================

  const handleOpenAddStaffModal = () => {
    setEditingStaffId(null);
    setStaffForm({
      id: "",
      name: "",
      designation: "Laboratory Assistant",
      labAssigned: "Textile Engineering Lab",
      qualification: "",
      experience: "",
      skills: "",
      photoUrl: "",
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaffModal = (stf: StaffMember) => {
    setEditingStaffId(stf.id);
    setStaffForm({
      ...stf,
      photoUrl: stf.photoUrl || "",
    });
    setIsStaffModalOpen(true);
  };

  const handleStaffPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo exceeds 2MB limit. Please choose a smaller image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setStaffForm((prev) => ({ ...prev, photoUrl: reader.result as string }));
        showToast("Staff photo loaded!");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name.trim() || !staffForm.labAssigned.trim()) {
      showToast("Please provide Staff Name and Assigned Laboratory.", "error");
      return;
    }

    if (editingStaffId) {
      const updated = staffList.map((s) =>
        s.id === editingStaffId ? { ...staffForm, id: editingStaffId } : s
      );
      setStaffList(updated);
      localStorage.setItem("tesa_staff", JSON.stringify(updated));

      try {
        await setDoc(doc(db, "staff", editingStaffId), staffForm, { merge: true });
      } catch (e) {}

      showToast(`Updated laboratory staff record for ${staffForm.name}!`);
    } else {
      const newId = `stf-${Date.now()}`;
      const newStaff = { ...staffForm, id: newId };
      const updated = [...staffList, newStaff];
      setStaffList(updated);
      localStorage.setItem("tesa_staff", JSON.stringify(updated));

      try {
        await setDoc(doc(db, "staff", newId), newStaff);
      } catch (e) {}

      showToast(`Added ${staffForm.name} to Technical Staff!`);
    }

    setIsStaffModalOpen(false);
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove staff member ${name}?`)) return;

    const filtered = staffList.filter((s) => s.id !== id);
    setStaffList(filtered);
    localStorage.setItem("tesa_staff", JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, "staff", id));
    } catch (e) {}

    showToast(`Removed staff member ${name}.`);
  };

  // ==========================================
  // REGISTRATIONS & EXCEL EXPORT (XLSX)
  // ==========================================

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
      await updateDoc(doc(db, "registrations", regId), { status: newStatus });
    } catch (err) {}

    showToast(`Registration marked as ${newStatus.toUpperCase()}`);
  };

  const handleDeleteRegistration = async (regId: string) => {
    if (!confirm("Are you sure you want to delete this student registration record?")) return;
    const updated = registrations.filter((r) => r.id !== regId);
    setRegistrations(updated);
    localStorage.setItem("tesa_registrations", JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, "registrations", regId));
    } catch (err) {}

    showToast("Registration record deleted.");
  };

  const handleAddManualRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegForm.studentName || !newRegForm.prn || !newRegForm.email) {
      showToast("Please provide Student Name, PRN, and Email.", "error");
      return;
    }

    const newRecord: Registration = {
      id: `reg-${Date.now().toString().slice(-4)}`,
      studentName: newRegForm.studentName || "",
      prn: newRegForm.prn || "",
      email: newRegForm.email || "",
      department: newRegForm.department || "Textile Technology",
      year: newRegForm.year || "Third Year B.Tech",
      eventTitle: newRegForm.eventTitle || "TEX-CONCLAVE 2026",
      registeredAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: (newRegForm.status as any) || "approved",
    };

    const updated = [newRecord, ...registrations];
    setRegistrations(updated);
    localStorage.setItem("tesa_registrations", JSON.stringify(updated));

    try {
      setDoc(doc(db, "registrations", newRecord.id), newRecord);
    } catch (err) {}

    setIsAddRegModalOpen(false);
    setNewRegForm({
      studentName: "",
      prn: "",
      email: "",
      department: "Textile Technology",
      year: "Third Year B.Tech",
      eventTitle: "TEX-CONCLAVE 2026: National Smart Fibers Symposium",
      status: "approved",
    });
    showToast("Student registration recorded!");
  };

  const handleExportToExcel = () => {
    if (filteredRegistrations.length === 0) {
      showToast("No registrations found to export.", "error");
      return;
    }

    const excelRows = filteredRegistrations.map((r, index) => ({
      "Sr No.": index + 1,
      "Registration ID": r.id,
      "Student Name": r.studentName,
      "PRN Number": r.prn,
      "Email Address": r.email,
      "Department": r.department,
      "Academic Year": r.year,
      "Event Title": r.eventTitle,
      "Registration Timestamp": r.registeredAt,
      "Verification Status": r.status.toUpperCase(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    worksheet["!cols"] = [
      { wch: 8 },  // Sr No.
      { wch: 18 }, // ID
      { wch: 25 }, // Student Name
      { wch: 16 }, // PRN
      { wch: 30 }, // Email
      { wch: 24 }, // Department
      { wch: 20 }, // Year
      { wch: 36 }, // Event Title
      { wch: 22 }, // Timestamp
      { wch: 16 }, // Status
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Event Registrations");

    const today = new Date().toISOString().slice(0, 10);
    const fileName = `TESA_Event_Registrations_${today}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    showToast(`Exported ${excelRows.length} registrations to ${fileName}!`, "success");
  };

  const handleExportCSV = () => {
    if (filteredRegistrations.length === 0) {
      showToast("No registrations to export.", "error");
      return;
    }

    const headers = ["ID", "Student Name", "PRN", "Email", "Department", "Year", "Event Title", "Registered At", "Status"];
    const rows = filteredRegistrations.map((r) => [
      r.id,
      `"${r.studentName}"`,
      r.prn,
      r.email,
      `"${r.department}"`,
      `"${r.year}"`,
      `"${r.eventTitle}"`,
      r.registeredAt,
      r.status,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TESA_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Exported to CSV!");
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

  // ==========================================
  // MEDIA & CMS ACTIONS
  // ==========================================

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaName.trim() || !newMediaUrl.trim()) {
      showToast("Please provide a Media Title and Image URL.", "error");
      return;
    }

    const newAsset: MediaAsset = {
      id: `med-${Date.now()}`,
      name: newMediaName,
      url: newMediaUrl,
      category: newMediaCategory,
      uploadedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newAsset, ...mediaList];
    setMediaList(updated);
    localStorage.setItem("tesa_media", JSON.stringify(updated));

    try {
      setDoc(doc(db, "media", newAsset.id), newAsset);
    } catch (e) {}

    setNewMediaName("");
    setNewMediaUrl("");
    showToast("Media banner added to library!");
  };

  const handleMediaUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("File size exceeds 2MB limit. Please upload a smaller image.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setNewMediaUrl(reader.result);
        if (!newMediaName) {
          setNewMediaName(file.name.replace(/\.[^/.]+$/, ""));
        }
        showToast("Image loaded! Click Add Media to save.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteMedia = (id: string) => {
    const filtered = mediaList.filter((m) => m.id !== id);
    setMediaList(filtered);
    localStorage.setItem("tesa_media", JSON.stringify(filtered));

    try {
      deleteDoc(doc(db, "media", id));
    } catch (e) {}

    showToast("Media asset deleted.");
  };

  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingContent(true);
      localStorage.setItem("tesa_content", JSON.stringify(siteContent));

      try {
        await setDoc(doc(db, "site_content", "settings"), {
          ...siteContent,
          updatedAt: serverTimestamp(),
          updatedBy: user?.email,
        });
      } catch (err) {}

      showToast("Website content and notices updated!");
    } catch (err) {
      showToast("Content saved to local browser storage.", "info");
    } finally {
      setIsSavingContent(false);
    }
  };

  // ==========================================
  // RENDER: AUTH GUARDS & LOADING
  // ==========================================

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#06070a] text-slate-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 font-mono text-xs text-cyan-400">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <span>INITIALIZING TESA ADMIN SECURE CONSOLE...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
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
            Restricted portal for SGGSIE&amp;T Textile Engineering Students Association authorized executives. Sign in with Google to manage faculty, council team, events, and registrations.
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
    );
  }

  // ==========================================
  // RENDER: DASHBOARD INTERFACE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#06070a] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 bg-tech-grid opacity-35" />

      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#06070a]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 hover:border-cyan-500/40 text-[11px] font-mono text-slate-300 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
            >
              <span>←</span>
              <span>Public Website</span>
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-wider">
                  TESA CONTROL SUITE
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  v3.1 PRO
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 hidden sm:block">
                SGGSIE&amp;T Textile Engineering Students Association • Project: tesa-62f59
              </span>
            </div>
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
              {user.photoURL && (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "Admin"}
                  className="w-7 h-7 rounded-full border border-cyan-400/40"
                />
              )}
              <div className="hidden md:block text-left text-xs font-mono">
                <span className="font-bold text-white block leading-none">
                  {user.displayName || "Admin User"}
                </span>
                <span className="text-[10px] text-emerald-400 leading-none">
                  AUTHORIZED
                </span>
              </div>
              <button
                onClick={() => signOut(auth)}
                className="px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 hover:bg-red-950/40 hover:border-red-500/40 hover:text-red-300 text-xs font-mono transition-colors cursor-pointer"
                title="Sign out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Console */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-white/[0.08]">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "events", label: "EVENTS", icon: "📅", count: eventsList.length },
              { id: "team", label: "TESA COUNCIL", icon: "👥", count: teamList.length },
              { id: "faculty_staff", label: "FACULTY & STAFF", icon: "🎓", count: facultyList.length + staffList.length },
              { id: "registrations", label: "REGISTRATIONS", icon: "📋", count: registrations.length },
              { id: "media_cms", label: "MEDIA & CMS", icon: "🖼️", count: mediaList.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-semibold tracking-wide border transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-cyan-500/40 hover:text-white"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? "bg-black/30 text-black font-bold" : "bg-white/10 text-slate-400"
                }`}>
                  {tab.count}
                </span>
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
            className={`mb-6 p-4 rounded-xl text-xs font-mono border transition-all ${
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

        {/* =========================================================================
            TAB 1: EVENT MANAGEMENT
            ========================================================================= */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-md">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  EVENT OPERATIONS
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Events &amp; Symposia Management
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Create, edit, and organize conclaves, hackathons, and laboratory workshops displayed across the website.
                </p>
              </div>
              <button
                onClick={handleOpenAddEventModal}
                className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
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
                      <div className="h-40 w-full overflow-hidden relative">
                        <img src={ev.mediaUrl} alt={ev.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-mono text-cyan-300 border border-cyan-500/30">
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
                          Capacity: {ev.capacity}
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
          </div>
        )}

        {/* =========================================================================
            TAB 2: TESA TEAM MANAGEMENT (With Photo Edit & Upload)
            ========================================================================= */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-md">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  COUNCIL DIRECTORY
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  TESA Leadership Team Management
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage student council executives, designations, technical specializations, and profile photos.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenAddTeamModal}
                  className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer"
                >
                  <span>+</span>
                  <span>Add Council Member</span>
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              {[
                { id: "all", label: "ALL MEMBERS" },
                { id: "core", label: "CORE COUNCIL" },
                { id: "technical", label: "TECHNICAL & R&D" },
                { id: "events", label: "EVENTS & OPERATIONS" },
                { id: "outreach", label: "OUTREACH & ALUMNI" },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setTeamCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    teamCategoryFilter === c.id
                      ? "bg-white/10 text-cyan-300 border border-cyan-400/40"
                      : "bg-black/40 text-slate-400 border border-white/5 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Team Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {teamList
                .filter((m) => teamCategoryFilter === "all" || m.category === teamCategoryFilter)
                .map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/40 transition-all font-mono"
                  >
                    <div>
                      {/* Avatar Image / Monogram Badge & Category */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-14 h-14 rounded-2xl border border-cyan-400/40 overflow-hidden flex items-center justify-center font-bold text-cyan-300 text-lg shadow-[0_0_15px_rgba(6,182,212,0.25)] bg-gradient-to-br from-cyan-500/20 to-blue-600/30 shrink-0">
                          {member.photoUrl ? (
                            <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                          ) : (
                            member.photoPlaceholder
                          )}
                        </div>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                          {member.category}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mb-0.5">
                        {member.name}
                      </h3>
                      <div className="text-xs text-cyan-400 font-semibold mb-1">
                        {member.role}
                      </div>
                      <div className="text-[10px] text-slate-400 mb-3">
                        {member.designation} • {member.year}
                      </div>

                      <p className="text-xs text-slate-300 font-normal mb-3 line-clamp-3">
                        {member.bio}
                      </p>

                      <div className="text-[10px] text-purple-300 mb-3">
                        ⚡ {member.specialization}
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {member.skills.map((s, idx) => (
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
                        className="flex-1 py-1.5 rounded-lg bg-white/[0.05] hover:bg-cyan-950/60 hover:text-cyan-300 text-xs text-slate-300 border border-white/10 transition-colors cursor-pointer text-center"
                      >
                        ✏ Edit Info &amp; Photo
                      </button>
                      <button
                        onClick={() => handleDeleteTeamMember(member.id, member.name)}
                        className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-xs text-red-300 transition-colors cursor-pointer"
                        title="Delete member"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: FACULTY & STAFF MANAGEMENT (With Photo Edit & Upload)
            ========================================================================= */}
        {activeTab === "faculty_staff" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-md">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  DEPARTMENT REGISTRY
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Faculty &amp; Technical Staff Management
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Maintain records, designations, research focus, operational skills, and official profile photos.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {facStaffSubTab === "faculty" ? (
                  <button
                    onClick={handleOpenAddFacultyModal}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer"
                  >
                    <span>+</span>
                    <span>Add Faculty Member</span>
                  </button>
                ) : (
                  <button
                    onClick={handleOpenAddStaffModal}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 cursor-pointer"
                  >
                    <span>+</span>
                    <span>Add Technical Staff</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sub-Tabs: Faculty vs Staff */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-3">
              <button
                onClick={() => setFacStaffSubTab("faculty")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  facStaffSubTab === "faculty"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                    : "bg-white/[0.03] text-slate-400 border border-white/5 hover:text-white"
                }`}
              >
                PROFESSORS &amp; FACULTY ({facultyList.length})
              </button>
              <button
                onClick={() => setFacStaffSubTab("staff")}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  facStaffSubTab === "staff"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50"
                    : "bg-white/[0.03] text-slate-400 border border-white/5 hover:text-white"
                }`}
              >
                LABORATORY &amp; TECHNICAL STAFF ({staffList.length})
              </button>
            </div>

            {/* FACULTY VIEW */}
            {facStaffSubTab === "faculty" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {facultyList.map((fac) => (
                  <div
                    key={fac.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-md flex flex-col justify-between hover:border-cyan-500/40 transition-all font-mono"
                  >
                    <div>
                      {/* Photo / Monogram & Designation */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl border border-cyan-400/40 overflow-hidden flex items-center justify-center font-bold text-cyan-300 text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)] bg-cyan-950/60 shrink-0">
                            {fac.photoUrl ? (
                              <img src={fac.photoUrl} alt={fac.name} className="w-full h-full object-cover" />
                            ) : (
                              fac.name.split(" ").map((w) => w[0]).filter((c) => c && c.match(/[A-Za-z]/)).slice(0, 2).join("") || "DR"
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 uppercase inline-block mb-1">
                              {fac.designation}
                            </span>
                            <h3 className="text-base font-bold text-white line-clamp-1">
                              {fac.name}
                            </h3>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {fac.experience}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-normal mb-3">
                        🎓 {fac.qualification}
                      </p>

                      <div className="text-xs text-cyan-200/90 mb-3 leading-relaxed">
                        <strong className="text-slate-400 block text-[10px] uppercase">Specialization:</strong>
                        {fac.specialization}
                      </div>

                      <div className="text-xs text-slate-400 mb-4">
                        📧 <a href={`mailto:${fac.email}`} className="text-cyan-400 underline">{fac.email}</a>
                      </div>

                      <div className="mb-4">
                        <span className="text-[10px] uppercase text-slate-400 block mb-1.5">
                          Research Focus:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {fac.researchFocus.map((rf, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded bg-white/[0.05] border border-white/5 text-[10px] text-slate-300"
                            >
                              {rf}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditFacultyModal(fac)}
                        className="flex-1 py-1.5 rounded-lg bg-white/[0.05] hover:bg-cyan-950/60 hover:text-cyan-300 text-xs text-slate-300 border border-white/10 transition-colors cursor-pointer text-center"
                      >
                        ✏ Edit Details &amp; Photo
                      </button>
                      <button
                        onClick={() => handleDeleteFaculty(fac.id, fac.name)}
                        className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-xs text-red-300 transition-colors cursor-pointer"
                        title="Delete faculty"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* STAFF VIEW */}
            {facStaffSubTab === "staff" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staffList.map((stf) => (
                  <div
                    key={stf.id}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 backdrop-blur-md flex flex-col justify-between hover:border-teal-500/40 transition-all font-mono"
                  >
                    <div>
                      {/* Photo / Monogram & Designation */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-2xl border border-teal-400/40 overflow-hidden flex items-center justify-center font-bold text-teal-300 text-sm shadow-[0_0_15px_rgba(20,184,166,0.2)] bg-teal-950/60 shrink-0">
                            {stf.photoUrl ? (
                              <img src={stf.photoUrl} alt={stf.name} className="w-full h-full object-cover" />
                            ) : (
                              stf.name.split(" ").map((w) => w[0]).filter((c) => c && c.match(/[A-Za-z]/)).slice(0, 2).join("") || "ST"
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-950/80 text-teal-300 border border-teal-500/30 uppercase inline-block mb-1">
                              {stf.designation}
                            </span>
                            <h3 className="text-base font-bold text-white line-clamp-1">
                              {stf.name}
                            </h3>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {stf.experience}
                        </span>
                      </div>

                      <div className="text-xs text-teal-300 font-semibold mb-2">
                        🏭 {stf.labAssigned}
                      </div>

                      <p className="text-xs text-slate-300 font-normal mb-3">
                        {stf.qualification}
                      </p>

                      <div className="text-xs text-slate-400 leading-relaxed mb-4">
                        <strong className="text-slate-300 block text-[10px] uppercase mb-1">Operational Skills:</strong>
                        {stf.skills}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditStaffModal(stf)}
                        className="flex-1 py-1.5 rounded-lg bg-white/[0.05] hover:bg-teal-950/60 hover:text-teal-300 text-xs text-slate-300 border border-white/10 transition-colors cursor-pointer text-center"
                      >
                        ✏ Edit Details &amp; Photo
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(stf.id, stf.name)}
                        className="py-1.5 px-3 rounded-lg bg-red-950/40 hover:bg-red-900 border border-red-500/30 text-xs text-red-300 transition-colors cursor-pointer"
                        title="Delete staff"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: REGISTRATION MANAGEMENT & EXCEL EXPORT (XLSX)
            ========================================================================= */}
        {activeTab === "registrations" && (
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  PARTICIPANT MANAGEMENT &amp; EXCEL EXPORT
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Student Event Registrations
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Verify candidate PRNs, change approval status, and export full reports directly to native Excel (.xlsx).
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => setIsAddRegModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 hover:border-cyan-400 text-xs font-mono text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+</span>
                  <span>On-Spot Entry</span>
                </button>

                <button
                  onClick={handleExportToExcel}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer"
                  title="Export to formatted Microsoft Excel (.xlsx)"
                >
                  <span>📊</span>
                  <span>Export to Excel (.xlsx)</span>
                </button>

                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
                  title="Export to raw CSV"
                >
                  CSV
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 p-4 rounded-xl bg-black/40 border border-white/10">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Search Candidates</label>
                <input
                  type="text"
                  placeholder="Student name, PRN, email..."
                  value={registrationSearch}
                  onChange={(e) => setRegistrationSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/80 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Filter by Event</label>
                <select
                  value={filterEvent}
                  onChange={(e) => setFilterEvent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/80 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                >
                  <option value="all">All Events</option>
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.title}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Filter by Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/80 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="approved">Approved Only</option>
                  <option value="pending">Pending Only</option>
                  <option value="rejected">Rejected Only</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead className="bg-cyan-950/40 text-cyan-300 text-[11px] uppercase border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Student &amp; PRN</th>
                    <th className="py-3 px-4">Event Target</th>
                    <th className="py-3 px-4">Department &amp; Year</th>
                    <th className="py-3 px-4">Registered At</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-950/40">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No registrations matching your search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((reg) => (
                      <tr key={reg.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">
                            {reg.studentName}
                          </span>
                          <span className="text-[10px] text-cyan-400">
                            {reg.prn} • {reg.email}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          {reg.eventTitle}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          <div>{reg.department}</div>
                          <span className="text-[10px] text-slate-500">{reg.year}</span>
                        </td>
                        <td className="py-3 px-4 text-[10px] text-slate-400">
                          {reg.registeredAt}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              reg.status === "approved"
                                ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/40"
                                : reg.status === "rejected"
                                ? "bg-red-950/90 text-red-300 border border-red-500/40"
                                : "bg-amber-950/90 text-amber-300 border border-amber-500/40"
                            }`}
                          >
                            {reg.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          {reg.status !== "approved" && (
                            <button
                              onClick={() => handleUpdateRegStatus(reg.id, "approved")}
                              className="px-2 py-1 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-[10px] uppercase font-bold cursor-pointer"
                              title="Approve registration"
                            >
                              Approve
                            </button>
                          )}
                          {reg.status !== "rejected" && (
                            <button
                              onClick={() => handleUpdateRegStatus(reg.id, "rejected")}
                              className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 text-[10px] uppercase font-bold cursor-pointer"
                              title="Reject registration"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteRegistration(reg.id)}
                            className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/10 text-slate-400 hover:text-white text-[10px] cursor-pointer"
                            title="Delete record"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: MEDIA & SITE CMS MANAGEMENT
            ========================================================================= */}
        {activeTab === "media_cms" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Media Asset Manager */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-md">
              <div className="mb-6">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  DIGITAL ASSET VAULT
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Media Library &amp; Banners
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload promotional banners, event images, portrait photos, and research assets.
                </p>
              </div>

              {/* Add Media Form */}
              <form onSubmit={handleAddMedia} className="space-y-4 p-4 rounded-xl bg-black/40 border border-white/10 mb-6 font-mono text-xs">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Media Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart Looms Lab Banner"
                    value={newMediaName}
                    onChange={(e) => setNewMediaName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 uppercase mb-1">Category</label>
                    <select
                      value={newMediaCategory}
                      onChange={(e) => setNewMediaCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                    >
                      <option value="event">Event Banner</option>
                      <option value="lab">Lab Facility</option>
                      <option value="portrait">Member / Faculty Portrait</option>
                      <option value="banner">Ribbon Banner</option>
                      <option value="general">General Asset</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 uppercase mb-1">Upload File (Max 2MB)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMediaUploadFile}
                      className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 text-slate-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 uppercase mb-1">Or Direct Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                  />
                </div>

                {newMediaUrl && (
                  <div className="h-24 w-full rounded-lg overflow-hidden border border-cyan-500/30">
                    <img src={newMediaUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  + Add Media to Vault
                </button>
              </form>

              {/* Media Gallery */}
              <h3 className="text-sm font-bold font-mono text-white mb-3">Saved Media Assets ({mediaList.length})</h3>
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1">
                {mediaList.map((m) => (
                  <div
                    key={m.id}
                    className="group relative rounded-xl border border-white/10 bg-black/40 overflow-hidden font-mono text-xs"
                  >
                    <div className="h-28 w-full overflow-hidden">
                      <img src={m.url} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="p-2.5">
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/20">
                        {m.category}
                      </span>
                      <h4 className="text-[11px] font-bold text-white mt-1 line-clamp-1">{m.name}</h4>
                      <div className="flex items-center justify-between gap-1 mt-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(m.url);
                            showToast("Copied image URL to clipboard!");
                          }}
                          className="px-2 py-0.5 rounded bg-white/[0.08] hover:bg-white/20 text-[9px] text-cyan-300 cursor-pointer"
                        >
                          Copy URL
                        </button>
                        <button
                          onClick={() => handleDeleteMedia(m.id)}
                          className="px-1.5 py-0.5 rounded bg-red-950/60 hover:bg-red-900 text-[9px] text-red-300 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Site Content CMS */}
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-md">
              <div className="mb-6">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block mb-1">
                  CMS CONTROL PANEL
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Website Copy &amp; Ribbons
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Edit site-wide notification banners, hero headlines, registration status, and department notices.
                </p>
              </div>

              <form onSubmit={handleSaveSiteContent} className="space-y-5 font-mono text-xs">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Top Announcement Ribbon</label>
                  <input
                    type="text"
                    value={siteContent.announcementBanner}
                    onChange={(e) => setSiteContent({ ...siteContent, announcementBanner: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 uppercase mb-1">Hero Primary Headline</label>
                  <input
                    type="text"
                    value={siteContent.heroHeadline}
                    onChange={(e) => setSiteContent({ ...siteContent, heroHeadline: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 uppercase mb-1">Hero Subheadline</label>
                  <textarea
                    rows={3}
                    value={siteContent.heroSubheadline}
                    onChange={(e) => setSiteContent({ ...siteContent, heroSubheadline: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 uppercase mb-1">Target Conclave Dates</label>
                    <input
                      type="text"
                      value={siteContent.upcomingConclaveDate}
                      onChange={(e) => setSiteContent({ ...siteContent, upcomingConclaveDate: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 uppercase mb-1">Registration Portal State</label>
                    <select
                      value={siteContent.registrationStatus}
                      onChange={(e) => setSiteContent({ ...siteContent, registrationStatus: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                    >
                      <option value="OPEN">REGISTRATIONS OPEN</option>
                      <option value="CLOSING SOON">CLOSING SOON</option>
                      <option value="CLOSED">REGISTRATIONS CLOSED</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 uppercase mb-1">Department Lab &amp; Research Notice</label>
                  <textarea
                    rows={2}
                    value={siteContent.departmentNotice}
                    onChange={(e) => setSiteContent({ ...siteContent, departmentNotice: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSavingContent}
                  className="w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer"
                >
                  {isSavingContent ? "SAVING..." : "COMMIT WEBSITE CHANGES →"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: ADD / EDIT EVENT (With Media Banner Upload & Presets)
          ========================================================================= */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-950 border border-white/10 rounded-2xl p-6 sm:p-8 my-8 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingEventId ? "Edit Event Details & Banner" : "Publish New Event"}
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4">
              <div>
                <label className="block text-slate-300 uppercase mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NATIONAL WEAVING HACKATHON 2026"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={eventForm.category}
                    onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="National Conclave">National Conclave</option>
                    <option value="Technical Hackathon">Technical Hackathon</option>
                    <option value="Laboratory Workshop">Laboratory Workshop</option>
                    <option value="Industrial Tour">Industrial Tour</option>
                    <option value="Research Webinar">Research Webinar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 uppercase mb-1">Event Date(s) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. April 28–29, 2026"
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Venue</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Deadline</label>
                  <input
                    type="text"
                    value={eventForm.deadline}
                    onChange={(e) => setEventForm({ ...eventForm, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Status</label>
                  <select
                    value={eventForm.status}
                    onChange={(e) => setEventForm({ ...eventForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="open">Registration Open</option>
                    <option value="upcoming">Coming Soon</option>
                    <option value="closed">Registration Closed</option>
                  </select>
                </div>
              </div>

              {/* Media Banner Section with Upload & URL */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 uppercase font-bold text-[11px]">
                    Event Media Banner (Upload File or URL)
                  </label>
                  <span className="text-[10px] text-cyan-400">PNG, JPG, WebP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEventMediaUpload}
                    className="w-full text-[10px] file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 cursor-pointer text-slate-400"
                  />
                  <input
                    type="url"
                    placeholder="Or paste external banner URL..."
                    value={eventForm.mediaUrl}
                    onChange={(e) => setEventForm({ ...eventForm, mediaUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white text-[11px]"
                  />
                </div>

                {eventForm.mediaUrl && (
                  <div className="relative h-28 w-full rounded-lg overflow-hidden border border-cyan-500/30">
                    <img src={eventForm.mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEventForm({ ...eventForm, mediaUrl: "" })}
                      className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 hover:bg-red-950 text-[10px] text-red-300 border border-red-500/30 cursor-pointer"
                    >
                      Remove Banner
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Summary Description</label>
                <textarea
                  rows={2}
                  required
                  value={eventForm.summary}
                  onChange={(e) => setEventForm({ ...eventForm, summary: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Highlights / Cash Pool / Perks</label>
                <input
                  type="text"
                  value={eventForm.highlights}
                  onChange={(e) => setEventForm({ ...eventForm, highlights: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase tracking-wider cursor-pointer"
                >
                  {isSubmittingEvent ? "Saving..." : "Confirm & Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT TESA TEAM MEMBER (With Photo Edit Option)
          ========================================================================= */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-950 border border-white/10 rounded-2xl p-6 sm:p-8 my-8 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingTeamMember ? "Edit Council Member Profile" : "Add Council Member"}
              </h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTeamMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aarav Deshmukh"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Council Role *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. President / Vice President"
                    value={teamForm.role}
                    onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              {/* PHOTO UPLOAD & URL EDIT SECTION */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 uppercase font-bold text-[11px]">
                    Member Profile Photo (File Upload or URL)
                  </label>
                  <span className="text-[10px] text-cyan-400">PNG, JPG, WebP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTeamPhotoUpload}
                    className="w-full text-[10px] file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 cursor-pointer text-slate-400"
                  />
                  <input
                    type="url"
                    placeholder="Or paste image URL (https://...)"
                    value={teamForm.photoUrl || ""}
                    onChange={(e) => setTeamForm({ ...teamForm, photoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white text-[11px]"
                  />
                </div>

                {/* Sample Presets Quick Pick */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[9px] text-slate-500 uppercase">Presets:</span>
                  {SAMPLE_PORTRAITS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setTeamForm({ ...teamForm, photoUrl: p.url })}
                      className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-cyan-950/60 hover:text-cyan-300 border border-white/10 text-[9px] text-slate-300 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Photo Preview & Monogram Fallback */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-14 h-14 rounded-2xl border border-cyan-400/50 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                    {teamForm.photoUrl ? (
                      <img src={teamForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-cyan-300 text-base">
                        {teamForm.photoPlaceholder || (teamForm.name ? teamForm.name.slice(0, 2).toUpperCase() : "PH")}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex-1">
                    {teamForm.photoUrl ? (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">✔ Custom profile photo attached</span>
                        <button
                          type="button"
                          onClick={() => setTeamForm({ ...teamForm, photoUrl: "" })}
                          className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <span>No photo set — will display stylized monogram initials badge.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Executive Head"
                    value={teamForm.designation}
                    onChange={(e) => setTeamForm({ ...teamForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Academic Year</label>
                  <select
                    value={teamForm.year}
                    onChange={(e) => setTeamForm({ ...teamForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="Final Year B.Tech">Final Year B.Tech</option>
                    <option value="Third Year B.Tech">Third Year B.Tech</option>
                    <option value="Second Year B.Tech">Second Year B.Tech</option>
                    <option value="M.Tech Scholar">M.Tech Scholar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Category</label>
                  <select
                    value={teamForm.category}
                    onChange={(e) => setTeamForm({ ...teamForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="core">Core Council</option>
                    <option value="technical">Technical Track</option>
                    <option value="events">Events &amp; Logistics</option>
                    <option value="outreach">Outreach &amp; PR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Technical Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Smart & Conductive Textiles"
                  value={teamForm.specialization}
                  onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Key Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. E-Textiles, Leadership, CAD"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Bio Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of council initiatives, research, and responsibilities..."
                  value={teamForm.bio}
                  onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTeamModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT FACULTY (With Photo Edit Option)
          ========================================================================= */}
      {isFacultyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-950 border border-white/10 rounded-2xl p-6 sm:p-8 my-8 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingFacultyId ? "Edit Faculty Profile" : "Add Faculty Member"}
              </h3>
              <button
                onClick={() => setIsFacultyModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveFaculty} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Faculty Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Ravindra V. Adivarekar"
                    value={facultyForm.name}
                    onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Designation</label>
                  <select
                    value={facultyForm.designation}
                    onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="Professor & Head of Department">Professor &amp; Head of Department</option>
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Adjunct Professor">Adjunct Professor</option>
                  </select>
                </div>
              </div>

              {/* FACULTY PHOTO UPLOAD & URL EDIT SECTION */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 uppercase font-bold text-[11px]">
                    Faculty Portrait Photo (File Upload or URL)
                  </label>
                  <span className="text-[10px] text-cyan-400">PNG, JPG, WebP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFacultyPhotoUpload}
                    className="w-full text-[10px] file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:bg-cyan-500 file:text-black hover:file:bg-cyan-400 cursor-pointer text-slate-400"
                  />
                  <input
                    type="url"
                    placeholder="Or paste portrait image URL..."
                    value={facultyForm.photoUrl || ""}
                    onChange={(e) => setFacultyForm({ ...facultyForm, photoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white text-[11px]"
                  />
                </div>

                {/* Presets Quick Pick */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[9px] text-slate-500 uppercase">Presets:</span>
                  {SAMPLE_PORTRAITS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setFacultyForm({ ...facultyForm, photoUrl: p.url })}
                      className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-cyan-950/60 hover:text-cyan-300 border border-white/10 text-[9px] text-slate-300 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Photo Preview & Monogram Fallback */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-14 h-14 rounded-2xl border border-cyan-400/50 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                    {facultyForm.photoUrl ? (
                      <img src={facultyForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-cyan-300 text-base">
                        {facultyForm.name ? facultyForm.name.slice(0, 2).toUpperCase() : "DR"}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex-1">
                    {facultyForm.photoUrl ? (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">✔ Faculty portrait attached</span>
                        <button
                          type="button"
                          onClick={() => setFacultyForm({ ...facultyForm, photoUrl: "" })}
                          className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <span>No photo set — will display academic crest monogram.</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Qualifications</label>
                <input
                  type="text"
                  placeholder="e.g. Ph.D. (Tech) Textile Chemistry, ICT Mumbai"
                  value={facultyForm.qualification}
                  onChange={(e) => setFacultyForm({ ...facultyForm, qualification: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 25+ Years Experience"
                    value={facultyForm.experience}
                    onChange={(e) => setFacultyForm({ ...facultyForm, experience: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="hod.textile@sggs.ac.in"
                    value={facultyForm.email}
                    onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Eco-Friendly Wet Processing, Natural Dyeing"
                  value={facultyForm.specialization}
                  onChange={(e) => setFacultyForm({ ...facultyForm, specialization: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Research Focus (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Green Chemistry, Nanoparticle Finishing, Plasma Technology"
                  value={researchFocusInput}
                  onChange={(e) => setResearchFocusInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFacultyModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Faculty Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD / EDIT STAFF (With Photo Edit Option)
          ========================================================================= */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-950 border border-white/10 rounded-2xl p-6 sm:p-8 my-8 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingStaffId ? "Edit Technical Staff Record" : "Add Technical Staff"}
              </h3>
              <button
                onClick={() => setIsStaffModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Staff Member Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Sunil V. Rathod"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Designation</label>
                  <select
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="Senior Technical Superintendent">Senior Technical Superintendent</option>
                    <option value="Laboratory Assistant">Laboratory Assistant</option>
                    <option value="Technical Instructor">Technical Instructor</option>
                    <option value="Senior Testing Assistant">Senior Testing Assistant</option>
                    <option value="CAD/CAM & Computation Lab Assistant">CAD/CAM &amp; Computation Lab Assistant</option>
                  </select>
                </div>
              </div>

              {/* STAFF PHOTO UPLOAD & URL EDIT SECTION */}
              <div className="p-4 rounded-xl border border-white/10 bg-black/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-200 uppercase font-bold text-[11px]">
                    Staff Member Photo (File Upload or URL)
                  </label>
                  <span className="text-[10px] text-teal-400">PNG, JPG, WebP</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleStaffPhotoUpload}
                    className="w-full text-[10px] file:mr-2 file:py-1.5 file:px-2.5 file:rounded-lg file:border-0 file:bg-teal-500 file:text-black hover:file:bg-teal-400 cursor-pointer text-slate-400"
                  />
                  <input
                    type="url"
                    placeholder="Or paste staff image URL..."
                    value={staffForm.photoUrl || ""}
                    onChange={(e) => setStaffForm({ ...staffForm, photoUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 focus:border-teal-400 text-white text-[11px]"
                  />
                </div>

                {/* Presets Quick Pick */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[9px] text-slate-500 uppercase">Presets:</span>
                  {SAMPLE_PORTRAITS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setStaffForm({ ...staffForm, photoUrl: p.url })}
                      className="px-2 py-0.5 rounded bg-white/[0.05] hover:bg-teal-950/60 hover:text-teal-300 border border-white/10 text-[9px] text-slate-300 cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Photo Preview & Monogram Fallback */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-14 h-14 rounded-2xl border border-teal-400/50 bg-slate-900 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                    {staffForm.photoUrl ? (
                      <img src={staffForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-teal-300 text-base">
                        {staffForm.name ? staffForm.name.slice(0, 2).toUpperCase() : "ST"}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex-1">
                    {staffForm.photoUrl ? (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-400 font-semibold">✔ Staff photo attached</span>
                        <button
                          type="button"
                          onClick={() => setStaffForm({ ...staffForm, photoUrl: "" })}
                          className="px-2 py-0.5 rounded bg-red-950/60 text-red-300 border border-red-500/30 hover:bg-red-900 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <span>No photo set — will display technical staff badge.</span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Assigned Laboratory Floor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fabric Weaving & Loom Shed"
                  value={staffForm.labAssigned}
                  onChange={(e) => setStaffForm({ ...staffForm, labAssigned: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Qualification</label>
                  <input
                    type="text"
                    placeholder="e.g. Diploma in Textile Manufacturing (DTM)"
                    value={staffForm.qualification}
                    onChange={(e) => setStaffForm({ ...staffForm, qualification: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Experience</label>
                  <input
                    type="text"
                    placeholder="e.g. 22 Years"
                    value={staffForm.experience}
                    onChange={(e) => setStaffForm({ ...staffForm, experience: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Machine &amp; Operational Skills</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Electronic Jacquard Card Punching, Rapier Loom Timing Calibration, Loom Maintenance..."
                  value={staffForm.skills}
                  onChange={(e) => setStaffForm({ ...staffForm, skills: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Staff Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD MANUAL ON-SPOT REGISTRATION
          ========================================================================= */}
      {isAddRegModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-950 border border-white/10 rounded-2xl p-6 sm:p-8 my-8 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-lg font-bold text-white">
                Record On-Spot Student Registration
              </h3>
              <button
                onClick={() => setIsAddRegModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualRegistration} className="space-y-4">
              <div>
                <label className="block text-slate-300 uppercase mb-1">Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shruti Patil"
                  value={newRegForm.studentName}
                  onChange={(e) => setNewRegForm({ ...newRegForm, studentName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">College PRN / Roll *</label>
                  <input
                    type="text"
                    required
                    placeholder="2023BTE055"
                    value={newRegForm.prn}
                    onChange={(e) => setNewRegForm({ ...newRegForm, prn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="2023bte055@sggs.ac.in"
                    value={newRegForm.email}
                    onChange={(e) => setNewRegForm({ ...newRegForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Department</label>
                  <select
                    value={newRegForm.department}
                    onChange={(e) => setNewRegForm({ ...newRegForm, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="Textile Technology">Textile Technology</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics & Telecommunication">Electronics &amp; Telecom</option>
                    <option value="Chemical Engineering">Chemical Engineering</option>
                    <option value="Other Institution">Other Institution</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 uppercase mb-1">Academic Year</label>
                  <select
                    value={newRegForm.year}
                    onChange={(e) => setNewRegForm({ ...newRegForm, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                  >
                    <option value="First Year B.Tech">First Year B.Tech</option>
                    <option value="Second Year B.Tech">Second Year B.Tech</option>
                    <option value="Third Year B.Tech">Third Year B.Tech</option>
                    <option value="Final Year B.Tech">Final Year B.Tech</option>
                    <option value="M.Tech Scholar">M.Tech Scholar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Target Event</label>
                <select
                  value={newRegForm.eventTitle}
                  onChange={(e) => setNewRegForm({ ...newRegForm, eventTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                >
                  {eventsList.map((ev) => (
                    <option key={ev.id} value={ev.title}>
                      {ev.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 uppercase mb-1">Initial Status</label>
                <select
                  value={newRegForm.status}
                  onChange={(e) => setNewRegForm({ ...newRegForm, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/10 focus:border-cyan-400 text-white"
                >
                  <option value="approved">Approved (Spot Verified)</option>
                  <option value="pending">Pending Document Verification</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddRegModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-bold uppercase tracking-wider cursor-pointer"
                >
                  Register Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
