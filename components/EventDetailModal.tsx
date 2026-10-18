"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, getDocs, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";

export type CustomFieldType =
  | "Short Text"
  | "Paragraph"
  | "Dropdown Options"
  | "File Upload (PPT/PDF/Image)";

export interface CustomFormField {
  id: string;
  questionTitle: string;
  fieldType: CustomFieldType;
  options?: string;
  required: boolean;
}

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
  paymentQrUrl?: string;
  qrCodeUrl?: string;
  summary: string;
  highlights?: string;
  galleryUrls?: string[];
  customFormFields?: CustomFormField[];
}

export interface RegistrationRecord {
  id?: string;
  registrationId: string;
  eventId?: string;
  eventTitle: string;
  fullName: string;
  prn: string;
  year: string;
  contactNumber?: string;
  email?: string;
  status: "pending" | "verified" | "approved" | "rejected";
  paymentScreenshotUrl?: string;
  submissionFileUrl?: string;
  customAnswers?: Record<string, any>;
  registeredAt: string;
}

interface EventDetailModalProps {
  event: EventItem | null;
  onClose: () => void;
  onRegister?: (eventTitle: string) => void;
  initialMode?: "detail" | "register" | "verifiedList";
}

export default function EventDetailModal({
  event,
  onClose,
  onRegister,
  initialMode = "detail",
}: EventDetailModalProps) {
  // Modal View Modes:
  // "detail" (Event Briefing) | "register" (Registration Form) | "success" (Submitted) | "verifiedList" (Public Verified Participants List)
  const [viewMode, setViewMode] = useState<"detail" | "register" | "success" | "verifiedList">("detail");

  // Registration Form State
  const [fullName, setFullName] = useState("");
  const [prn, setPrn] = useState("");
  const [year, setYear] = useState("Second Year B.Tech");
  const [contactNumber, setContactNumber] = useState("");

  // Dedicated Project Media / Presentation File (PPT, PDF, Image)
  const [presentationFile, setPresentationFile] = useState<File | null>(null);
  const presentationInputRef = useRef<HTMLInputElement>(null);

  // Payment Screenshot File
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Custom Questions Answers & Files
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});
  const [customFiles, setCustomFiles] = useState<Record<string, File>>({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStep, setSubmittingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedRegId, setSubmittedRegId] = useState("");

  // Payment QR Code Fallback State
  const [localPaymentQr, setLocalPaymentQr] = useState<string>("");

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("tesa_payment_qr");
        if (stored) setLocalPaymentQr(stored);
      }
    } catch {}
  }, []);

  const activePaymentQrUrl =
    event?.paymentQrUrl ||
    event?.qrCodeUrl ||
    localPaymentQr ||
    "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=tesa@sggs%26pn=TESA%20SGGSIET%26cu=INR";

  // Verified / Registered Attendees List State
  const [registeredParticipants, setRegisteredParticipants] = useState<RegistrationRecord[]>([]);
  const [isFetchingParticipants, setIsFetchingParticipants] = useState(false);
  const [participantSearch, setParticipantSearch] = useState("");
  const [activeDossierReg, setActiveDossierReg] = useState<RegistrationRecord | null>(null);

  // Sync state whenever active event or initialMode changes
  useEffect(() => {
    if (!event) return;

    setViewMode(initialMode || "detail");
    setFullName("");
    setPrn("");
    setYear("Second Year B.Tech");
    setContactNumber("");
    setPresentationFile(null);
    setPaymentFile(null);
    setPreviewUrl(null);
    setCustomAnswers({});
    setCustomFiles({});
    setErrorMessage("");
    setIsSubmitting(false);
    setSubmittingStep("");
    setSubmittedRegId("");
    setActiveDossierReg(null);
    setParticipantSearch("");

    // Live Real-Time Listener on 'event_registrations'
    setIsFetchingParticipants(true);
    const unsubscribe = onSnapshot(
      collection(db, "event_registrations"),
      (snap) => {
        const records: RegistrationRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          if (data.eventId === event.id || data.eventTitle === event.title || !data.eventId) {
            records.push({
              id: d.id,
              registrationId: data.registrationId || `REG-${d.id.slice(-6)}`,
              eventId: data.eventId,
              eventTitle: data.eventTitle || event.title,
              fullName: data.fullName || data.studentName || "Registered Delegate",
              prn: data.prn || "N/A",
              year: data.year || "B.Tech",
              status: data.status || (data.verified ? "verified" : "pending"),
              submissionFileUrl: data.submissionFileUrl,
              customAnswers: data.customAnswers || {},
              registeredAt: data.registeredAt ? data.registeredAt.slice(0, 10) : "2026-04-01",
            });
          }
        });
        setRegisteredParticipants(records);
        setIsFetchingParticipants(false);
      },
      (err) => {
        console.warn("Firestore event_registrations onSnapshot error:", err);
        setIsFetchingParticipants(false);
      }
    );

    return () => {
      unsubscribe();
    };
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

  // Fetch registered & verified participants for the public view
  const fetchRegisteredParticipants = async (ev: EventItem) => {
    setIsFetchingParticipants(true);
    try {
      const records: RegistrationRecord[] = [];

      // 1. Fetch from Firestore event_registrations
      try {
        const snap = await getDocs(collection(db, "event_registrations"));
        if (!snap.empty) {
          snap.forEach((d) => {
            const data = d.data() as any;
            if (data.eventId === ev.id || data.eventTitle === ev.title || !data.eventId) {
              records.push({
                id: d.id,
                registrationId: data.registrationId || `REG-${d.id.slice(-6)}`,
                eventId: data.eventId,
                eventTitle: data.eventTitle || ev.title,
                fullName: data.fullName || data.studentName || "Registered Delegate",
                prn: data.prn || "N/A",
                year: data.year || "B.Tech",
                status: data.status || "pending",
                submissionFileUrl: data.submissionFileUrl,
                customAnswers: data.customAnswers || {},
                registeredAt: data.registeredAt ? data.registeredAt.slice(0, 10) : "2026-04-01",
              });
            }
          });
        }
      } catch (err) {
        console.warn("Firestore participants fetch fallback:", err);
      }

      // 2. Merge local storage if exists
      try {
        const stored = localStorage.getItem("tesa_event_registrations");
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list)) {
            list.forEach((item: any) => {
              if (
                (item.eventId === ev.id || item.eventTitle === ev.title) &&
                !records.some((r) => r.registrationId === item.registrationId || r.id === item.id)
              ) {
                records.push({
                  id: item.id,
                  registrationId: item.registrationId || `REG-${Date.now().toString().slice(-6)}`,
                  eventId: item.eventId,
                  eventTitle: item.eventTitle || ev.title,
                  fullName: item.fullName || item.studentName || "Delegate",
                  prn: item.prn || "N/A",
                  year: item.year || "B.Tech",
                  status: item.status || "pending",
                  submissionFileUrl: item.submissionFileUrl,
                  customAnswers: item.customAnswers || {},
                  registeredAt: item.registeredAt ? item.registeredAt.slice(0, 10) : "2026-04-01",
                });
              }
            });
          }
        }
      } catch (lsErr) {}

      // No dummy fallback seed records - display actual registered delegates or empty state
      setRegisteredParticipants(records);
    } finally {
      setIsFetchingParticipants(false);
    }
  };

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

  // Dedicated Presentation File Change (accept=".ppt,.pptx,.pdf,.png,.jpg,.jpeg,.webp")
  const handlePresentationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage("Presentation file exceeds 25MB limit. Please upload a smaller file.");
      return;
    }

    setErrorMessage("");
    setPresentationFile(file);
  };

  // Payment screenshot file change
  const handlePaymentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, JPEG, WEBP) for payment verification.");
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

  // Custom question file change handler
  const handleCustomQuestionFileChange = (questionTitle: string, file: File | null) => {
    if (!file) {
      setCustomFiles((prev) => {
        const copy = { ...prev };
        delete copy[questionTitle];
        return copy;
      });
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage(`Uploaded file for "${questionTitle}" exceeds 25MB limit.`);
      return;
    }
    setCustomFiles((prev) => ({ ...prev, [questionTitle]: file }));
  };

  // Submit registration: Upload to Cloudinary (/auto/upload) & save to Firestore collection "event_registrations"
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
      setErrorMessage("Upload Payment Screenshot is required for participation fee verification.");
      return;
    }

    // Validate required custom form fields (Media/File uploads PPT/PDF are always optional)
    if (event.customFormFields && event.customFormFields.length > 0) {
      for (const field of event.customFormFields) {
        if (field.fieldType === "File Upload (PPT/PDF/Image)") {
          // PPT/PDF/Image media uploads are always optional per requirements
          continue;
        }
        if (field.required) {
          const val = customAnswers[field.questionTitle];
          if (!val || !val.trim()) {
            setErrorMessage(`Please fill out required question: "${field.questionTitle}"`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    setSubmittingStep("Uploading files to Cloudinary...");

    try {
      // 1. Upload Dedicated Project Media / Presentation if selected
      let submissionFileUrl = "";
      if (presentationFile) {
        setSubmittingStep("Uploading Presentation (PPT, PDF, or Image) to Cloudinary...");
        submissionFileUrl = await uploadToCloudinary(presentationFile);
      }

      // 2. Upload any Custom Question File Uploads
      const finalCustomAnswers: Record<string, any> = { ...customAnswers };
      for (const [qTitle, cFile] of Object.entries(customFiles)) {
        setSubmittingStep(`Uploading custom file for "${qTitle}" to Cloudinary...`);
        const cUrl = await uploadToCloudinary(cFile);
        finalCustomAnswers[qTitle] = cUrl;
      }

      // 3. Upload Payment Screenshot to Cloudinary
      setSubmittingStep("Uploading Payment Screenshot to Cloudinary...");
      const paymentScreenshotUrl = await uploadToCloudinary(paymentFile);

      // 4. Save to Firestore collection "event_registrations"
      setSubmittingStep("Recording registration details in Firestore...");
      const regId = `REG-${Date.now().toString().slice(-6)}`;
      const regPayload = {
        eventId: event.id,
        eventTitle: event.title,
        fullName: fullName.trim(),
        prn: prn.trim().toUpperCase(),
        year,
        contactNumber: contactNumber.trim(),
        submissionFileUrl: submissionFileUrl || "",
        paymentScreenshotUrl,
        customAnswers: finalCustomAnswers,
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

      // Resilient local caching for immediate feedback and public verified list
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
          eventId: event.id,
          registeredAt: new Date().toISOString().slice(0, 10),
          status: "pending",
          paymentScreenshotUrl,
          submissionFileUrl,
          customAnswers: finalCustomAnswers,
        });
        localStorage.setItem("tesa_registrations", JSON.stringify(adminList));
      } catch (lsErr) {
        console.warn("Local storage write error:", lsErr);
      }

      // Update registered participants list locally
      setRegisteredParticipants((prev) => [
        {
          registrationId: regId,
          eventTitle: event.title,
          fullName: fullName.trim(),
          prn: prn.trim().toUpperCase(),
          year,
          status: "pending",
          registeredAt: new Date().toISOString().slice(0, 10),
          submissionFileUrl,
          paymentScreenshotUrl,
          customAnswers: finalCustomAnswers,
        },
        ...prev,
      ]);

      setSubmittedRegId(regId);
      setViewMode("success");
    } catch (err: any) {
      console.error("Registration submission failed:", err);
      setErrorMessage(
        err.message || "Failed to submit registration. Please verify your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
      setSubmittingStep("");
    }
  };

  // Filter participants by search query
  const filteredParticipants = registeredParticipants.filter((p) => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.prn.toLowerCase().includes(q) ||
      p.registrationId.toLowerCase().includes(q)
    );
  });

  return (
    <AnimatePresence>
      {event && (
        <div className="fixed inset-0 z-50 overflow-y-auto overscroll-contain flex justify-center items-start sm:items-center p-2 sm:p-6">
          {/* Dark Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={!isSubmitting ? handleModalClose : undefined}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-40"
            aria-hidden="true"
          />

          {/* Modal Container: Command Center Aesthetic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            className="relative z-50 w-full max-w-2xl rounded-3xl glass-modal-panel p-5 sm:p-8 overflow-hidden my-auto sm:my-8 max-h-[94vh] sm:max-h-none overflow-y-auto group"
          >
            {/* Ambient Aurora Glow in Corners */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent blur-3xl rounded-full" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />

            {/* Top Close (X) Button (Minimum 44x44px touch target) */}
            <button
              onClick={handleModalClose}
              disabled={isSubmitting}
              aria-label="Close modal"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xl shadow-lg disabled:opacity-40"
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
                    <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/10 mb-6 shadow-xl">
                      <Image
                        src={event.mediaUrl}
                        alt={event.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 680px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/30 to-transparent pointer-events-none" />

                      {/* Overlaid Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-black/70 text-purple-300 border border-purple-500/30 backdrop-blur-md uppercase tracking-wider font-semibold">
                          {event.category}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-2.5 py-0.5 rounded-full border backdrop-blur-md font-semibold ${
                            isOpen
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              : isUpcoming
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              : "bg-zinc-900/80 text-zinc-400 border-zinc-700/50"
                          }`}
                        >
                          {isOpen ? "● REGISTRATION OPEN" : isUpcoming ? "▲ UPCOMING" : "■ CONCLUDED"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-20 rounded-2xl bg-purple-950/20 border border-purple-500/20 mb-6 flex items-center justify-center font-mono text-xs text-purple-400">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] mb-5 font-mono text-xs">
                    <div className="flex items-center gap-2.5 text-zinc-300">
                      <span className="text-purple-400 text-sm">📅</span>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">EVENT DATE</span>
                        <span className="font-semibold text-white">{event.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 text-zinc-300">
                      <span className="text-purple-400 text-sm">📍</span>
                      <div>
                        <span className="text-[10px] text-zinc-500 block">VENUE / LOCATION</span>
                        <span className="font-semibold text-white truncate">{event.venue}</span>
                      </div>
                    </div>

                    {event.deadline && (
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <span className="text-amber-400 text-sm">⏳</span>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">REGISTRATION DEADLINE</span>
                          <span className="font-semibold text-white">{event.deadline}</span>
                        </div>
                      </div>
                    )}

                    {event.capacity && (
                      <div className="flex items-center gap-2.5 text-zinc-300">
                        <span className="text-purple-400 text-sm">👥</span>
                        <div>
                          <span className="text-[10px] text-zinc-500 block">SEAT CAPACITY</span>
                          <span className="font-semibold text-white">{event.capacity} Delegates</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Full Event Description */}
                  <div className="mb-5">
                    <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block mb-1.5">
                      FULL EVENT BRIEFING &amp; OBJECTIVES:
                    </span>
                    <p className="text-sm text-zinc-300 leading-relaxed font-sans font-normal">
                      {event.summary}
                    </p>
                  </div>

                  {/* Highlights Pill */}
                  {event.highlights && (
                    <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/25 text-xs font-mono text-purple-200 mb-6 flex items-center gap-2.5 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                      <span className="text-purple-400 text-base">✦</span>
                      <span className="leading-snug">{event.highlights}</span>
                    </div>
                  )}

                  {/* Event Gallery Photos Grid (If Concluded or Available) */}
                  {event.galleryUrls && event.galleryUrls.length > 0 && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-mono uppercase text-purple-400 tracking-wider">
                          EVENT PHOTO ARCHIVE ({event.galleryUrls.length} PHOTOGRAPHS):
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">CLICK TO VIEW ORIGINAL</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {event.galleryUrls.map((imgUrl, idx) => (
                          <a
                            key={idx}
                            href={imgUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-[4/3] rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 group/img transition-all block shadow-md"
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

                  {/* Action Buttons: Register Now & Check Verified List */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-3">
                    {isOpen || isUpcoming ? (
                      <button
                        onClick={() => setViewMode("register")}
                        className="flex-1 min-h-[44px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-sm uppercase tracking-wider transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_25px_rgba(139,92,246,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>{isOpen ? "Register Now" : "Pre-Register / Reserve Seat"}</span>
                        <span className="text-base">→</span>
                      </button>
                    ) : (
                      <div className="flex-1 py-3 rounded-xl bg-zinc-900/80 border border-white/10 text-center font-mono text-xs text-zinc-400 flex items-center justify-center gap-2">
                        <span className="text-purple-400">■</span>
                        <span>Archive Recorded • Concluded</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setViewMode("verifiedList")}
                      className="min-h-[44px] py-3.5 px-5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>📋 Check Registration &amp; Verified List</span>
                    </button>
                  </div>
                </motion.div>
              ) : viewMode === "register" ? (
                /* =============================================================
                   VIEW 2: COMMAND-CENTER REGISTRATION WITH CUSTOM FORMS & PPT UPLOAD
                   ============================================================= */
                <motion.div
                  key="view-register"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  {/* Top Navigation Row */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setViewMode("detail")}
                      disabled={isSubmitting}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <span>←</span>
                      <span>Event Briefing</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode("verifiedList")}
                      disabled={isSubmitting}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <span>📋 Check Verified List</span>
                    </button>
                  </div>

                  {/* Header Title */}
                  <div className="mb-5">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <span>Delegate Registration</span>
                      <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        VERIFICATION STEP
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-300 mt-1 font-sans leading-relaxed">
                      Please enter your credentials, attach your presentation / media file, and provide your payment screenshot for verification.
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
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          FULL NAME <span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-sans text-sm disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          STUDENT ID / PRN <span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={prn}
                          onChange={(e) => setPrn(e.target.value)}
                          placeholder="e.g. 2023BTE042"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all uppercase text-sm font-sans disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Year of Study & Contact Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          YEAR OF STUDY <span className="text-purple-400">*</span>
                        </label>
                        <select
                          required
                          disabled={isSubmitting}
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-base sm:text-xs disabled:opacity-50 cursor-pointer"
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
                        <label className="text-[11px] text-zinc-400 block mb-1">
                          CONTACT NUMBER (WHATSAPP) <span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          disabled={isSubmitting}
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-sm font-sans disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Dedicated Media Upload Field: PPT, PDF, or Image (Optional) */}
                    <div className="p-4 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/60 bg-white/[0.02] transition-all space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-purple-300 block font-semibold flex items-center gap-1.5">
                          <span>Upload Presentation / Media</span>
                          <span className="text-zinc-500 text-[10px] font-normal font-mono">(Optional)</span>
                        </label>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          PPT, PPTX, PDF, or Images (Optional)
                        </span>
                      </div>

                      <input
                        ref={presentationInputRef}
                        type="file"
                        accept=".ppt,.pptx,.pdf,.png,.jpg,.jpeg,.webp"
                        disabled={isSubmitting}
                        onChange={handlePresentationFileChange}
                        className="w-full text-xs text-zinc-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer cursor-pointer disabled:opacity-50"
                      />

                      {presentationFile ? (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-purple-500/30 text-xs">
                          <div className="flex items-center gap-2 text-white truncate">
                            <span>📄</span>
                            <span className="truncate">{presentationFile.name}</span>
                            <span className="text-zinc-400 text-[10px]">
                              ({(presentationFile.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPresentationFile(null);
                              if (presentationInputRef.current) presentationInputRef.current.value = "";
                            }}
                            className="text-red-400 hover:text-red-300 text-[10px] px-2.5 py-1 rounded bg-red-950/60 border border-red-500/30 transition-colors"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-400 font-sans">
                          Attach your slide deck (PPTX/PPT), research summary document (PDF), or poster banner (Image). Uploaded to Cloudinary (/auto/upload).
                        </p>
                      )}
                    </div>

                    {/* Dynamic Rendering of Custom Questions Created by Admin */}
                    {event.customFormFields && event.customFormFields.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 uppercase">
                            EVENT CUSTOM FIELDS
                          </span>
                          <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                            Specialized Event Questions
                          </span>
                        </div>

                        {event.customFormFields.map((field) => (
                          <div key={field.id} className="space-y-1">
                            <label className="text-[11px] text-zinc-300 block font-semibold">
                              {field.questionTitle}{" "}
                              {field.fieldType === "File Upload (PPT/PDF/Image)" ? (
                                <span className="text-zinc-500 text-[10px] font-normal font-mono">(Optional)</span>
                              ) : field.required ? (
                                <span className="text-red-400">*</span>
                              ) : (
                                <span className="text-zinc-500 text-[10px] font-normal font-mono">(Optional)</span>
                              )}
                            </label>

                            {field.fieldType === "Short Text" && (
                              <input
                                type="text"
                                required={field.required}
                                disabled={isSubmitting}
                                value={customAnswers[field.questionTitle] || ""}
                                onChange={(e) =>
                                  setCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.questionTitle]: e.target.value,
                                  }))
                                }
                                placeholder={`Enter your ${field.questionTitle.toLowerCase()}...`}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-sm font-sans disabled:opacity-50 transition-all"
                              />
                            )}

                            {field.fieldType === "Paragraph" && (
                              <textarea
                                rows={3}
                                required={field.required}
                                disabled={isSubmitting}
                                value={customAnswers[field.questionTitle] || ""}
                                onChange={(e) =>
                                  setCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.questionTitle]: e.target.value,
                                  }))
                                }
                                placeholder={`Provide details for ${field.questionTitle.toLowerCase()}...`}
                                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-base sm:text-xs font-sans disabled:opacity-50 transition-all"
                              />
                            )}

                            {field.fieldType === "Dropdown Options" && (
                              <select
                                required={field.required}
                                disabled={isSubmitting}
                                value={customAnswers[field.questionTitle] || ""}
                                onChange={(e) =>
                                  setCustomAnswers((prev) => ({
                                    ...prev,
                                    [field.questionTitle]: e.target.value,
                                  }))
                                }
                                className="w-full px-4 py-3 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 text-base sm:text-xs cursor-pointer font-sans disabled:opacity-50 transition-all"
                              >
                                <option value="">-- Select an option --</option>
                                {field.options
                                  ?.split(",")
                                  .map((opt) => opt.trim())
                                  .filter(Boolean)
                                  .map((opt, oIdx) => (
                                    <option key={oIdx} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                              </select>
                            )}

                            {field.fieldType === "File Upload (PPT/PDF/Image)" && (
                              <div className="p-3.5 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/60 bg-white/[0.02] transition-all">
                                <input
                                  type="file"
                                  required={false}
                                  accept=".ppt,.pptx,.pdf,.png,.jpg,.jpeg,.webp"
                                  disabled={isSubmitting}
                                  onChange={(e) =>
                                    handleCustomQuestionFileChange(
                                      field.questionTitle,
                                      e.target.files?.[0] || null
                                    )
                                  }
                                  className="w-full text-xs text-zinc-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer cursor-pointer disabled:opacity-50"
                                />
                                {customFiles[field.questionTitle] && (
                                  <div className="mt-2 text-[10px] text-purple-300 font-mono flex items-center justify-between p-2 rounded-lg bg-white/[0.04] border border-purple-500/30">
                                    <span>✓ Selected: {customFiles[field.questionTitle].name}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCustomQuestionFileChange(field.questionTitle, null)
                                      }
                                      className="text-red-400 hover:text-red-300"
                                    >
                                      ✕ Remove
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Payment QR Code & UPI Instructions */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-[#0d0e15] to-[#07080c] border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.15)] flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                      {/* Payment QR Code Image Container */}
                      <div className="flex flex-col items-center shrink-0">
                        <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-white p-2 border-2 border-purple-400/50 shadow-xl overflow-hidden group/qr">
                          <Image
                            src={activePaymentQrUrl}
                            alt="Event Payment QR Code"
                            width={160}
                            height={160}
                            unoptimized
                            className="w-full h-full object-contain rounded-xl"
                          />
                          <a
                            href={activePaymentQrUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-mono font-bold"
                          >
                            🔍 Tap to Enlarge
                          </a>
                        </div>
                        <span className="text-[9px] font-mono text-purple-300 mt-1.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          SCAN TO PAY
                        </span>
                      </div>

                      {/* Payment Details & Steps */}
                      <div className="flex-1 w-full space-y-2 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                            STEP 1: SCAN &amp; PAY
                          </span>
                          <span className="text-[10px] font-mono text-zinc-400">
                            Instant UPI Verification
                          </span>
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          Event Registration Fee
                        </h4>

                        <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">UPI ID:</span>
                            <span className="font-bold text-white bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30 select-all">
                              tesa@sggs
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400">Participation Fee:</span>
                            <span className="text-emerald-400 font-bold">₹150 / ₹250</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">Accepted Apps:</span>
                            <span className="text-purple-300">GPay • PhonePe • Paytm • BHIM</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.
                        </p>
                      </div>
                    </div>

                    {/* Payment Screenshot File Input */}
                    <div>
                      <label className="text-[11px] text-zinc-300 block mb-1 font-semibold">
                        Upload Payment Screenshot (Required for Participation Fee) <span className="text-red-400">*</span>
                      </label>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        disabled={isSubmitting}
                        onChange={handlePaymentFileChange}
                        className="hidden"
                        id="payment-screenshot-input"
                      />

                      {previewUrl ? (
                        <div className="p-3 rounded-2xl border border-purple-500/40 bg-white/[0.02] flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative w-16 h-14 rounded-lg overflow-hidden border border-purple-400/40 shrink-0 bg-black">
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
                                  <span className="text-zinc-400">
                                    ({(paymentFile.size / 1024).toFixed(0)} KB)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <label
                              htmlFor="payment-screenshot-input"
                              className="px-2.5 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[10px] text-zinc-200 cursor-pointer transition-colors"
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
                          className="w-full p-6 rounded-2xl border-2 border-dashed border-white/15 hover:border-purple-500/60 bg-white/[0.02] hover:bg-purple-500/[0.03] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group shadow-inner"
                        >
                          <div className="w-10 h-10 rounded-full bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-300 text-lg group-hover:scale-110 transition-transform">
                            📷
                          </div>
                          <div className="text-center">
                            <span className="text-xs text-white font-semibold block">
                              Click to select Payment Screenshot
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              PNG, JPG, JPEG, WEBP up to 8MB
                            </span>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Submit Registration Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full min-h-[48px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-sm uppercase tracking-wider transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_0_30px_rgba(139,92,246,0.45)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>{submittingStep || "Uploading to Cloudinary..."}</span>
                          </>
                        ) : (
                          <>
                            <span>Complete Event Registration</span>
                            <span>→</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : viewMode === "verifiedList" ? (
                /* =============================================================
                   VIEW 3: "CHECK REGISTRATION & VERIFIED LIST" (PUBLIC COMMAND CENTER)
                   ============================================================= */
                <motion.div
                  key="view-verified"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="font-mono text-xs"
                >
                  {/* Top Bar with Back and Context */}
                  <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setViewMode("detail")}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>←</span>
                      <span>Back to Briefing</span>
                    </button>

                    {(isOpen || isUpcoming) && (
                      <button
                        type="button"
                        onClick={() => setViewMode("register")}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all flex items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                      >
                        <span>Register Now →</span>
                      </button>
                    )}
                  </div>

                  {/* Header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        PUBLIC VERIFICATION PORTAL
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        Live Firestore Sync
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Check Registration &amp; Verified List
                    </h3>
                    <p className="text-xs text-zinc-300 font-sans mt-0.5">
                      Verify your participation status for <span className="text-white font-semibold">{event.title}</span>. Search by your Name or PRN to view your response dossier.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search by your Name, Student PRN, or Registration ID..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-sans text-xs"
                    />
                    <span className="absolute left-3 top-3.5 text-zinc-500 text-sm">🔍</span>
                    {participantSearch && (
                      <button
                        onClick={() => setParticipantSearch("")}
                        className="absolute right-3 top-3 text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/10"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Attendees List */}
                  <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-purple-500/30">
                    {isFetchingParticipants ? (
                      <div className="p-8 text-center text-zinc-400">
                        <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mx-auto mb-2" />
                        <span>Querying Firestore live verification records...</span>
                      </div>
                    ) : filteredParticipants.length > 0 ? (
                      filteredParticipants.map((p, idx) => {
                        const isVerified = p.status === "verified" || p.status === "approved";
                        const isPending = p.status === "pending";

                        return (
                          <div
                            key={p.registrationId || idx}
                            className="p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:border-purple-500/40 hover:bg-white/[0.04] transition-all space-y-2.5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-white text-sm block">
                                  {p.fullName}
                                </span>
                                <span className="text-[11px] text-purple-300">
                                  PRN: {p.prn} • <span className="text-zinc-400">{p.year}</span>
                                </span>
                              </div>

                              {/* Live Glowing Neon Status Badge */}
                              <div>
                                {isVerified ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>✔ VERIFIED</span>
                                  </span>
                                ) : isPending ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px] shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                                    <span>⏳ PENDING VERIFICATION</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                                    <span>✖ REJECTED</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Details & Actions Row */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                              <div className="flex items-center gap-3">
                                <span>
                                  Payment Status:{" "}
                                  <strong className={isVerified ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                                    {isVerified ? "✔ Fee Verified" : "⏳ Review Pending"}
                                  </strong>
                                </span>

                                {p.submissionFileUrl && (
                                  <a
                                    href={p.submissionFileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-purple-300 hover:text-purple-200 underline flex items-center gap-1 font-semibold"
                                  >
                                    <span>📄 Presentation Link ↗</span>
                                  </a>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => setActiveDossierReg(p)}
                                className="px-3 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-purple-300 text-[10px] transition-colors cursor-pointer border border-white/10"
                              >
                                View Submitted Responses →
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-zinc-500 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-zinc-400 font-semibold mb-1">No registered participants found.</p>
                        <p className="text-[11px] text-zinc-600">
                          Try searching another Name or PRN, or register using the &quot;Register Now&quot; button above.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Participant Submission Dossier Modal View */}
                  {activeDossierReg && (
                    <div className="mt-4 p-4 rounded-2xl border border-purple-500/40 bg-black/80 space-y-3 shadow-xl">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <div>
                          <span className="text-[10px] text-purple-400 font-bold uppercase">
                            SUBMITTED FORM RESPONSES
                          </span>
                          <h4 className="text-white font-bold text-sm">
                            {activeDossierReg.fullName} ({activeDossierReg.prn})
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveDossierReg(null)}
                          className="text-zinc-400 hover:text-white text-xs px-2 py-0.5 rounded bg-white/10"
                        >
                          ✕ Close
                        </button>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Academic Year:</span>
                          <span className="text-white">{activeDossierReg.year}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Verification Status:</span>
                          <span className={activeDossierReg.status === "verified" || activeDossierReg.status === "approved" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                            {activeDossierReg.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span className="text-zinc-400">Registration ID:</span>
                          <span className="text-purple-300 font-mono">{activeDossierReg.registrationId}</span>
                        </div>

                        {activeDossierReg.submissionFileUrl && (
                          <div className="flex justify-between py-1 border-b border-white/5 items-center">
                            <span className="text-zinc-400">Project Presentation / Media:</span>
                            <a
                              href={activeDossierReg.submissionFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-300 hover:text-white underline font-semibold flex items-center gap-1"
                            >
                              <span>Open Uploaded File (PPT/PDF/Image) ↗</span>
                            </a>
                          </div>
                        )}

                        {/* Custom Answers */}
                        {activeDossierReg.customAnswers && Object.keys(activeDossierReg.customAnswers).length > 0 && (
                          <div className="pt-2">
                            <span className="text-[10px] text-zinc-400 block mb-1 uppercase font-semibold">
                              Custom Questions &amp; Answers:
                            </span>
                            <div className="space-y-1 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                              {Object.entries(activeDossierReg.customAnswers).map(([k, v], vIdx) => (
                                <div key={vIdx} className="flex flex-col sm:flex-row sm:justify-between py-0.5 text-[11px]">
                                  <span className="text-zinc-400">{k}:</span>
                                  <span className="text-white font-medium break-all">
                                    {typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://")) ? (
                                      <a href={v} target="_blank" rel="noopener noreferrer" className="text-purple-300 underline">
                                        View Attachment ↗
                                      </a>
                                    ) : (
                                      String(v)
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                /* =============================================================
                   VIEW 4: SUCCESS STATE & GREEN CHECKMARK VERIFICATION
                   ============================================================= */
                <motion.div
                  key="view-success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-6 sm:py-8 font-mono text-xs"
                >
                  {/* Glowing Emerald Checkmark Icon */}
                  <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-400 shadow-[0_0_40px_rgba(16,185,129,0.4)] mx-auto mb-5 animate-pulse">
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

                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs mb-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>PROOF RECEIVED • VERIFICATION QUEUED</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                    Registration Submitted for Verification
                  </h3>

                  <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed mb-6 font-sans font-normal">
                    Your delegate information, project presentation, and payment screenshot have been successfully uploaded to Cloudinary and dispatched to the TESA Council.
                  </p>

                  {/* Submission Receipt Box */}
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] max-w-md mx-auto mb-7 text-left font-mono text-xs space-y-2.5">
                    <div className="flex justify-between items-center text-zinc-400 pb-1.5 border-b border-white/5">
                      <span>REGISTRATION ID:</span>
                      <span className="text-purple-300 font-bold">{submittedRegId || "REG-CONFIRMED"}</span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400">
                      <span>EVENT:</span>
                      <span className="text-white font-semibold truncate max-w-[220px]">{event.title}</span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400">
                      <span>DELEGATE NAME:</span>
                      <span className="text-white font-semibold">{fullName}</span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400">
                      <span>STUDENT PRN:</span>
                      <span className="text-purple-300 font-semibold">{prn.toUpperCase()}</span>
                    </div>

                    <div className="flex justify-between items-center text-zinc-400 pt-1.5 border-t border-white/5">
                      <span>PAYMENT PROOF:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                        <span>✓ Cloudinary Verified</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setViewMode("verifiedList")}
                      className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-purple-300 font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Check Live Status in Verified List →
                    </button>

                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="w-full sm:w-auto min-h-[44px] px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] cursor-pointer"
                    >
                      Done &amp; Close Window
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
