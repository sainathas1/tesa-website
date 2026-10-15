"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

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

const TEAM_MEMBERS: TeamMember[] = [

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

export default function TesaTeamSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [teamList, setTeamList] = useState<TeamMember[]>(TEAM_MEMBERS);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("tesa_team");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTeamList(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Track scroll progress across this section for 3D parallax
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 20,
    restDelta: 0.001,
  });

  // Parallax transforms for staggered columns in 3D
  const col1Y = useTransform(smoothProgress, [0, 1], [60, -60]);
  const col2Y = useTransform(smoothProgress, [0, 1], [-40, 40]);
  const rotateX = useTransform(smoothProgress, [0, 0.5, 1], [8, 0, -8]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.96, 1, 0.96]);

  const filteredMembers =
    activeCategory === "all"
      ? teamList
      : teamList.filter((m) => m.category === activeCategory);


  return (
    <section
      id="team"
      ref={containerRef}
      className="relative w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] overflow-hidden bg-[#06070a]"
    >
      {/* Background Ambience & Engineering Lattice */}
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-30" />
      <div className="pointer-events-none absolute top-1/4 right-0 w-[500px] h-[500px] bg-cyan-500/5 blur-3xl rounded-full" />
      <div className="pointer-events-none absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] sm:text-xs font-mono text-cyan-300 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>TESA STUDENT COUNCIL • 2025–2026 TENURE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            MEET THE{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              TESA TEAM
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            The visionary student leaders, research innovators, and event coordinators driving textile engineering excellence and technology-driven symposiums at SGGSIE&amp;T.
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
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg border transition-all duration-200 ${
                  activeCategory === tab.id
                    ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-cyan-500/30 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Scrolling Parallax Grid Container */}
        <motion.div
          style={{
            perspective: 1200,
            rotateX: rotateX,
            scale: scale,
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7 transition-all duration-300"
        >
          {filteredMembers.map((member, index) => {
            // Apply alternating vertical parallax motion to odd vs even cards
            const colMotionY = index % 2 === 0 ? col1Y : col2Y;

            return (
              <motion.div
                key={member.id}
                style={{ y: colMotionY }}
                whileHover={{
                  y: -10,
                  rotateY: index % 2 === 0 ? 3 : -3,
                  scale: 1.02,
                  transition: { duration: 0.25 },
                }}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] via-slate-900/40 to-black/80 backdrop-blur-md p-5 sm:p-6 overflow-hidden shadow-xl hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] transition-colors"
              >
                {/* Corner Crosshair HUD accents */}
                <span className="pointer-events-none absolute top-2.5 left-2.5 font-mono text-[9px] text-cyan-500/40">
                  +
                </span>
                <span className="pointer-events-none absolute top-2.5 right-2.5 font-mono text-[9px] text-cyan-500/40">
                  +
                </span>

                {/* Upper: Photo Placeholder Frame */}
                <div>
                  <div className="relative w-full aspect-square mb-4 rounded-xl border border-dashed border-cyan-500/30 bg-gradient-to-br from-slate-950 via-[#0a0f18] to-slate-900/80 p-2 flex flex-col items-center justify-center overflow-hidden group-hover:border-cyan-400/70 transition-colors">
                    {/* Animated background radial within photo slot */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-tr ${member.accentColor} opacity-50 group-hover:opacity-100 transition-opacity blur-xl`}
                    />

                    {/* Photo Display / Placeholder Emblem */}
                    {member.photoUrl ? (
                      <div className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-cyan-400/70 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.3)] group-hover:scale-105 transition-transform">
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-cyan-500/40 bg-black/70 flex flex-col items-center justify-center shadow-inner group-hover:scale-105 transition-transform">
                        <span className="font-mono text-xl sm:text-2xl font-black text-cyan-300">
                          {member.photoPlaceholder}
                        </span>
                        <span className="text-[8px] font-mono tracking-widest text-slate-400 uppercase mt-0.5">
                          PHOTO
                        </span>
                      </div>
                    )}

                    {/* Member Year Badge */}
                    <span className="absolute bottom-2.5 right-2.5 z-10 text-[9px] font-mono px-2 py-0.5 rounded bg-black/80 text-cyan-400 border border-cyan-500/30">
                      {member.year}
                    </span>
                  </div>

                  {/* Member Name & Role */}
                  <div className="mb-3">
                    <div className="inline-block px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 uppercase tracking-wider mb-1.5">
                      {member.role}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight">
                      {member.name}
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      {member.designation}
                    </p>
                  </div>

                  {/* Bio Description */}
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    {member.bio}
                  </p>
                </div>

                {/* Lower: Specialization & Technical Badges */}
                <div className="pt-3 border-t border-white/[0.08]">
                  <div className="text-[10px] font-mono text-cyan-400/80 uppercase tracking-wider mb-2">
                    FOCUS: {member.specialization}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {member.skills.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/[0.08]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Council Contact Banner */}
        <div className="mt-12 sm:mt-16 text-center">
          <p className="text-xs font-mono text-slate-400">
            WANT TO CONTRIBUTE TO THE TESA STUDENT BODY?{" "}
            <a
              href="#register"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 font-semibold"
            >
              APPLY FOR TESA 2026 SUB-COMMITTEES →
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
