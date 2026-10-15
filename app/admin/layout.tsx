"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        // Not authenticated -> automatically redirect back to the homepage (/)
        setUser(null);
        setLoading(false);
        router.replace("/");
      } else {
        // Authenticated admin user
        setUser(currentUser);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Loading State while verifying credentials
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#06070a] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
        <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-30" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
          {/* Animated High-Tech Scanner / Spinner */}
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
            <div className="w-20 h-20 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-cyan-500/40 border-l-transparent animate-spin" />
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <svg
                className="w-5 h-5 text-cyan-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/50 text-[11px] font-mono text-cyan-300 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>SECURITY CLEARANCE CHECK</span>
          </div>

          <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wider uppercase mb-1">
            [SYS_AUTH: VERIFYING ADMIN STATE...]
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Checking Firebase Google Authentication credentials for SGGSIE&amp;T TESA Portal.
          </p>
        </div>
      </div>
    );
  }

  // If user is not logged in, render redirecting screen until router navigation completes
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#06070a] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-30" />
        <div className="relative z-10 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
          </div>
          <h2 className="text-sm font-mono font-bold text-red-300 uppercase tracking-wider mb-1">
            [UNAUTHORIZED: REDIRECTING TO HOMEPAGE...]
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Redirecting to public homepage at /
          </p>
        </div>
      </div>
    );
  }

  // Authorized Admin -> render dashboard children
  return <>{children}</>;
}
