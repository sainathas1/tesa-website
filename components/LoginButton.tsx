"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Google Sign-in Popup
  const handleGoogleSignIn = async () => {
    try {
      setErrorMsg(null);
      setSigningIn(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Auth Error Code:", error.code);
      console.error("Auth Error Message:", error.message);
      console.error("Google sign-in error:", error);

      const code = error?.code || "unknown-code";
      const message = error?.message || "Google sign-in failed.";

      alert(`Firebase Auth Error [${code}]:\n${message}`);

      if (error?.code === "auth/popup-closed-by-user") {
        setErrorMsg("Sign-in popup was closed before completing.");
      } else if (error?.code === "auth/unauthorized-domain") {
        setErrorMsg(
          `Domain unauthorized [${code}]: Add domain in Firebase Console > Authentication > Settings > Authorized Domains.`
        );
      } else if (error?.code === "auth/operation-not-allowed") {
        setErrorMsg(
          `[${code}]: Google Sign-in provider is disabled in Firebase Console > Authentication > Sign-in method.`
        );
      } else {
        setErrorMsg(`[${code}]: ${message}`);
      }
    } finally {
      setSigningIn(false);
    }
  };

  // Handle Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setDropdownOpen(false);
    } catch (error: any) {
      console.error("Sign-out error:", error);
      setErrorMsg("Failed to sign out. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[44px] px-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 text-xs font-mono text-slate-400 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span>AUTH INIT...</span>
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* =========================================================================
          STATE 1: SIGNED IN USER BADGE & DROPDOWN
          ========================================================================= */}
      {user ? (
        <div>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="group flex items-center gap-2.5 px-3 min-h-[44px] rounded-xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-950/70 hover:border-cyan-400 transition-all text-left cursor-pointer"
            title="User Account"
          >
            {/* User Avatar with Fallback */}
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-cyan-400/50 bg-slate-800 flex items-center justify-center shrink-0">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "User avatar"}
                  width={28}
                  height={28}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="font-mono text-xs font-bold text-cyan-300">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </span>
              )}
            </div>

            {/* Display Name & Verified Status */}
            <div className="hidden sm:block">
              <span className="text-xs font-mono font-semibold text-white group-hover:text-cyan-300 transition-colors block leading-tight max-w-[120px] truncate">
                {user.displayName || "TESA Member"}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 leading-none mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ONLINE
              </span>
            </div>

            {/* Chevron icon */}
            <svg
              className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
                dropdownOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {/* Account Dropdown Drawer */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-cyan-500/30 bg-[#090b10] shadow-2xl shadow-cyan-500/10 p-4 z-50 animate-in fade-in duration-150">
              <div className="pb-3 mb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    AUTHORIZED USER
                  </span>
                </div>
                <p className="text-sm font-bold text-white truncate">
                  {user.displayName || "Authenticated Member"}
                </p>
                <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                  {user.email}
                </p>
              </div>

              <div className="space-y-1 text-xs font-mono mb-3 text-slate-300">
                <div className="p-2 rounded bg-white/[0.02] flex items-center justify-between">
                  <span>ROLE:</span>
                  <span className="text-cyan-300">STUDENT / FACULTY</span>
                </div>
                <div className="p-2 rounded bg-white/[0.02] flex items-center justify-between">
                  <span>PROVIDER:</span>
                  <span className="text-white">GOOGLE AUTH</span>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold text-red-300 bg-red-950/40 border border-red-500/30 hover:bg-red-500/20 hover:border-red-400 transition-colors"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" x2="9" y1="12" y2="12" />
                </svg>
                <span>SIGN OUT</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* =========================================================================
           STATE 2: GOOGLE SIGN-IN BUTTON (TRIGGER POPUP)
           ========================================================================= */
        <button
          onClick={handleGoogleSignIn}
          disabled={signingIn}
          className="relative inline-flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2 min-h-[44px] rounded-xl text-xs font-mono font-semibold tracking-wide text-slate-100 bg-white/[0.05] border border-white/[0.15] hover:bg-white/[0.1] hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
          title="Sign in with your Google account"
        >
          {/* Official Google G Multicolored SVG */}
          {signingIn ? (
            <svg
              className="w-4 h-4 animate-spin text-cyan-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}

          <span className="text-xs">
            {signingIn ? (
              "CONNECTING..."
            ) : (
              <>
                <span className="hidden sm:inline">GOOGLE LOGIN</span>
                <span className="sm:hidden">LOGIN</span>
              </>
            )}
          </span>
        </button>
      )}

      {/* Error Toast Notification if error occurs */}
      {errorMsg && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 p-3 rounded-xl border border-red-500/40 bg-red-950/90 text-red-200 text-xs font-mono shadow-2xl z-50 animate-in fade-in">
          <div className="flex items-start justify-between gap-2">
            <span>⚠ {errorMsg}</span>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-red-400 hover:text-white ml-2 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
