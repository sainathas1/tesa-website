import Link from "next/link";
import GlassFolderCardsDemo from "@/components/ui/demo";

export const metadata = {
  title: "Atelier Archives & Resources | TESA • SGGSIE&T",
  description: "Browse official textile research publications, atelier lookbooks, and department files in interactive frosted glass folders.",
};

export default function ArchivesPage() {
  return (
    <main className="relative min-h-screen bg-[#050508] text-white flex flex-col justify-between">
      {/* Top Floating Navigation Bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 border-b border-white/10 backdrop-blur-xl bg-black/40">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs font-mono text-zinc-300 hover:text-white transition-colors px-3 py-1.5 rounded-full border border-white/10 hover:border-purple-500/50 bg-white/[0.03]"
        >
          <span>← Back to Atelier</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-zinc-400 uppercase">
            TESA Digital Archive Cabinet
          </span>
        </div>
        <Link
          href="/admin"
          className="text-xs font-mono text-purple-300 hover:text-purple-200 transition-colors"
        >
          Admin Portal →
        </Link>
      </header>

      {/* Main Glass Folder Experience */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="text-center pt-10 pb-4 px-4 max-w-2xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono text-purple-300 tracking-widest uppercase mb-3">
            FROSTED GLASS INTERACTIVE DOSSIERS
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
            Department Archives &amp; Lookbooks
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 font-normal">
            Hover to lean the frosted glass panel toward you. Click or press space to fan open and inspect documents.
          </p>
        </div>

        <GlassFolderCardsDemo />
      </div>

      {/* Footer Note */}
      <footer className="relative z-10 py-6 border-t border-white/10 text-center text-[11px] font-mono text-zinc-500">
        © 2026 Textile Engineering Students Association, SGGSIE&amp;T Nanded
      </footer>
    </main>
  );
}
