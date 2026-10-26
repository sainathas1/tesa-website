export interface FacultyMember {
  id: string;
  name: string;
  designation: string;
  qualification: string;
  specialization: string;
  experience: string;
  email: string;
  researchFocus: string[] | string;
  photoUrl?: string;
  imageUrl?: string;
  image?: string;
  bio?: string;
  createdAt?: any;
}

export interface GalleryPhoto {
  id: string;
  title: string;
  url: string;
  category?: string;
  date?: string;
  caption?: string;
  createdAt?: any;
}

export const DEFAULT_FACULTY: FacultyMember[] = [
  {
    id: "fac-1",
    name: "Dr. Ravindra V. Adivarekar",
    designation: "Professor & Head of Department",
    qualification: "Ph.D. (Tech) Textile Chemistry, ICT Mumbai",
    specialization: "Eco-Friendly Wet Processing, Natural Dyeing & Surface Functionalization",
    experience: "28+ Years Academic & Research",
    email: "hod.textile@sggs.ac.in",
    researchFocus: ["Green Chemistry", "Nanoparticle Finishing", "Plasma Technology"],
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    bio: "Pioneering eco-friendly textile processing and green functional finishes. Guiding departmental initiatives, national symposiums, and industrial collaborations across Maharashtra.",
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
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&auto=format&fit=crop&q=80",
    bio: "Expert in yarn spinning dynamics, air-jet texturizing, and high-performance polymer yarns with extensive international journal publications.",
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
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&auto=format&fit=crop&q=80",
    bio: "Head of Department Weaving Labs, focusing on automated electronic shed mechanisms, rapier loom optimization, and composite textile preforms.",
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
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
    bio: "Spearheading smart e-textiles, wearable sensors, and electrospun nanofiber matrices for biomedical and aerospace applications.",
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
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=80",
    bio: "Lead coordinator for department testing labs, quality assurance certifications, and student technical competitions.",
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
    photoUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800&auto=format&fit=crop&q=80",
    bio: "In charge of CAD/CAM Garment Studio, digital pattern cutting, and integrating 3D digital apparel simulation software.",
  },
];

export const DEFAULT_GALLERY_PHOTOS: GalleryPhoto[] = [
  {
    id: "gal-1",
    title: "National Textile Conclave & Hackathon",
    url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    category: "National Conclave",
    date: "TEXPLORER '25",
    caption: "Inaugural ceremony of TEXPLORER with industry keynote speakers and national delegates.",
  },
  {
    id: "gal-2",
    title: "High-Speed Automated Shuttle Loom",
    url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80",
    category: "Weaving Laboratory",
    date: "Spring 2025",
    caption: "Undergraduate laboratory session investigating complex twill and satin weave mechanics.",
  },
  {
    id: "gal-3",
    title: "Bio-Synthetic & Nanotech Smart Fabrics",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    category: "Smart Fabrics R&D",
    date: "Academic Year 2024–25",
    caption: "Student research showcase testing conductive smart textiles and piezoelectric yarn matrices.",
  },
  {
    id: "gal-4",
    title: "Sustainable Dye Chemistry & Color Extraction",
    url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1200&auto=format&fit=crop&q=80",
    category: "Chemical Studio",
    date: "Winter 2024",
    caption: "Eco-friendly natural mordant and microbial dye extraction experiments in the department wet lab.",
  },
  {
    id: "gal-5",
    title: "TESA Annual Leadership Felicitation",
    url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    category: "Council Assembly",
    date: "Convocation 2024",
    caption: "Honoring departing council executive leaders and presenting annual academic excellence awards.",
  },
  {
    id: "gal-6",
    title: "Digital Jacquard Pattern Architecture",
    url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=1200&auto=format&fit=crop&q=80",
    category: "CAD Innovation",
    date: "Fall 2024",
    caption: "Computer-aided textile design and automated electronic jacquard harness drafting lab.",
  },
];
