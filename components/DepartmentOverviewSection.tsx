"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

interface FacultyMember {
  name: string;
  designation: string;
  qualification: string;
  specialization: string;
  experience: string;
  email: string;
  researchFocus: string[];
  photoUrl?: string;
}

interface StaffMember {
  name: string;
  designation: string;
  labAssigned: string;
  qualification: string;
  experience: string;
  skills: string;
  photoUrl?: string;
}

interface LabFacility {
  id: string;
  name: string;
  shortCode: string;
  description: string;
  keyEquipments: string[];
  industrialApplication: string;
}

const FACULTY_LIST: FacultyMember[] = [
  {
    name: "Dr. Ravindra V. Adivarekar",
    designation: "Professor & Head of Department",
    qualification: "Ph.D. (Tech) Textile Chemistry, ICT Mumbai",
    specialization: "Eco-Friendly Wet Processing, Natural Dyeing & Surface Functionalization",
    experience: "28+ Years Academic & Research",
    email: "hod.textile@sggs.ac.in",
    researchFocus: ["Green Chemistry", "Nanoparticle Finishing", "Plasma Technology"],
  },
  {
    name: "Dr. Arvind S. Patil",
    designation: "Professor",
    qualification: "Ph.D. Textile Technology, IIT Delhi",
    specialization: "Yarn Manufacturing, Texturizing & Advanced Fiber Mechanics",
    experience: "25+ Years Experience",
    email: "aspatil@sggs.ac.in",
    researchFocus: ["Rotor Spinning Dynamics", "Air-Vortex Yarns", "Polymer Blends"],
  },
  {
    name: "Dr. Milind S. Kulkarni",
    designation: "Associate Professor",
    qualification: "Ph.D. Textile Engineering, VJTI Mumbai",
    specialization: "Weaving Automation, Electronic Jacquards & 3D Fabric Geometry",
    experience: "20+ Years Experience",
    email: "mskulkarni@sggs.ac.in",
    researchFocus: ["Shuttleless Weaving", "3D Woven Preforms", "Loom Sensors"],
  },
  {
    name: "Dr. Snehalata R. Joshi",
    designation: "Associate Professor",
    qualification: "Ph.D. Technical Textiles, IIT Delhi",
    specialization: "Smart Textiles, Nanofibers & Conductive Polymeric Weaves",
    experience: "16+ Years Experience",
    email: "srjoshi@sggs.ac.in",
    researchFocus: ["Electrospinning", "Wearable Electronics", "Biomedical Implants"],
  },
  {
    name: "Prof. Dnyaneshwar B. Shinde",
    designation: "Assistant Professor",
    qualification: "M.Tech Textile Technology, DKTE Ichalkaranji",
    specialization: "Textile Quality Testing, Statistical Process Control & Standards",
    experience: "12+ Years Experience",
    email: "dbshinde@sggs.ac.in",
    researchFocus: ["Tensile Failure Mechanics", "ISO Test Protocols", "Fiber Identification"],
  },
  {
    name: "Prof. Priya K. Deshmukh",
    designation: "Assistant Professor",
    qualification: "M.Tech Apparel Production, NIFT / SGGSIE&T",
    specialization: "Garment Manufacturing CAD/CAM, Ergonomics & Fashion Tech",
    experience: "9+ Years Experience",
    email: "pkdeshmukh@sggs.ac.in",
    researchFocus: ["3D Body Scanning", "Automated Marker Planning", "Apparel Sizing"],
  },
];

