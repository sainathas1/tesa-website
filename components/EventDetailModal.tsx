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
  bannerUrl?: string;
  imageUrl?: string;
  image?: string;
  paymentQrUrl?: string;
  qrCodeUrl?: string;
  upiId?: string;
  registrationFee?: string;
  paymentInstructions?: string;
  acceptedPaymentApps?: string;
  summary: string;
  highlights?: string;
  galleryUrls?: string[];
  gallery?: string[];
  customFormFields?: CustomFormField[];
  isPastSection?: boolean;
  _isPast?: boolean;
}

export function isConcludedEvent(event: any): boolean {
  if (!event) return false;
  if (event._isPast || event.isPastSection) return true;
  const evStatus = String(event.eventStatus || event.status || "").trim().toLowerCase();
  if (evStatus === "concluded" || evStatus === "past" || evStatus === "closed") {
    return true;
  }
  const deadline = String(event.deadline || "").trim();
  if (deadline === "0") {
    return true;
  }
  return false;
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
  bannerUrl?: string;
  posterUrl?: string;
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
  // "detail" (Event Briefing) | "gallery" (Event Gallery) | "register" (Registration Form) | "success" (Submitted) | "verifiedList" (Public Verified Participants List)
  const [viewMode, setViewMode] = useState<"detail" | "gallery" | "register" | "success" | "verifiedList">(
    initialMode === "verifiedList" ? "verifiedList" : "detail"
  );
  const [selectedLightboxImg, setSelectedLightboxImg] = useState<string | null>(null);

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

  const eventMediaCover =
    event?.bannerUrl || event?.imageUrl || event?.image || event?.mediaUrl || "";

  // Dynamic Event-Customizable UPI & Payment Settings
  const [copiedUpi, setCopiedUpi] = useState(false);
  const activeUpiId = event?.upiId?.trim() || "tesa@sggs";
  const activeFee = event?.registrationFee?.trim() || "₹150 / ₹250";
  const activeInstructions =
    event?.paymentInstructions?.trim() ||
    "Scan the QR code above with any UPI app. After payment, attach your payment screenshot below as proof of registration.";
  const activeAcceptedApps =
    event?.acceptedPaymentApps?.trim() || "GPay • PhonePe • Paytm • BHIM";

  const dynamicDefaultQr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=${encodeURIComponent(
    activeUpiId
  )}%26pn=${encodeURIComponent(event?.title || "TESA SGGSIET")}%26cu=INR`;

  const activePaymentQrUrl =
    event?.paymentQrUrl ||
    event?.qrCodeUrl ||
    localPaymentQr ||
    dynamicDefaultQr;

  const handleCopyUpi = () => {
    if (!activeUpiId) return;
    navigator.clipboard.writeText(activeUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

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
              bannerUrl: data.bannerUrl || data.posterUrl || "",
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
                bannerUrl: data.bannerUrl || data.posterUrl || "",
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
                  bannerUrl: item.bannerUrl || item.posterUrl || "",
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

  const isConcluded = isConcludedEvent(event);
  const isOpen = !isConcluded && event?.status === "open";
  const isUpcoming = !isConcluded && event?.status === "upcoming";

  const eventGallery =
    event?.galleryUrls && event.galleryUrls.length > 0
      ? event.galleryUrls
      : event?.gallery && event.gallery.length > 0
      ? event.gallery
      : eventMediaCover
      ? [eventMediaCover]
      : [];

  useEffect(() => {
    if (!event) return;
    const concluded = isConcludedEvent(event);
    if (concluded) {
      if (initialMode === "verifiedList") {
        setViewMode("verifiedList");
      } else {
        setViewMode("detail");
      }
    } else {
      setViewMode(initialMode || "detail");
    }
  }, [event, initialMode]);

  const effectiveViewMode = isConcluded && viewMode === "register" ? "detail" : viewMode;


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

      // 3. Upload any Custom Question File Uploads
      const finalCustomAnswers: Record<string, any> = { ...customAnswers };
      for (const [qTitle, cFile] of Object.entries(customFiles)) {
        setSubmittingStep(`Uploading custom file for "${qTitle}" to Cloudinary...`);
        const cUrl = await uploadToCloudinary(cFile);
        finalCustomAnswers[qTitle] = cUrl;
      }

      // 4. Upload Payment Screenshot to Cloudinary
      setSubmittingStep("Uploading Payment Screenshot to Cloudinary...");
      const paymentScreenshotUrl = await uploadToCloudinary(paymentFile);

      // 5. Save to Firestore collection "event_registrations"
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
          bannerUrl: "",
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
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          {/* Dark Glassmorphic Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={!isSubmitting ? handleModalClose : undefined}
            className="fixed inset-0 z-40"
            aria-hidden="true"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-modal-title"
            className="relative z-50 w-full max-w-5xl max-h-[86vh] flex flex-col bg-[#0b0c10] border border-white/15 rounded-2xl shadow-2xl overflow-hidden group"
          >
            {/* Ambient Aurora Glow in Corners */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-80 h-80 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent blur-3xl rounded-full" />
            <div className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl rounded-full" />

            {/* =================================================================
                STICKY TOP BAR (CLEAN MOBILE-SAFE HEADER, NO OVERLAPPING TEXT)
                ================================================================= */}
            <div className="shrink-0 px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between bg-[#0f1016] gap-2">
              {/* Left: TESA Logo (+ desktop-only title & status) */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="relative w-8 h-8 rounded-full border border-white/30 p-[1.5px] overflow-hidden bg-white shrink-0 shadow-[0_0_15px_rgba(124,58,237,0.35)]">
                  <Image
                    src="/tesa-logo.png"
                    alt="TESA Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <div className="hidden lg:flex items-center gap-2 max-w-[220px]">
                  <h3 id="event-modal-title" className="text-xs font-bold text-white truncate">
                    {effectiveViewMode === "register" ? "Event Registration" : event.title}
                  </h3>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${
                    isConcluded
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : isOpen
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-purple-500/10 text-purple-300 border-purple-500/30"
                  }`}>
                    {isConcluded ? "• Concluded" : isOpen ? "● Open" : "▲ Upcoming"}
                  </span>
                </div>
              </div>

              {/* Center: Mode Tabs (Info | Gallery | Verified for Past, Info | Register | Verified for Upcoming) */}
              <div className="flex items-center gap-1 bg-white/[0.04] p-1 rounded-xl border border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("detail")}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    effectiveViewMode === "detail"
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>Info</span>
                </button>

                {isConcluded ? (
                  <button
                    type="button"
                    onClick={() => setViewMode("gallery")}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      effectiveViewMode === "gallery"
                        ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>Gallery</span>
                    {eventGallery.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                        {eventGallery.length}
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewMode("register")}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      effectiveViewMode === "register"
                        ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.4)]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <span>Register</span>
                    {(isOpen || isUpcoming) && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setViewMode("verifiedList")}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    effectiveViewMode === "verifiedList"
                      ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <span>Verified</span>
                  {registeredParticipants.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                      {registeredParticipants.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Right: Close (X) Button */}
              <button
                onClick={handleModalClose}
                disabled={isSubmitting}
                aria-label="Close modal"
                className="shrink-0 w-8 h-8 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 text-xs"
              >
                ✕
              </button>
            </div>

            {/* =================================================================
                MAIN MODAL CONTENT SWITCHER (BASED ON VIEW MODE)
                ================================================================= */}
            {!isConcluded && effectiveViewMode === "register" ? (
              /* ===============================================================
                 REGISTER VIEW: 2-COLUMN VIEWPORT-FIT STUDENT REGISTRATION
                 =============================================================== */
              <form onSubmit={handleSubmitRegistration} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Compact 2-Column Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 custom-scrollbar">
                  {/* Left Column (lg:col-span-5 space-y-4): Read-only Banner, Details & Scannable QR */}
                  <div className="lg:col-span-5 space-y-4">
                    {/* Read-only Event Banner Preview (h-32 w-full object-cover rounded-xl) */}
                    {eventMediaCover ? (
                      <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-black shrink-0 shadow-md">
                        <Image
                          src={eventMediaCover}
                          alt={event.title}
                          fill
                          unoptimized
                          className="h-32 w-full object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-black/70 text-purple-300 border border-purple-500/30 truncate max-w-[70%]">
                            {event.category}
                          </span>
                          <span className="text-emerald-400 bg-black/70 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>● Open</span>
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-24 w-full rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-center font-mono text-xs text-purple-400">
                        OFFICIAL TESA NATIONAL SYMPOSIUM
                      </div>
                    )}

                    {/* Event Date / Venue Summary Card */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                          <span>📅</span> Date:
                        </span>
                        <span className="font-semibold text-white truncate max-w-[65%]">{event.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                          <span>📍</span> Venue:
                        </span>
                        <span className="font-semibold text-white truncate max-w-[65%]">{event.venue}</span>
                      </div>
                      {event.deadline && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-400 text-[11px] flex items-center gap-1.5">
                            <span>⏰</span> Deadline:
                          </span>
                          <span className="text-amber-400 font-semibold truncate max-w-[65%]">{event.deadline}</span>
                        </div>
                      )}
                    </div>

                    {/* Scannable Payment QR Code Card with UPI Details */}
                    <div className="p-3.5 rounded-xl bg-gradient-to-br from-purple-950/30 via-[#0d0e15] to-[#07080c] border border-purple-500/30 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Payment Details
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                          {activeFee}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative w-36 h-36 shrink-0 bg-white p-2 rounded-xl border border-purple-400/40 shadow-md flex items-center justify-center">
                          <Image
                            src={activePaymentQrUrl}
                            alt="Event Payment QR Code"
                            width={144}
                            height={144}
                            unoptimized
                            className="w-36 h-36 object-contain bg-white p-2 rounded-xl"
                          />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-zinc-400 block">UPI ID:</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-bold text-white text-[11px] bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40 select-all truncate">
                                {activeUpiId}
                              </span>
                              <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] text-purple-300 hover:text-white cursor-pointer transition-colors shrink-0"
                              >
                                {copiedUpi ? "✓" : "Copy"}
                              </button>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-400 block">Accepted Apps:</span>
                            <span className="text-[10px] text-purple-200 block truncate">
                              {activeAcceptedApps}
                            </span>
                          </div>
                        </div>
                      </div>
                      {activeInstructions && (
                        <p className="text-[10px] text-zinc-400 leading-snug">
                          {activeInstructions}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column (lg:col-span-7 space-y-3): Student Form Inputs & Uploads */}
                  <div className="lg:col-span-7 space-y-3 font-mono text-xs">
                    {/* Error Notification */}
                    {errorMessage && (
                      <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-mono flex items-center gap-2">
                        <span className="text-red-400 text-sm">⚠</span>
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Student Full Name, PRN, Year, Phone (Compact 2-Column Inputs) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                          FULL NAME <span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm font-sans disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                          STUDENT ID / PRN <span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          disabled={isSubmitting}
                          value={prn}
                          onChange={(e) => setPrn(e.target.value)}
                          placeholder="e.g. 2023BTE042"
                          className="w-full py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm font-sans uppercase disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                          YEAR OF STUDY <span className="text-purple-400">*</span>
                        </label>
                        <select
                          required
                          disabled={isSubmitting}
                          value={year}
                          onChange={(e) => setYear(e.target.value)}
                          className="w-full py-2 px-3 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none focus:border-purple-500 text-xs disabled:opacity-50 cursor-pointer"
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
                        <label className="text-[10px] font-mono text-zinc-400 block mb-1">
                          PHONE / WHATSAPP <span className="text-purple-400">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          disabled={isSubmitting}
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-sm font-sans disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Custom Form Questions (if configured by admin) */}
                    {event.customFormFields && event.customFormFields.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-2.5">
                        <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider block font-bold">
                          Event Questions
                        </span>
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
                                className="w-full py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-xs font-sans disabled:opacity-50 transition-all"
                              />
                            )}

                            {field.fieldType === "Paragraph" && (
                              <textarea
                                rows={2}
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
                                className="w-full py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-xs font-sans disabled:opacity-50 transition-all"
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
                                className="w-full py-2 px-3 rounded-xl bg-[#0b0c10] border border-white/10 text-white focus:outline-none focus:border-purple-500 text-xs cursor-pointer font-sans disabled:opacity-50 transition-all"
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
                              <div className="p-2.5 rounded-xl border border-dashed border-white/15 hover:border-purple-500/60 bg-white/[0.02] transition-all">
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
                                  className="w-full text-xs text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-mono file:bg-purple-600 file:text-white hover:file:bg-purple-500 file:cursor-pointer cursor-pointer disabled:opacity-50"
                                />
                                {customFiles[field.questionTitle] && (
                                  <div className="mt-1.5 text-[10px] text-purple-300 font-mono flex items-center justify-between p-1.5 rounded-lg bg-white/[0.04] border border-purple-500/30">
                                    <span className="truncate max-w-[80%]">✓ {customFiles[field.questionTitle].name}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCustomQuestionFileChange(field.questionTitle, null)}
                                      className="text-red-400 hover:text-red-300 text-[10px]"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload Payment Screenshot Dropzone (* Required) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-200">
                          Upload Payment Screenshot <span className="text-purple-400">*</span>
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">PNG, JPG up to 8MB</span>
                      </div>
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
                        <div className="p-2.5 rounded-xl border border-purple-500/40 bg-white/[0.03] flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-purple-400/40 shrink-0 bg-black">
                              <Image
                                src={previewUrl}
                                alt="Payment proof"
                                fill
                                unoptimized
                                className="object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <span className="text-white font-medium text-xs block truncate">
                                {paymentFile?.name || "screenshot.png"}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-mono">
                                ✓ Ready to upload
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <label
                              htmlFor="payment-screenshot-input"
                              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-zinc-200 cursor-pointer"
                            >
                              Change
                            </label>
                            <button
                              type="button"
                              onClick={handleRemovePaymentFile}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-[10px] text-red-300 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="payment-screenshot-input"
                          className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-white/15 hover:border-purple-500/60 bg-white/[0.02] hover:bg-purple-500/[0.03] flex items-center justify-center gap-3 transition-all cursor-pointer group"
                        >
                          <span className="text-lg">📷</span>
                          <div className="text-left">
                            <span className="text-xs text-white font-medium block">
                              Click to upload Payment Screenshot
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              Required proof of participation fee
                            </span>
                          </div>
                        </label>
                      )}
                    </div>

                    {/* Upload Presentation / Media Dropzone (Optional) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                          <span>Upload Project Media / PPT / PDF</span>
                          <span className="text-zinc-500 text-[10px] font-normal font-mono">(Optional)</span>
                        </label>
                        <span className="text-[10px] text-zinc-400 font-mono">PPT, PPTX, PDF</span>
                      </div>
                      <input
                        ref={presentationInputRef}
                        type="file"
                        accept=".ppt,.pptx,.pdf"
                        disabled={isSubmitting}
                        onChange={handlePresentationFileChange}
                        className="hidden"
                        id="presentation-media-input"
                      />
                      {presentationFile ? (
                        <div className="p-2.5 rounded-xl border border-purple-500/40 bg-white/[0.03] flex items-center justify-between gap-3 shadow-md">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-lg">📄</span>
                            <div className="min-w-0">
                              <span className="text-white font-medium text-xs block truncate">
                                {presentationFile.name}
                              </span>
                              <span className="text-[10px] text-purple-300 font-mono">
                                ({(presentationFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPresentationFile(null);
                              if (presentationInputRef.current) presentationInputRef.current.value = "";
                            }}
                            disabled={isSubmitting}
                            className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-[10px] text-red-300 cursor-pointer"
                          >
                            ✕ Remove
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="presentation-media-input"
                          className="w-full py-2.5 px-4 rounded-xl border-2 border-dashed border-white/10 hover:border-purple-500/50 bg-white/[0.02] flex items-center justify-center gap-3 transition-all cursor-pointer group"
                        >
                          <span className="text-base">📎</span>
                          <div className="text-left">
                            <span className="text-xs text-zinc-300 group-hover:text-white font-medium block">
                              Attach Presentation Deck or Document
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Optional • PPT, PPTX, or PDF
                            </span>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sticky Bottom Action Bar (Pinned, 100% visible at all times) */}
                <div className="shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0f1016] flex items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
                    Fee: <span className="text-emerald-400 font-bold">{activeFee}</span> • Cloudinary &amp; Firestore Secured
                  </span>
                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>{submittingStep || "Uploading..."}</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Registration</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            ) : effectiveViewMode === "gallery" ? (
              /* ===============================================================
                 GALLERY VIEW: RESPONSIVE PHOTO GRID & LIGHTBOX OF CONCLUDED EVENT
                 =============================================================== */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden font-mono text-xs">
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white font-sans">
                        {event.title} — Photo Archives
                      </h4>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {eventGallery.length} Photographic Records
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>• Concluded Conclave</span>
                    </span>
                  </div>

                  {eventGallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                      {eventGallery.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedLightboxImg(imgUrl)}
                          className="relative aspect-video sm:aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/60 group cursor-pointer bg-black/50 shadow-md transition-all"
                        >
                          <Image
                            src={imgUrl}
                            alt={`${event.title} photograph ${idx + 1}`}
                            fill
                            unoptimized
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                            <span className="text-[10px] text-white font-mono flex items-center gap-1">
                              <span>🔍</span>
                              <span>View Photo</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 px-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <span className="text-3xl mb-2 block">📷</span>
                      <h5 className="text-white font-bold text-sm mb-1 font-sans">No Gallery Photos Cataloged</h5>
                      <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto">
                        Historical symposium photographs are currently being cataloged by the TESA Media Council.
                      </p>
                    </div>
                  )}
                </div>

                {/* Sticky Bottom Footer for Gallery */}
                <div className="shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0f1016] flex items-center justify-between gap-3">
                  <span className="text-zinc-400 text-xs font-mono hidden sm:inline">
                    TESA Archives • SGGSIE&amp;T National Conclaves
                  </span>
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="w-full sm:w-auto px-6 py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white font-mono font-semibold text-xs transition-colors cursor-pointer text-center"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : effectiveViewMode === "detail" ? (
              /* ===============================================================
                 DETAIL VIEW: 2-COLUMN VIEWPORT-FIT EVENT DOSSIER
                 =============================================================== */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 custom-scrollbar">
                  {/* Left Column: Banner, Date, Venue, Capacity */}
                  <div className="lg:col-span-5 space-y-4">
                    {eventMediaCover ? (
                      <div className="relative h-44 w-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
                        <Image
                          src={eventMediaCover}
                          alt={event.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c10] via-[#0b0c10]/30 to-transparent pointer-events-none" />
                        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-black/70 text-purple-300 border border-purple-500/30 uppercase tracking-wider font-semibold">
                            {event.category}
                          </span>
                          <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1.5 ${
                            isConcluded
                              ? "bg-zinc-900/90 text-amber-400 border-amber-500/30"
                              : isOpen
                              ? "bg-black/70 text-emerald-400 border-emerald-500/30"
                              : "bg-black/70 text-purple-300 border-purple-500/30"
                          }`}>
                            {isConcluded ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                <span>• Concluded</span>
                              </>
                            ) : isOpen ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>● Open</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                                <span>▲ Upcoming</span>
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 w-full rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-center font-mono text-xs text-purple-400">
                        OFFICIAL TESA NATIONAL CONCLAVE ARCHIVE
                      </div>
                    )}

                    {/* Key Details Card */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                          <span>📅</span> Date:
                        </span>
                        <span className="font-semibold text-white">{event.date}</span>
                      </div>
                      <div className="flex items-center justify-between text-zinc-300">
                        <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                          <span>📍</span> Venue:
                        </span>
                        <span className="font-semibold text-white truncate max-w-[65%]">{event.venue}</span>
                      </div>
                      {event.deadline && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                            <span>⏳</span> Deadline:
                          </span>
                          <span className="font-semibold text-amber-400">{event.deadline}</span>
                        </div>
                      )}
                      {event.capacity && (
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="text-zinc-500 text-[11px] flex items-center gap-1.5">
                            <span>👥</span> Capacity:
                          </span>
                          <span className="font-semibold text-white">{event.capacity} Delegates</span>
                        </div>
                      )}
                    </div>

                    {/* Fee / Concluded Status Details Card (No Fee Card if Concluded) */}
                    {isConcluded ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono flex items-center justify-between text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>Event Status:</span>
                        </span>
                        <span className="font-bold uppercase tracking-wider">Concluded Event</span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 text-xs font-mono flex items-center justify-between">
                        <span className="text-zinc-400">Registration Fee:</span>
                        <span className="font-bold text-emerald-400">{activeFee}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Title, Synopsis, Highlights, Gallery Photos */}
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                        {event.title}
                      </h3>
                      {event.highlights && (
                        <div className="mt-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs font-mono text-purple-200 flex items-center gap-2">
                          <span className="text-purple-400">✦</span>
                          <span>{event.highlights}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider block mb-1">
                        Full Event Dossier &amp; Briefing:
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-line">
                        {event.summary}
                      </p>
                    </div>

                    {/* Gallery Photos Preview */}
                    {eventGallery.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-purple-400 tracking-wider block">
                            Event Photo Archive ({eventGallery.length} Photographs):
                          </span>
                          {isConcluded && (
                            <button
                              type="button"
                              onClick={() => setViewMode("gallery")}
                              className="text-[10px] text-purple-300 hover:text-white underline font-mono cursor-pointer"
                            >
                              View Full Gallery →
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {eventGallery.slice(0, 8).map((imgUrl, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedLightboxImg(imgUrl)}
                              className="relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-purple-500/50 group block cursor-pointer bg-black/40"
                            >
                              <Image
                                src={imgUrl}
                                alt={`${event.title} archive photo ${idx + 1}`}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Bottom Action Bar */}
                <div className="shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0f1016] flex items-center justify-between gap-3">
                  {isConcluded ? (
                    <>
                      <span className="text-zinc-400 text-xs font-mono hidden sm:inline">
                        Archived Symposium Dossier • TESA SGGSIE&amp;T
                      </span>
                      <button
                        type="button"
                        onClick={handleModalClose}
                        className="w-full sm:w-auto px-6 py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white font-mono font-semibold text-xs transition-colors cursor-pointer text-center"
                      >
                        Close Window
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setViewMode("verifiedList")}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>📋 Verified Delegates</span>
                        {registeredParticipants.length > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px]">
                            {registeredParticipants.length}
                          </span>
                        )}
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleModalClose}
                          className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
                        >
                          Close
                        </button>
                        {(isOpen || isUpcoming) && (
                          <button
                            type="button"
                            onClick={() => setViewMode("register")}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
                          >
                            <span>{isOpen ? "Register Now" : "Pre-Register"}</span>
                            <span>→</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : effectiveViewMode === "verifiedList" ? (
              /* ===============================================================
                 VERIFIED LIST VIEW: SEARCH AND VERIFIED ATTENDEES
                 =============================================================== */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden font-mono text-xs">
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {/* Search Bar */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by your Name, Student PRN, or Registration ID..."
                      value={participantSearch}
                      onChange={(e) => setParticipantSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 text-xs font-sans"
                    />
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">🔍</span>
                    {participantSearch && (
                      <button
                        onClick={() => setParticipantSearch("")}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/10"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Attendees List */}
                  <div className="space-y-2">
                    {isFetchingParticipants ? (
                      <div className="p-8 text-center text-zinc-400">
                        <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin mx-auto mb-2" />
                        <span>Querying live verification records...</span>
                      </div>
                    ) : filteredParticipants.length > 0 ? (
                      filteredParticipants.map((p, idx) => {
                        const isVerified = p.status === "verified" || p.status === "approved" || (p as any).verified === true;
                        return (
                          <div
                            key={p.registrationId || idx}
                            className="p-3.5 rounded-xl border border-white/[0.07] bg-white/[0.02] flex items-center justify-between gap-3"
                          >
                            <div>
                              <span className="font-bold text-white text-xs block">
                                {p.fullName}
                              </span>
                              <span className="text-[11px] text-purple-300">
                                PRN: {p.prn} • <span className="text-zinc-400">{p.year}</span>
                              </span>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                isVerified
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              <span>{isVerified ? "✔ VERIFIED" : "⏳ PENDING VERIFICATION"}</span>
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-8 text-center text-zinc-500">
                        No registered participants found matching your query.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky Bottom Action Bar */}
                <div className="shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0f1016] flex items-center justify-between gap-3">
                  <span className="text-zinc-400 text-xs font-mono">
                    {isConcluded ? "Past Attendees: " : "Total Registered: "}
                    <span className="text-white font-bold">{registeredParticipants.length}</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className={`${
                        isConcluded ? "w-full sm:w-auto" : ""
                      } px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/15 border border-white/15 text-white text-xs font-mono transition-colors cursor-pointer text-center font-semibold`}
                    >
                      Close Window
                    </button>
                    {!isConcluded && (isOpen || isUpcoming) && (
                      <button
                        type="button"
                        onClick={() => setViewMode("register")}
                        className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Register Now →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ===============================================================
                 SUCCESS VIEW: GREEN CHECKMARK & REGISTRATION RECEIPT
                 =============================================================== */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden font-mono text-xs">
                <div className="flex-1 overflow-y-auto p-5 flex flex-col items-center justify-center text-center space-y-4 custom-scrollbar">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400/80 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Registration Submitted for Verification
                  </h3>
                  <p className="text-xs text-zinc-300 max-w-md font-sans">
                    Your delegate information and payment screenshot have been securely dispatched to the TESA Council.
                  </p>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] max-w-sm w-full text-left space-y-2 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>REGISTRATION ID:</span>
                      <span className="text-purple-300 font-bold">{submittedRegId || "REG-CONFIRMED"}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>DELEGATE:</span>
                      <span className="text-white font-semibold">{fullName}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>STUDENT PRN:</span>
                      <span className="text-purple-300 font-semibold">{prn.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 px-5 py-3.5 border-t border-white/10 bg-[#0f1016] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode("verifiedList")}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 text-purple-300 text-xs font-mono transition-colors cursor-pointer"
                  >
                    Check Status in Verified List →
                  </button>
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg"
                  >
                    Done &amp; Close
                  </button>
                </div>
              </div>
            )}

            {/* Photo Lightbox Modal */}
            {selectedLightboxImg && (
              <div
                className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
                onClick={() => setSelectedLightboxImg(null)}
              >
                <div
                  className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative w-full h-[65vh] sm:h-[75vh]">
                    <Image
                      src={selectedLightboxImg}
                      alt="Enlarged Archive Photograph"
                      fill
                      unoptimized
                      className="object-contain rounded-xl"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedLightboxImg(null)}
                    className="mt-3 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs border border-white/20 cursor-pointer"
                  >
                    ✕ Close Preview
                  </button>
                </div>
              </div>
            )}
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
