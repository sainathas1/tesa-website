"use client";

import { useState } from "react";

interface PastEvent {
  id: string;
  title: string;
  year: string;
  date: string;
  category: "conclave" | "hackathon" | "workshop" | "talk";
  categoryLabel: string;
  venue: string;
  stats: {
    participants: string;
    collegesOrTeams: string;
    prizesOrProjects: string;
  };
  summary: string;
  details: {
    description: string;
    keynoteSpeaker: string;
    winnerFirst: string;
    winnerSecond: string;
    highlights: string[];
    galleryPlaceholders: string[];
  };
}

const PAST_EVENTS: PastEvent[] = [
  {
    id: "conclave-2025",
    title: "TEX-CONCLAVE 2025: National Symposium on Sustainable & Smart Fibers",
    year: "2025",
    date: "March 15–16, 2025",
    category: "conclave",
    categoryLabel: "NATIONAL CONCLAVE",
    venue: "SGGSIE&T Main Auditorium & Textile Complex",
    stats: {
      participants: "480+ Delegates",
      collegesOrTeams: "28 Technical Colleges",
      prizesOrProjects: "₹1,20,000 Cash Pool",
    },
    summary:
      "Flagship national convention uniting textile researchers, industry leaders, and students for paper presentations, live CAD design contests, and sustainability panels.",
    details: {
      description:
        "TEX-CONCLAVE 2025 was TESA's largest national symposium to date. Delegates from premier institutions including ICT Mumbai, IIT Delhi, and DKTE participated in three competitive tracks: Technical Research Presentations, CAD Jacquard Pattern Innovation, and Sustainable Textile Material Exhibits. The event concluded with an executive roundtable on industrial decarbonization in textile wet processing.",
      keynoteSpeaker: "Dr. S. K. Roy (Executive VP of Fiber Technology, Reliance Industries Ltd.)",
      winnerFirst: "ICT Mumbai — 'Bio-Engineered Chitosan Nanofibers for Antimicrobial Wound Dressings'",
      winnerSecond: "SGGSIE&T Nanded — 'Piezoelectric Polymer Yarns for Biometric Energy Harvesting'",
      highlights: [
        "65 Peer-Reviewed Technical Papers Presented",
        "12 Industry Exhibits featuring Modern Testing Sensors",
        "Launch of TESA Student Journal 'Textile Matrix Vol. 14'",
      ],
      galleryPlaceholders: [
        "Inaugural Ceremony & Lamp Lighting",
        "Keynote Address by Dr. S. K. Roy",
        "Technical Paper Presentation Session",
        "Grand Valedictory & Awards Ceremony",
      ],
    },
  },
  {
    id: "hackathon-2024",
    title: "SMART WEAVES HACKATHON 2024: 36-Hour Wearable Tech Challenge",
    year: "2024",
    date: "October 18–19, 2024",
    category: "hackathon",
    categoryLabel: "36-HOUR HACKATHON",
    venue: "Textile CAD/CAM Studio & IoT Labs",
    stats: {
      participants: "130 Innovators",
      collegesOrTeams: "32 Interdisciplinary Teams",
      prizesOrProjects: "3 Provisional Patents",
    },
    summary:
      "A grueling 36-hour sprint pairing textile engineers with electronics students to develop wearable electronic garments, fabric sensors, and automated defect detectors.",
    details: {
      description:
        "Organized by TESA in collaboration with the IEEE Student Branch, participants engineered functional prototypes blending conductive threads, flexible microcontrollers, and woven fabrics. Teams had direct round-the-clock access to SGGSIE&T's rapier looms, knitting machines, and laser cutters.",
      keynoteSpeaker: "Mr. Anand Verma (Founder, WearTech Labs Bangalore)",
      winnerFirst: "Team LoomSense (SGGSIE&T) — 'Edge-AI Optical Scanner for Micro-Defect Detection on Looms'",
      winnerSecond: "Team BioWeave (COEP Pune) — 'Flexible Conductive Textile Strip for Posture Tracking'",
      highlights: [
        "36 Hours Non-Stop Prototyping & Live Fabrication",
        "Mentorship by 8 Industry Automation Engineers",
        "3 Student Prototype Teams funded for Seed Incubation",
      ],
      galleryPlaceholders: [
        "Hackathon Kickoff & Problem Statement Reveal",
        "Night Sprint in Textile CAD & IoT Lab",
        "Hardware Testing on Rapier Loom",
        "Winning Team Pitch to Angel Investors",
      ],
    },
  },
  {
    id: "workshop-2024",
    title: "Advanced Electrospinning & Nanofiber Materials Workshop",
    year: "2024",
    date: "July 8–9, 2024",
    category: "workshop",
    categoryLabel: "LAB WORKSHOP",
    venue: "Advanced Nanotechnology & Polymer Research Lab",
    stats: {
      participants: "190 Students & Scholars",
      collegesOrTeams: "Hands-on Cohort",
      prizesOrProjects: "Certified Lab Credentials",
    },
    summary:
      "Hands-on masterclass covering polymer solution chemistry, syringe-pump calibration, high-voltage Taylor cone formation, and SEM imaging analysis.",
    details: {
      description:
        "This specialized two-day workshop offered students end-to-end practical training in synthesizing functional nanofibers for HEPA air filtration and water purification membranes. Each attendee formulated PVA and Nylon polymer blends and analyzed pore size distribution using optical contact angle instruments.",
      keynoteSpeaker: "Prof. Dr. Snehalata R. Joshi (Associate Professor & Nanotech Lab Director)",
      winnerFirst: "Best Morphology Award: PVA/Carbon Nanotube Hybrid Membrane",
      winnerSecond: "Best Filtration Efficiency Award: Electrospun Nylon-66 Nanoweb",
      highlights: [
        "Individual Machine Operation by Student Teams",
        "Comprehensive Guidebook on Electrospinning Parameters",
        "Live Tensile Strength Testing on Micro-Samples",
      ],
      galleryPlaceholders: [
        "Polymer Solution Preparation in Wet Lab",
        "High-Voltage Electrospinning Chamber Demo",
        "Microscopic Fiber Inspection Session",
        "Certificate Distribution to Attendees",
      ],
    },
  },
  {
    id: "expedition-2024",
    title: "National Industrial Textile Expedition: Ichalkaranji & Surat Mills",
    year: "2024",
    date: "December 2–6, 2024",
    category: "workshop",
    categoryLabel: "INDUSTRIAL VISIT",
    venue: "Ichalkaranji Weaving Clusters & Surat Processing Hub",
    stats: {
      participants: "85 B.Tech Students",
      collegesOrTeams: "6 Mega Mills Visited",
      prizesOrProjects: "100% Industry Exposure",
    },
    summary:
      "5-day immersive industrial study tour inspecting modern air-jet weaving sheds, computerized rotary printing plants, and technical geotextile manufacturing centers.",
    details: {
      description:
        "Students gained first-hand insights into large-scale commercial operations, examining high-speed air-jet looms running at 1000+ RPM, effluent treatment plants (ETP) with Zero Liquid Discharge (ZLD), and automated warehousing.",
      keynoteSpeaker: "Er. Mahesh Patil (Chief General Manager, Ichalkaranji Textile Park)",
      winnerFirst: "Best Technical Field Report: 'Energy Optimization in Air-Jet Sheds'",
      winnerSecond: "Runner Up: 'Color Matching Automation in Rotary Screen Plants'",
      highlights: [
        "Exclusive Access to 1,200 RPM Toyota Air-Jet Loom Sheds",
        "Direct Interaction with Plant General Managers",
        "Pre-Placement Interview Opportunities for Final Year Students",
      ],
      galleryPlaceholders: [
        "Arrival at Textile Processing Complex",
        "Inspection of High-Speed Weaving Floor",
        "Technical Briefing by Plant Quality Managers",
        "Group Photo with SGGSIE&T Alumni at Plant",
      ],
    },
  },
  {
    id: "conclave-2023",
    title: "TEX-CONCLAVE 2023: Industry 4.0 & Advanced Technical Textiles",
    year: "2023",
    date: "March 24–25, 2023",
    category: "conclave",
    categoryLabel: "NATIONAL CONCLAVE",
    venue: "SGGSIE&T Auditorium & Weaving Shed",
    stats: {
      participants: "410 Delegates",
      collegesOrTeams: "22 Engineering Colleges",
      prizesOrProjects: "₹1,00,000 Prizes",
    },
    summary:
      "Explored digital twin modeling for warp preparation, IoT drop-wire integration on looms, and nonwoven geotextiles for national highway stabilization.",
    details: {
      description:
        "The 2023 symposium emphasized the digital transformation of conventional textile mills into smart Industry 4.0 connected facilities. Key sessions covered real-time loom monitoring, optical yarn clearing, and biodegradable spunbond nonwovens.",
      keynoteSpeaker: "Er. Dilip Ghadge (Director of Operations, Raymond Ltd.)",
      winnerFirst: "DKTE Ichalkaranji — 'IoT Sensor Mesh for Warp Breakage Predictive Diagnostics'",
      winnerSecond: "SGGSIE&T Nanded — 'Jute-Coir Geotextile Mat for Slope Soil Erosion Control'",
      highlights: [
        "42 Research Papers Published in Symposium Compendium",
        "Demonstration of Sensor-Retrofit on SGGSIE&T Rapier Loom",
        "Industry-Institute MOU signed with Raymond Ltd.",
      ],
      galleryPlaceholders: [
        "Inauguration by Industry Dignitaries",
        "Live Retrofit Demonstration on Rapier Loom",
        "Student Paper Evaluation by Technical Jury",
        "Memento Presentation to Alumni Keynote Speakers",
      ],
    },
  },
  {
    id: "alumni-talk-2023",
    title: "Alumni Leadership Panel: Navigating 21st Century Global Textiles",
    year: "2023",
    date: "September 5, 2023",
    category: "talk",
    categoryLabel: "ALUMNI KEYNOTE",
    venue: "Institute Seminar Hall",
    stats: {
      participants: "320+ Students",
      collegesOrTeams: "5 Senior Alumni Leaders",
      prizesOrProjects: "Career Mentorship",
    },
    summary:
      "Distinguished alumni holding executive leadership roles at Welspun, Arvind, and Trützschler shared global textile trends and career development roadmaps.",
    details: {
      description:
        "A highly engaging interactive fireside dialogue connecting our undergraduates with distinguished alumni. Discussion topics ranged from international technical sales to transitioning into smart fabric research and mastering supply chain sustainability.",
      keynoteSpeaker: "Panel Moderated by TESA President Aarav Deshmukh",
      winnerFirst: "Special Alumni Recognition: 1994 Batch Silver Jubilee Contribution",
      winnerSecond: "Student Innovation Grant: Sponsored by Alumni Chapter",
      highlights: [
        "Interactive Q&A on Placements & Global Opportunities",
        "Announcement of 5 Annual TESA Merit Scholarships",
        "Establishment of Alumni 1-on-1 Mentorship Network",
      ],
      galleryPlaceholders: [
        "Welcome Address by Department HOD",
        "Alumni Panel Discussion on Stage",
        "Interactive Student Q&A Session",
        "Felicitation of Distinguished Alumni",
      ],
    },
  },
];

