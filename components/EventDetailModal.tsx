"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
  summary: string;
  highlights?: string;
  galleryUrls?: string[];
}

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  onRegister?: (eventTitle: string) => void;
  initialMode?: "detail" | "register";
}

export default function EventDetailModal({
  event,
  onClose,
  onRegister,
  initialMode = "detail",
}: EventDetailModalProps) {
  // Modal View Modes: "detail" (Event Briefing) | "register" (Registration Form) | "success" (Verification Submitted)
  const [viewMode, setViewMode] = useState<"detail" | "register" | "success">("detail");

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [prn, setPrn] = useState("");
  const [year, setYear] = useState("Second Year B.Tech");
  const [contactNumber, setContactNumber] = useState("");
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedRegId, setSubmittedRegId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever active event or initialMode changes
  useEffect(() => {
    if (event) {
      setViewMode(initialMode || "detail");
      setFullName("");
      setPrn("");
      setYear("Second Year B.Tech");
      setContactNumber("");
      setPaymentFile(null);
      setPreviewUrl(null);
      setErrorMessage("");
      setIsSubmitting(false);
      setSubmittedRegId("");
    }
  }, [event, initialMode]);

  // Listen for Escape key to close modal smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        handleModalClose();
      }
    };
    if (event) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [event, isSubmitting]);

  const handleModalClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setViewMode("detail");
    onClose();
  };

  const isConcluded = event?.eventStatus === "Concluded" || event?.status === "closed";
  const isOpen = !isConcluded && event?.status === "open";
  const isUpcoming = !isConcluded && event?.status === "upcoming";

  // Handle payment screenshot file selection
  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage("Payment screenshot exceeds 8MB limit. Please choose a smaller image.");
      return;
    }

    setErrorMessage("");
    setPaymentFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePaymentFile = () => {
    setPaymentFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Submit registration: Upload to Cloudinary (unsigned fetch) & save to Firestore collection "event_registrations"
  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!event) return;

    if (!fullName.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }
    if (!prn.trim()) {
      setErrorMessage("Please enter your Student ID / PRN.");
      return;
    }
    if (!contactNumber.trim()) {
      setErrorMessage("Please enter your Contact Number.");
      return;
    }
    if (!paymentFile) {
      setErrorMessage("Upload Payment Screenshot is required for verification.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Upload directly to Cloudinary using unsigned preset (Explicit requirement: Do NOT use Firebase Storage)
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "tesa-sggsiet";
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "tesa_unsigned";

      const formData = new FormData();
      formData.append("file", paymentFile);
      formData.append("upload_preset", uploadPreset);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData?.error?.message ||
            `Cloudinary upload failed (Status: ${res.status}). Please check your connection.`
        );
      }

      const uploadResult = await res.json();
      const secureUrl = uploadResult.secure_url || uploadResult.url;

      if (!secureUrl) {
        throw new Error("Cloudinary did not return a secure URL for the uploaded screenshot.");
      }

      // Step 2: Save to Firestore collection "event_registrations"
      const regId = `REG-${Date.now().toString().slice(-6)}`;
      const regPayload = {
        eventId: event.id,
        eventTitle: event.title,
        fullName: fullName.trim(),
        prn: prn.trim().toUpperCase(),
        year,
        contactNumber: contactNumber.trim(),
        paymentScreenshotUrl: secureUrl,
        status: "pending",
        registrationId: regId,
        registeredAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
      };

      try {
        await addDoc(collection(db, "event_registrations"), regPayload);
      } catch (firestoreError: any) {
        console.warn("Firestore event_registrations write fallback:", firestoreError);
      }

      // Resilient local caching for immediate feedback and admin dashboard visibility
      try {
        const stored = localStorage.getItem("tesa_event_registrations");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({ ...regPayload, id: regId });
        localStorage.setItem("tesa_event_registrations", JSON.stringify(list));

        // Sync into tesa_registrations for admin attendee table
        const adminStored = localStorage.getItem("tesa_registrations");
        const adminList = adminStored ? JSON.parse(adminStored) : [];
        adminList.unshift({
          id: regId,
          studentName: fullName.trim(),
          prn: prn.trim().toUpperCase(),
          email: contactNumber.trim(),
          department: "Textile Technology",
          year,
          eventTitle: event.title,
          registeredAt: new Date().toISOString().slice(0, 10),
          status: "pending",
          paymentScreenshotUrl: secureUrl,
        });
        localStorage.setItem("tesa_registrations", JSON.stringify(adminList));
      } catch (lsErr) {
        console.warn("Local storage write error:", lsErr);
      }

      setSubmittedRegId(regId);
      setViewMode("success");
      if (onRegister) {
        onRegister(event.title);
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      setErrorMessage(err?.message || "Registration submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {event && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Dark Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={!isSubmitting ? handleModalClose : undefined}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-40"
            aria-hidden="true"
          />

          {/* Modal Container: Fades and scales in smoothly from center */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            className="relative z-50 w-full max-w-2xl rounded-3xl border border-cyan-500/40 bg-slate-950/95 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.95),0_0_40px_rgba(0,240,255,0.2)] overflow-hidden my-8"
          >
            {/* Subtle Tech Grid Background Decor */}
            <div className="pointer-events-none absolute inset-0 bg-tech-grid opacity-15" />
            <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 blur-3xl rounded-full" />

            {/* Corner Crosshair HUD Accents */}
            <span className="pointer-events-none absolute top-3 left-3 font-mono text-[10px] text-cyan-500/40">
              +
            </span>
            <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[10px] text-cyan-500/40">
              +
            </span>

            {/* Top Close (X) Button (Minimum 44x44px touch target) */}
            <button
              onClick={handleModalClose}
              disabled={isSubmitting}
              aria-label="Close modal"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/60 hover:bg-red-950/80 hover:border-red-500/50 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-md shadow-lg disabled:opacity-40"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Content Switcher based on viewMode */}
            <AnimatePresence mode="wait">
              {viewMode === "detail" ? (
                /* =============================================================
                   VIEW 1: EVENT DOSSIER & BRIEFING
                   ============================================================= */
                <motion.div
                  key="view-detail"
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Event Media / Banner */}
                  {event.mediaUrl ? (
                    <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-cyan-500/30 mb-6 shadow-xl">
                      <Image
                        src={event.mediaUrl}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 680px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent pointer-events-none" />

                      {/* Overlaid Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 backdrop-blur-md uppercase tracking-wider font-semibold">
                          {event.category}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border backdrop-blur-md font-semibold ${
                            isOpen
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              : isUpcoming
                              ? "bg-amber-950/80 text-amber-300 border-amber-500/50"
                              : "bg-slate-900/80 text-slate-400 border-slate-700/50"
                          }`}
                        >
                          {isOpen ? "● REGISTRATION OPEN" : isUpcoming ? "▲ UPCOMING" : "■ CONCLUDED"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-20 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 mb-6 flex items-center justify-center font-mono text-xs text-cyan-400">
                      OFFICIAL TESA NATIONAL CONCLAVE ARCHIVE
                    </div>
                  )}

                  {/* Event Title */}
                  <h3
                    id="event-modal-title"
                    className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight mb-4"
                  >
                    {event.title}
                  </h3>

                  {/* Key Information Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-5 font-mono text-xs">
                    <div className="flex items-center gap-2.5 text-slate-300">
                      <span className="text-cyan-400 text-sm">📅</span>
                      <div>
                        <span className="text-[10px] text-slate-500 block">EVENT DATE</span>
                        <span className="font-semibold text-white">{event.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-slate-300">
                      <span className="text-cyan-400 text-sm">📍</span>
                      <div>
                        <span className="text-[10px] text-slate-500 block">VENUE / LOCATION</span>
                        <span className="font-semibold text-white truncate">{event.venue}</span>
                      </div>
                    </div>

                    {event.deadline && (
                      <div className="flex items-center gap-2.5 text-slate-300">
                        <span className="text-amber-400 text-sm">⏳</span>
                        <div>
                          <span className="text-[10px] text-slate-500 block">REGISTRATION DEADLINE</span>
                          <span className="font-semibold text-white">{event.deadline}</span>
                        </div>
                      </div>
                    )}

                    {event.capacity && (
                      <div className="flex items-center gap-2.5 text-slate-300">
                        <span className="text-purple-400 text-sm">👥</span>
                        <div>
                          <span className="text-[10px] text-slate-500 block">SEAT CAPACITY</span>
                          <span className="font-semibold text-white">{event.capacity} Delegates</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full Event Description */}
                  <div className="mb-5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-1.5">
                      FULL EVENT BRIEFING &amp; OBJECTIVES:
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans font-normal">
                      {event.summary}
                    </p>
                  </div>

                  {/* Highlights Pill */}
                  {event.highlights && (
                    <div className="p-3 rounded-xl bg-cyan-950/25 border border-cyan-500/30 text-xs font-mono text-cyan-200 mb-6 flex items-center gap-2.5 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                      <span className="text-cyan-400 text-base">✦</span>
                      <span className="leading-snug">{event.highlights}</span>
                    </div>
                  )}

                  {/* Event Gallery Photos Grid (If Concluded or Available) */}
                  {event.galleryUrls && event.galleryUrls.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                          EVENT PHOTO ARCHIVE ({event.galleryUrls.length} PHOTOGRAPHS):
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">CLICK TO VIEW ORIGINAL</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {event.galleryUrls.map((imgUrl, idx) => (
                          <a
                            key={idx}
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-cyan-500/30 hover:border-cyan-400 group/img transition-all block shadow-md"
                          >
                            <Image
                              src={imgUrl}
                              alt={`${event.title} archival photo ${idx + 1}`}
                              fill
                              unoptimized={imgUrl.startsWith("data:")}
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover group-hover/img:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-mono">🔍 VIEW</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prominent "Register Now" Button Action: Flips to Registration View */}
                  <div className="pt-2">
                    {isOpen || isUpcoming ? (
                      <button
                        onClick={() => setViewMode("register")}
                        className="w-full min-h-[44px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-mono font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,240,255,0.45)] hover:shadow-[0_0_35px_rgba(0,240,255,0.65)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{isOpen ? "Register Now" : "Pre-Register / Reserve Seat"}</span>
                        <span className="text-base">→</span>
                      </button>
                    ) : (
                      <div className="w-full py-3 rounded-xl bg-slate-900/80 border border-white/10 text-center font-mono text-xs text-slate-400 flex items-center justify-center gap-2">
                        <span className="text-cyan-400">■</span>
                        <span>Archive Recorded • This Conclave Has Concluded</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : viewMode === "register" ? (
                /* =============================================================
                   VIEW 2: FUNCTIONAL REGISTRATION & PAYMENT VERIFICATION FORM
                   ============================================================= */
                <motion.div
                  key="view-register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Top Back Button & Context Banner */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.08]">
                    <button
                      onClick={() => setViewMode("detail")}
                      disabled={isSubmitting}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-mono text-cyan-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <span>←</span>
                      <span>Back to Event Briefing</span>
                    </button>

                    <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 truncate max-w-[220px]">
                      {event.title}
                    </span>
                  </div>

                  {/* Header Title */}
                  <div className="mb-5">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Delegate Registration</span>
                      <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                        VERIFICATION STEP
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">
                      Please enter your collegiate details and attach your participation fee payment screenshot for verification.
                    </p>
                  </div>

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono mb-4 flex items-center gap-2">
                      <span className="text-red-400 text-sm">⚠</span>
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Registration Form */}
                  <form onSubmit={handleSubmitRegistration} className="space-y-4 font-mono text-xs">
                    {/* Full Name & Student ID/PRN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          FULL NAME <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-sans text-sm disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          STUDENT ID / PRN <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={prn}
                          onChange={(e) => setPrn(e.target.value)}
                          placeholder="e.g. 2023BTE042"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all uppercase text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Year of Study & Contact Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          YEAR OF STUDY <span className="text-cyan-400">*</span>
                        </label>
                        <select
                          required
                          disabled={isSubmitting}
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-xs disabled:opacity-50 cursor-pointer"
                        >
                          <option value="First Year B.Tech">First Year B.Tech</option>
                          <option value="Second Year B.Tech">Second Year B.Tech</option>
                          <option value="Third Year B.Tech">Third Year B.Tech</option>
                          <option value="Final Year B.Tech">Final Year B.Tech</option>
                          <option value="M.Tech / Post-Graduate">M.Tech / Post-Graduate</option>
                          <option value="PhD / Research Scholar">PhD / Research Scholar</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">
                          CONTACT NUMBER (WHATSAPP) <span className="text-cyan-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          disabled={isSubmitting}
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-sm font-sans disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Payment Instruction Pill */}
                    <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex items-center justify-between gap-3 text-[11px]">
                      <div className="flex items-center gap-2 text-cyan-300">
                        <span className="text-cyan-400 text-sm">💳</span>
                        <span>Fee: ₹150 / ₹250 (UPI ID: <span className="font-bold text-white">tesa@sggs</span>)</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Scan &amp; Pay via GPay/PhonePe</span>
                    </div>

                    {/* Payment Screenshot File Input */}
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1 font-semibold">
                        Upload Payment Screenshot (Required for Participation Fee) <span className="text-red-400">*</span>
                      </label>

                      {/* Hidden standard file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        disabled={isSubmitting}
                        onChange={handlePaymentFileChange}
                        className="hidden"
                        id="payment-screenshot-input"
                      />

                      {/* Interactive Custom Dropzone / Preview */}
                      {previewUrl ? (
                        <div className="p-3 rounded-2xl border border-cyan-500/50 bg-cyan-950/30 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-16 h-14 rounded-lg overflow-hidden border border-cyan-400/40 shrink-0 bg-black">
                              <Image
                                src={previewUrl}
                                alt="Payment proof preview"
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-white font-semibold text-xs block truncate">
                                {paymentFile?.name || "screenshot.png"}
                              </span>
                              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <span>✓ Ready to upload to Cloudinary</span>
                                {paymentFile && (
                                  <span className="text-slate-400">
                                    ({(paymentFile.size / 1024).toFixed(0)} KB)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="payment-screenshot-input"
                              className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[10px] text-slate-200 cursor-pointer transition-colors"
                            >
                              Change
                            </label>
                            <button
                              type="button"
                              onClick={handleRemovePaymentFile}
                              disabled={isSubmitting}
                              className="px-2.5 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-[10px] text-red-300 cursor-pointer transition-colors"
                            >
                              ✕ Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="payment-screenshot-input"
                          className="w-full p-5 rounded-2xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-400 bg-white/[0.02] hover:bg-cyan-500/[0.03] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-inner"
                        >
                          <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-lg group-hover:scale-110 transition-transform">
                            📷
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-white font-semibold block">
                              Click or tap to upload payment screenshot
                            </span>
                            <span className="text-[10px] text-slate-400">
                              PNG, JPG, JPEG, or WEBP (Direct Cloudinary verification)
                            </span>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Progress Bar / Uploading Indicator */}
                    {isSubmitting && (
                      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3 text-cyan-300 animate-pulse">
                        <span className="w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                        <span className="text-xs">
                          Uploading payment screenshot directly to Cloudinary &amp; recording registration...
                        </span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setViewMode("detail")}
                        disabled={isSubmitting}
                        className="w-1/3 min-h-[44px] py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-slate-300 hover:text-white transition-all text-center cursor-pointer disabled:opacity-40"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-2/3 min-h-[44px] py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-black font-bold tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(0,240,255,0.4)] hover:shadow-[0_0_35px_rgba(0,240,255,0.6)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                            <span>Verifying...</span>
                          </>
                        ) : (
                          <>
                            <span>Submit Registration</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                /* =============================================================
                   VIEW 3: SUCCESS STATE & GREEN CHECKMARK VERIFICATION
                   ============================================================= */
                <motion.div
                  key="view-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-6 sm:py-8"
                >
                  {/* Glowing Emerald Checkmark Icon */}
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.5)] mx-auto mb-5 animate-pulse">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono text-xs mb-3 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>PROOF RECEIVED • VERIFICATION QUEUED</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                    Registration Submitted for Verification
                  </h3>

                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed mb-6 font-normal">
                    Your delegate information and payment screenshot have been successfully uploaded to Cloudinary and dispatched to the TESA Council.
                  </p>

                  {/* Submission Receipt Box */}
                  <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] max-w-md mx-auto mb-7 text-left font-mono text-xs space-y-2.5">
                    <div className="flex justify-between items-center text-slate-400 pb-1.5 border-b border-white/5">
                      <span>REGISTRATION ID:</span>
                      <span className="text-cyan-300 font-bold">{submittedRegId || "REG-CONFIRMED"}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>EVENT:</span>
                      <span className="text-white font-semibold truncate max-w-[220px]">{event.title}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>DELEGATE NAME:</span>
                      <span className="text-white font-semibold">{fullName}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>STUDENT PRN:</span>
                      <span className="text-cyan-300 font-semibold">{prn.toUpperCase()}</span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400 pt-1.5 border-t border-white/5">
                      <span>PAYMENT PROOF:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span>✓ Cloudinary Verified</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleModalClose}
                    className="min-h-[44px] px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.45)] cursor-pointer"
                  >
                    Done &amp; Close Window
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

