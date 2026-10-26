"use client"

import GlassFolder from "@/components/ui/glass-folder-cards"
import { DEFAULT_FACULTY, DEFAULT_GALLERY_PHOTOS } from "@/lib/tesa-cabinets-data"

/**
 * Three interactive 3D folders on a dotted atelier desk:
 * 1. TESA Team (Aurora back-panel with student executive profiles)
 * 2. Faculty of Textile Technology (Verdant back-panel with professor dossiers)
 * 3. TESA Gallery (Glacier back-panel with high-res event stills & conclave archives)
 */
export default function GlassFolderCardsDemo() {
  return (
    <div
      className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-background px-6 py-16"
      style={{ minHeight: "100svh" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 text-foreground opacity-[0.13]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1.1px, transparent 1.4px)",
          backgroundSize: "22px 22px",
        }}
      />
      <div className="relative grid max-w-5xl grid-cols-1 items-end justify-items-center gap-x-12 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
        {/* Folder 1: TESA Team */}
        <GlassFolder
          label="TESA Team"
          meta="Council & Leads"
          art="aurora"
          seed={18}
          appearDelay={0}
          files={[
            {
              name: "Aditya Deshmukh",
              meta: "President · Final Year",
              image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80",
            },
            {
              name: "Snehal Verma",
              meta: "Vice President · Final Year",
              image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
            },
            {
              name: "Rohit Patil",
              meta: "General Secretary · Third Year",
              image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
            },
            {
              name: "Pooja Kulkarni",
              meta: "Treasurer · Third Year",
              image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80",
            },
          ]}
          menu={[
            { label: "Council Roster 2025–26" },
            { label: "Executive Charter" },
          ]}
        />

        {/* Folder 2: Faculty of Textile Technology */}
        <GlassFolder
          label="Faculty of Textile Tech"
          meta="Professors & Mentors"
          art="verdant"
          action="more"
          labelPlacement="bottom-left"
          appearDelay={140}
          files={DEFAULT_FACULTY.slice(0, 4).map((fac) => ({
            name: fac.name,
            meta: fac.designation,
            image: fac.photoUrl,
            art: !fac.photoUrl ? "verdant" : undefined,
          }))}
          menu={[
            { label: "View HOD Dossier" },
            { label: "Research Advisory Council" },
          ]}
        />

        {/* Folder 3: TESA Gallery */}
        <GlassFolder
          label="TESA Gallery"
          meta="Living Stills & Media"
          art="glacier"
          seed={41}
          action="more"
          labelPlacement="top-right"
          appearDelay={280}
          files={DEFAULT_GALLERY_PHOTOS.slice(0, 4).map((photo) => ({
            name: photo.title,
            meta: photo.category ? `${photo.category} · ${photo.date}` : photo.date,
            image: photo.url,
            art: !photo.url ? "glacier" : undefined,
          }))}
          menu={[
            { label: "Open Gallery Lookbook" },
            { label: "TEXPLORER Archives" },
          ]}
        />
      </div>
      <p className="relative mt-14 font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        Hover to lean · Click to fan open · Click file to view dossier
      </p>
    </div>
  )
}