const STAFF_LIST: StaffMember[] = [
  {
    name: "Mr. Sunil V. Rathod",
    designation: "Senior Technical Superintendent",
    labAssigned: "Fabric Weaving & Loom Shed",
    qualification: "Diploma in Textile Manufacturing (DTM)",
    experience: "22 Years",
    skills: "Electronic Jacquard Card Punching, Rapier Loom Timing Calibration, Loom Maintenance",
  },
  {
    name: "Mr. Balaji M. Khandare",
    designation: "Laboratory Assistant",
    labAssigned: "Chemical Wet Processing & Dyeing Lab",
    qualification: "B.Sc. (Chemistry), ADT (Textile)",
    experience: "18 Years",
    skills: "HTHP Beaker Dyeing Vessel Operation, Spectrophotometer Calibration, Chemical Bath Prep",
  },
  {
    name: "Mr. Ramesh P. Gaikwad",
    designation: "Technical Instructor",
    labAssigned: "Fiber Spinning & Yarn Prep Lab",
    qualification: "Diploma in Textile Technology",
    experience: "15 Years",
    skills: "Mini-Blowroom Maintenance, Carding Clothing Maintenance, Ring Frame Spindle Alignment",
  },
  {
    name: "Mrs. Shobha S. Mane",
    designation: "Senior Testing Assistant",
    labAssigned: "Quality Assurance & Tensile Testing Lab",
    qualification: "Diploma in Textile Testing",
    experience: "14 Years",
    skills: "Universal Tensile Machine (UTM) Operation, Yarn Evenness Tester, Abrasion & Pilling Analytics",
  },
  {
    name: "Mr. Ajay K. Chavan",
    designation: "CAD/CAM & Computation Lab Assistant",
    labAssigned: "Textile CAD & Design Studio",
    qualification: "B.C.A. & Textile CAD Certification",
    experience: "8 Years",
    skills: "Richpeace Textile CAD Station Setup, Jacquard Weave File Simulation, Network Lab Admin",
  },
];

const LAB_FACILITIES: LabFacility[] = [
  {
    id: "spinning-lab",
    name: "Fiber & Yarn Spinning Laboratory",
    shortCode: "LAB // SPIN-01",
    description:
      "Equipped with pilot-scale machinery allowing hands-on operational training from raw cotton and synthetic staple fiber opening through drawing to final spun yarn on ring and rotor frames.",
    keyEquipments: [
      "Miniature Blowroom & Opener Unit",
      "High-Production Revolving Flat Card",
      "Draw Frame with Auto-Leveler Simulation",
      "Ring Spinning Frame (48 Spindles)",
      "Rotor Open-End Spinning Demonstration Unit",
    ],
    industrialApplication:
      "Staple yarn formulation, yarn count optimization, twist multiplier analysis, and polymer blend trials.",
  },
  {
    id: "weaving-lab",
    name: "Fabric Manufacture & Weaving Shed",
    shortCode: "LAB // WEAV-02",
    description:
      "A full-scale industrial weaving floor featuring shuttleless rapier looms, high-speed electronic jacquard patterning systems, automatic dobby looms, and precision pirn/cone winding.",
    keyEquipments: [
      "Flexible Rapier Loom with Digital Control",
      "High-Speed Electronic Jacquard Loom",
      "Negative / Positive Cam & Dobby Looms",
      "Modern Circular Single-Jersey Knitting Machine",
      "Sectional Warping & Pirn Winding Units",
    ],
    industrialApplication:
      "Complex geometric weaves, jacquard upholstery, technical mesh prototyping, and structural 3D preforms.",
  },
  {
    id: "chemical-lab",
    name: "Chemical Wet Processing & Dyeing Lab",
    shortCode: "LAB // CHEM-03",
    description:
      "Specialized in pre-treatment (desizing, scouring, bleaching, mercerization), synthetic & natural dyeing, chemical finishing, and spectrophotometric color matching.",
    keyEquipments: [
      "Computerized High-Temp High-Pressure (HTHP) Dyeing Machines",
      "GretagMacbeth Reflectance Spectrophotometer",
      "Laboratory Pneumatic Padding Mangle & Curing Stenter",
      "Rotary Screen & Flatbed Printing Tables",
      "Fastness Testing Launder-O-Meter & Crockmeter",
    ],
    industrialApplication:
      "Recipe formulation, color difference (ΔE) quality assurance, flame-retardant and water-repellent chemical finishes.",
  },
  {
    id: "testing-lab",
    name: "Textile Physical Testing & QA Lab",
    shortCode: "LAB // TEST-04",
    description:
      "Standard atmospheric conditioning testing laboratory compliant with ASTM, ISO, and BIS testing protocols for fiber, yarn, and fabric quality evaluation.",
    keyEquipments: [
      "Universal Tensile Testing Machine (UTM - 50 kN)",
      "Shirley Trash Separator & Fiber Fineness Tester",
      "Martindale Abrasion & Pilling Tester",
      "Elmendorf Digital Tear Strength Tester",
      "Zweigle Automatic Yarn Twist Tester",
    ],
    industrialApplication:
      "Material certification, load-elongation curve benchmarking, tear propagation analysis, and industrial failure forensics.",
  },
  {
    id: "nanotech-lab",
    name: "Advanced Technical Textiles & Nanofibers Lab",
    shortCode: "LAB // NANO-05",
    description:
      "An advanced R&D facility created to formulate electrospun polymeric nanofibers, conductive yarns, functional filtration media, and biomedical textile scaffolds.",
    keyEquipments: [
      "High-Voltage Electrospinning Synthesis Chamber",
      "Moisture Management Tester (MMT)",
      "Optical Contact Angle Goniometer for Wetting",
      "Automated Air Permeability Tester",
      "Digital Hydrostatic Head Water Resistance Tester",
    ],
    industrialApplication:
      "High-efficiency particulate air (HEPA) filters, wound dressing scaffolds, wearable sensor substrates, and ballistic woven armor research.",
  },
  {
    id: "cad-lab",
    name: "Garment Technology & Textile CAD Studio",
    shortCode: "LAB // CAD-06",
    description:
      "High-performance computing laboratory housing industry-standard CAD/CAM suites for 3D garment simulation, digital jacquard design, and automated marker optimization.",
    keyEquipments: [
      "Richpeace Textile & Garment CAD Design Suite",
      "Automated Pattern Digitizer & A0 Flatbed Plotter",
      "NedGraphics / WonderWeave Jacquard Fabric CAD",
      "3D Virtual Garment Fitting Simulator",
      "Precision Laser Cutting Demonstration Plotter",
    ],
    industrialApplication:
      "Apparel pattern grading, computerized jacquard card generation, fabric consumption reduction, and fashion engineering.",
  },
];