export default function PastEventsSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<PastEvent | null>(null);

  // Filter events based on active category and year
  const filteredEvents = PAST_EVENTS.filter((ev) => {
    const categoryMatch =
      selectedCategory === "all" || ev.category === selectedCategory;
    const yearMatch = selectedYear === "all" || ev.year === selectedYear;
    return categoryMatch && yearMatch;
  });

  return (
    <section
      id="past-events"
      className="relative w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#06070a] border-b border-white/[0.08] overflow-hidden"
    >
      {/* Background Engineering Grids & Cyan Glows */}
      <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-20" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-cyan-600/5 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-[11px] sm:text-xs font-mono text-cyan-300 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>ARCHIVES // 2022–2025 CLUB MILESTONES</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            PAST EVENTS &amp;{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
              LEGACY ARCHIVES
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Delve into TESA&apos;s proud history of national conventions, 36-hour hackathons, industrial mill residencies, and leadership summits held at SGGSIE&amp;T.
          </p>

          {/* Dual Filtering Controls: Category & Year */}
          <div className="mt-8 space-y-3">
            {/* Category Filter Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
              {[
                { id: "all", label: "ALL EVENTS" },
                { id: "conclave", label: "NATIONAL CONCLAVES" },
                { id: "hackathon", label: "HACKATHONS & CHALLENGES" },
                { id: "workshop", label: "WORKSHOPS & VISITS" },
                { id: "talk", label: "ALUMNI TALKS" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-lg border transition-all duration-200 ${
                    selectedCategory === cat.id
                      ? "bg-cyan-500 text-black border-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : "bg-white/[0.03] text-slate-300 border-white/10 hover:border-cyan-500/30 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Year Filter Buttons */}
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-[11px] uppercase tracking-wider text-slate-500 mr-1">
                FILTER BY YEAR:
              </span>
              {["all", "2025", "2024", "2023"].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedYear === yr
                      ? "bg-white/[0.12] text-cyan-300 font-bold border border-cyan-500/40"
                      : "hover:text-white"
                  }`}
                >
                  {yr === "all" ? "ALL" : yr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] via-slate-950/60 to-black/80 backdrop-blur-md p-6 overflow-hidden hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-200"
            >
              {/* Corner HUD accent */}
              <span className="pointer-events-none absolute top-3 right-3 font-mono text-xs text-cyan-500/40">
                +
              </span>

              {/* Upper Details */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
                    {event.categoryLabel}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {event.year}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors tracking-tight mb-2 leading-snug">
                  {event.title}
                </h3>

                <p className="text-xs font-mono text-slate-400 mb-3 flex items-center gap-1.5">
                  <span className="text-cyan-400">📅</span> {event.date} • {event.venue}
                </p>

                <p className="text-xs text-slate-300 leading-relaxed mb-5">
                  {event.summary}
                </p>

                {/* Event Highlights Ticker Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-black/40 border border-white/[0.06] mb-5 text-center text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">DELEGATES</span>
                    <span className="font-bold text-white text-[11px] truncate block">
                      {event.stats.participants}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">INSTITUTES</span>
                    <span className="font-bold text-cyan-300 text-[11px] truncate block">
                      {event.stats.collegesOrTeams}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">IMPACT</span>
                    <span className="font-bold text-emerald-400 text-[11px] truncate block">
                      {event.stats.prizesOrProjects}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive View Details Action Button */}
              <div className="pt-4 border-t border-white/[0.08]">
                <button
                  onClick={() => setSelectedEvent(event)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-mono font-semibold tracking-wider text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-white hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                >
                  <span>VIEW EVENT DETAILS &amp; ARCHIVES</span>
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-mono text-sm">
            No events found matching the selected category and year.
          </div>
        )}

        {/* =========================================================================
            INTERACTIVE EVENT DETAIL MODAL
            Opens when a user clicks "View Event Details"
            ========================================================================= */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/40 bg-[#090b10] p-6 sm:p-8 shadow-2xl shadow-cyan-500/10">
              {/* Close Button */}
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors font-mono text-sm"
                aria-label="Close modal"
              >
                ✕ ESC
              </button>

              {/* Modal Header */}
              <div className="mb-6 pr-12">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 uppercase">
                    {selectedEvent.categoryLabel}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {selectedEvent.date} • {selectedEvent.year}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs font-mono text-cyan-400 mt-1">
                  📍 {selectedEvent.venue}
                </p>
              </div>

              {/* Event Description */}
              <div className="mb-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.08]">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Full Event Briefing &amp; Scope
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {selectedEvent.details.description}
                </p>
              </div>

              {/* Keynotes & Winners */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08]">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                    Keynote Dignitary:
                  </span>
                  <p className="text-xs text-white font-semibold leading-snug">
                    {selectedEvent.details.keynoteSpeaker}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-white/[0.08]">
                  <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider block mb-1">
                    Grand Prize Winner:
                  </span>
                  <p className="text-xs text-white font-semibold leading-snug">
                    🥇 {selectedEvent.details.winnerFirst}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    🥈 {selectedEvent.details.winnerSecond}
                  </p>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="mb-6">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                  Key Achievements &amp; Outcomes:
                </h4>
                <ul className="space-y-2">
                  {selectedEvent.details.highlights.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs font-mono text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-cyan-400">✔</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Event Photo Placeholders Gallery */}
              <div className="mb-6">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">
                  Event Photo Archive Placeholders:
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {selectedEvent.details.galleryPlaceholders.map((caption, gIdx) => (
                    <div
                      key={gIdx}
                      className="aspect-video rounded-lg border border-dashed border-cyan-500/30 bg-cyan-950/20 p-2 flex flex-col items-center justify-center text-center group hover:border-cyan-400 transition-colors"
                    >
                      <span className="text-[9px] font-mono text-cyan-400 block mb-1">
                        [PHOTO {gIdx + 1}]
                      </span>
                      <span className="text-[10px] text-slate-300 leading-tight">
                        {caption}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">
                  RECORD VERIFIED BY TESA DOCUMENTATION CELL
                </span>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs tracking-wider transition-colors"
                >
                  CLOSE ARCHIVE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