export default function DepartmentOverviewSection() {
  const [activeTab, setActiveTab] = useState<"all" | "faculty" | "staff" | "classes" | "labs">("all");
  const [facultyList, setFacultyList] = useState<FacultyMember[]>(FACULTY_LIST);
  const [staffList, setStaffList] = useState<StaffMember[]>(STAFF_LIST);

  useEffect(() => {
    try {
      const storedFaculty = localStorage.getItem("tesa_faculty");
      if (storedFaculty) {
        const parsed = JSON.parse(storedFaculty);
        if (Array.isArray(parsed) && parsed.length > 0) setFacultyList(parsed);
      }
      const storedStaff = localStorage.getItem("tesa_staff");
      if (storedStaff) {
        const parsed = JSON.parse(storedStaff);
        if (Array.isArray(parsed) && parsed.length > 0) setStaffList(parsed);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <section
      id="department"
      className="relative w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] bg-[#06070a] overflow-hidden"
    >
      {/* Background Engineering Grids */}
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-25" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-600/5 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/40 bg-cyan-950/40 text-[11px] sm:text-xs font-mono text-cyan-300 mb-3 shadow-[0_0_15px_rgba(0,240,255,0.25)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
            <span>ACADEMIC FOUNDATION • ESTABLISHED 1987</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            DEPARTMENT OF{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-sky-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.35)]">
              TEXTILE TECHNOLOGY
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Pioneering autonomous engineering education in Maharashtra for over 35 years. Home to cutting-edge research in nanofiber membranes, automated smart looms, and sustainable polymer manufacturing.
          </p>

          {/* Subsection Switcher Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            {[
              { id: "all", label: "OVERVIEW (ALL)" },
              { id: "faculty", label: "FACULTY MEMBERS" },
              { id: "staff", label: "TECHNICAL STAFF" },
              { id: "classes", label: "CLASS & ACADEMIC INFO" },
              { id: "labs", label: "LAB FACILITIES" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-2 rounded-lg border transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                    : "bg-slate-950/60 text-slate-300 border-cyan-500/20 hover:border-cyan-400/60 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* =========================================================================
            SUBSECTION 1: FACULTY MEMBERS
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "faculty") && (
          <div id="faculty" className="mb-20">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-white/[0.08]">
              <div>
                <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase block mb-1">
                  SUBSECTION 01 // ACADEMIC LEADERSHIP
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Faculty Members &amp; Research Advisors
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-400">
                {facultyList.length} PROFESSORS &amp; ADVISORS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facultyList.map((faculty, fIdx) => (
                <div
                  key={fIdx}
                  className="rounded-2xl border border-cyan-500/30 bg-slate-950/65 p-5 sm:p-6 backdrop-blur-2xl hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(0,240,255,0.3)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        {faculty.photoUrl ? (
                          <div className="relative w-12 h-12 rounded-full border border-cyan-400/50 overflow-hidden shrink-0 shadow-md">
                            <Image src={faculty.photoUrl} alt={faculty.name} fill sizes="48px" className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-full border border-cyan-500/30 bg-cyan-950/50 flex items-center justify-center shrink-0 font-mono text-cyan-300 font-bold text-xs">
                            {faculty.name.split(" ").map((w) => w[0]).filter((c) => c && c.match(/[A-Za-z]/)).slice(0, 2).join("") || "DR"}
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-bold text-white tracking-tight">
                            {faculty.name}
                          </h4>
                          <p className="text-xs font-mono text-cyan-400">
                            {faculty.designation}
                          </p>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    </div>

                    <p className="text-xs font-mono text-slate-400 mb-2">
                      🎓 {faculty.qualification}
                    </p>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] mb-3">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Domain &amp; Expertise:
                      </span>
                      <p className="text-xs text-slate-200 leading-snug">
                        {faculty.specialization}
                      </p>
                    </div>

                    <div className="mb-3">
                      <span className="text-[10px] font-mono text-cyan-400/80 uppercase block mb-1.5">
                        Research Areas:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {faculty.researchFocus.map((res, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/20"
                          >
                            {res}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">{faculty.experience}</span>
                    <a
                      href={`mailto:${faculty.email}`}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {faculty.email}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBSECTION 2: STAFF MEMBERS
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "staff") && (
          <div id="staff" className="mb-20">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-white/[0.08]">
              <div>
                <span className="font-mono text-xs text-teal-400 tracking-widest uppercase block mb-1">
                  SUBSECTION 02 // TECHNICAL CREW
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Technical &amp; Laboratory Staff Members
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-400">
                {staffList.length} TECHNICAL SPECIALISTS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staffList.map((staff, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-2xl border border-cyan-500/30 bg-slate-950/65 p-5 sm:p-6 backdrop-blur-2xl hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(0,240,255,0.3)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950/50 text-teal-300 border border-teal-500/30">
                        {staff.labAssigned}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {staff.experience} Exp.
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      {staff.photoUrl ? (
                        <div className="relative w-11 h-11 rounded-full border border-teal-400/50 overflow-hidden shrink-0 shadow-md">
                          <Image src={staff.photoUrl} alt={staff.name} fill sizes="44px" className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full border border-teal-500/30 bg-teal-950/50 flex items-center justify-center shrink-0 font-mono text-teal-300 font-bold text-xs">
                          {staff.name.split(" ").map((w) => w[0]).filter((c) => c && c.match(/[A-Za-z]/)).slice(0, 2).join("") || "ST"}
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight mb-0.5">
                          {staff.name}
                        </h4>
                        <p className="text-xs font-mono text-slate-400">
                          {staff.designation} • {staff.qualification}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06]">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Operational Specialization:
                      </span>
                      <p className="text-xs text-slate-300 leading-snug">
                        {staff.skills}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBSECTION 3: CLASS & ACADEMIC INFORMATION
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "classes") && (
          <div id="classes" className="mb-20">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-white/[0.08]">
              <div>
                <span className="font-mono text-xs text-blue-400 tracking-widest uppercase block mb-1">
                  SUBSECTION 03 // ACADEMIC ROADMAP &amp; BATCH DETAILS
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Class Information &amp; Curriculum Breakdown
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-400">
                AUTONOMOUS B.TECH &amp; M.TECH
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Program 1: B.Tech */}
              <div className="rounded-xl border border-white/10 bg-slate-950/70 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      UNDERGRADUATE DEGREE
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                      4 YEARS • 8 SEMESTERS
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    B.Tech in Textile Technology
                  </h4>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    Comprehensive professional engineering degree providing rigorous grounding in natural and synthetic polymer science, mechanical yarn conversion, advanced woven &amp; knitted structures, and wet chemical functionalization.
                  </p>

                  <div className="space-y-2 mb-4 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-300 p-2 rounded bg-white/[0.02]">
                      <span>Annual Class Intake:</span>
                      <span className="text-cyan-300 font-bold">40 Seats + Lateral Entry</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 p-2 rounded bg-white/[0.02]">
                      <span>Accreditation:</span>
                      <span className="text-emerald-400 font-bold">NBA Accredited Tier-1</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 p-2 rounded bg-white/[0.02]">
                      <span>Industrial Internship:</span>
                      <span className="text-white">6 Months Full-Time Final Year</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase block mb-1">
                    Major Subjects Covered:
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Fiber Science, Spinning, Weaving, Wet Processing, Nanotech, Geotextiles, Apparel CAD, Process Quality.
                  </p>
                </div>
              </div>

              {/* Program 2: M.Tech & Ph.D. */}
              <div className="rounded-xl border border-white/10 bg-slate-950/70 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-teal-400">
                      POSTGRADUATE &amp; DOCTORAL
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950/60 text-teal-300 border border-teal-500/30">
                      2 TO 5 YEARS
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    M.Tech &amp; Ph.D. in Textile Engineering
                  </h4>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    Advanced research-oriented specialization focused on technical textiles, high-performance filtration, smart electronic garments, polymer melt recycling, and biomedical scaffolds.
                  </p>

                  <div className="space-y-2 mb-4 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-300 p-2 rounded bg-white/[0.02]">
                      <span>M.Tech Intake:</span>
                      <span className="text-teal-300 font-bold">18 Seats (GATE Qualified)</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 p-2 rounded bg-white/[0.02]">
                      <span>Ph.D. Fellowships:</span>
                      <span className="text-emerald-400 font-bold">AICTE QIP &amp; Institute Stips</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300 p-2 rounded bg-white/[0.02]">
                      <span>Funded Research:</span>
                      <span className="text-white">DST, SERB, &amp; Textile Ministry</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08]">
                  <span className="text-[10px] font-mono text-teal-400 uppercase block mb-1">
                    Key Research Domains:
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Nanofiber Electrospinning, Wearable Biosensors, Ballistic Aramid Composites, Circular Polymeric Economy.
                  </p>
                </div>
              </div>

              {/* Class Placement & Industry Partners */}
              <div className="rounded-xl border border-white/10 bg-slate-950/70 p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-mono font-bold text-indigo-400">
                      PLACEMENT &amp; CORPORATE RECRUITERS
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                      95%+ RECORD
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">
                    Industry Placement Network
                  </h4>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    Graduates from SGGSIE&amp;T Textile Technology lead manufacturing, R&amp;D, and executive roles across India&apos;s foremost conglomerates and global multinational engineering brands.
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                    {[
                      "Reliance Industries",
                      "Arvind Mills",
                      "Raymond Luxury",
                      "Welspun Global",
                      "Vardhman Group",
                      "Trützschler India",
                      "Rieter Spinning",
                      "Alok Industries",
                    ].map((company, cIdx) => (
                      <div
                        key={cIdx}
                        className="px-2.5 py-1.5 rounded bg-white/[0.03] border border-white/[0.07] text-slate-200 text-[11px] text-center truncate"
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Alumni Community:</span>
                  <span className="text-cyan-400 font-semibold">1,800+ Worldwide</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBSECTION 4: LAB FACILITIES
            ========================================================================= */}
        {(activeTab === "all" || activeTab === "labs") && (
          <div id="labs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-white/[0.08]">
              <div>
                <span className="font-mono text-xs text-cyan-400 tracking-widest uppercase block mb-1">
                  SUBSECTION 04 // WORLD-CLASS INFRASTRUCTURE
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Advanced Laboratory &amp; Research Facilities
                </h3>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded bg-slate-900 border border-white/10 text-slate-400">
                6 SPECIALIZED LABORATORIES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LAB_FACILITIES.map((lab) => (
                <div
                  key={lab.id}
                  className="rounded-2xl border border-cyan-500/30 bg-slate-950/65 backdrop-blur-2xl p-6 flex flex-col justify-between hover:border-cyan-400 hover:shadow-[0_0_35px_rgba(0,240,255,0.3)] transition-all duration-300"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30">
                        {lab.shortCode}
                      </span>
                      <span className="font-mono text-xs text-cyan-400">+</span>
                    </div>

                    <h4 className="text-xl font-bold text-white mb-2 tracking-tight">
                      {lab.name}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {lab.description}
                    </p>

                    <div className="mb-4">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
                        Key Machinery &amp; Instrumentation:
                      </span>
                      <ul className="space-y-1.5">
                        {lab.keyEquipments.map((eq, eIdx) => (
                          <li
                            key={eIdx}
                            className="text-xs font-mono text-slate-300 flex items-start gap-2"
                          >
                            <span className="text-cyan-400 mt-0.5">▸</span>
                            <span>{eq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08]">
                    <span className="text-[10px] font-mono text-cyan-400/80 uppercase block mb-1">
                      Industrial Testing &amp; Research:
                    </span>
                    <p className="text-[11px] text-slate-400 italic">
                      {lab.industrialApplication}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
