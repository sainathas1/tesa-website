"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEventTitle?: string;
  onSuccess?: () => void;
}

export default function EventRegistrationModal({
  isOpen,
  onClose,
  defaultEventTitle = "TEX-CONCLAVE 2026",
  onSuccess,
}: RegistrationModalProps) {
  const [formData, setFormData] = useState({
    studentName: "",
    prn: "",
    email: "",
    phone: "",
    department: "Textile Technology",
    year: "Second Year B.Tech",
    eventTitle: defaultEventTitle,
    college: "SGGSIE&T Nanded",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [registrationReceipt, setRegistrationReceipt] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.studentName.trim() || !formData.prn.trim() || !formData.email.trim()) {
      setErrorMessage("Please complete all mandatory fields (Name, PRN, Email).");
      return;
    }

    setIsSubmitting(true);
    const regId = `REG-${Date.now().toString().slice(-6)}`;
    const newReg = {
      ...formData,
      id: regId,
      registeredAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      status: "pending" as const,
    };

    // 1. Try to save to Firestore
    try {
      await addDoc(collection(db, "registrations"), {
        ...newReg,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.warn("Firestore not provisioned or offline, falling back to local storage:", err?.message);
    }

    // 2. Always persist to localStorage for offline / preview resilience
    try {
      const stored = localStorage.getItem("tesa_registrations");
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(newReg);
      localStorage.setItem("tesa_registrations", JSON.stringify(list));
    } catch (e) {
      console.error("Local storage error:", e);
    }

    setRegistrationReceipt(regId);
    setSubmittedSuccess(true);
    setIsSubmitting(false);
    if (onSuccess) onSuccess();
  };

  const handleResetAndClose = () => {
    setSubmittedSuccess(false);
    setRegistrationReceipt("");
    setFormData({
      studentName: "",
      prn: "",
      email: "",
      phone: "",
      department: "Textile Technology",
      year: "Second Year B.Tech",
      eventTitle: defaultEventTitle,
      college: "SGGSIE&T Nanded",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-[#090b10] text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 bg-cyan-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono text-xs text-cyan-300 uppercase tracking-wider">
              OFFICIAL EVENT REGISTRATION PORTAL
            </span>
          </div>
          <button
            onClick={handleResetAndClose}
            className="w-7 h-7 rounded-lg border border-white/10 hover:border-red-400/50 hover:bg-red-950/40 text-slate-400 hover:text-red-300 flex items-center justify-center text-xs font-mono transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {submittedSuccess ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>

              <span className="inline-block px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold mb-2">
                APPLICATION SUBMITTED SUCCESSFULLY
              </span>

              <h3 className="text-xl font-bold text-white mb-2">
                You are registered for {formData.eventTitle}!
              </h3>
              <p className="text-xs text-slate-400 font-mono mb-4">
                Your application has been logged into the SGGSIE&amp;T TESA Portal and forwarded to the event coordination team.
              </p>

              <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 mb-6 font-mono text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">REGISTRATION ID:</span>
                  <span className="text-cyan-400 font-bold">{registrationReceipt}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-500">STUDENT:</span>
                  <span className="text-white">{formData.studentName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">STATUS:</span>
                  <span className="text-amber-300 font-semibold uppercase">Pending Verification</span>
                </div>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                Close &amp; Return to Website
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  Student Registration Form
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Participate in SGGSIE&amp;T Department of Textile Technology national events.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-xs font-mono">
                  ⚠ {errorMessage}
                </div>
              )}

              {/* Event Choice */}
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Target Event *
                </label>
                <select
                  value={formData.eventTitle}
                  onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                >
                  <option value="TEX-CONCLAVE 2026">TEX-CONCLAVE 2026 (National Symposium)</option>
                  <option value="SMART WEAVES HACKATHON 2026">SMART WEAVES HACKATHON 2026 (36-Hour Challenge)</option>
                  <option value="NANOFIBER & ELECTROSPINNING WORKSHOP">Nanofiber &amp; Electrospinning Workshop</option>
                  <option value="INDUSTRY 4.0 TEXTILE EXPO">Industry 4.0 Technical Textile Expo</option>
                </select>
              </div>

              {/* Name & PRN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saina Khan"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    PRN / Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2023BTE045"
                    value={formData.prn}
                    onChange={(e) => setFormData({ ...formData, prn: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Official College Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@sggs.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    WhatsApp / Mobile No.
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Department & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Branch / Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                  >
                    <option value="Textile Technology">Textile Technology</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Computer Science & Engg">Computer Science &amp; Engg</option>
                    <option value="Production Engineering">Production Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Instrumentation & Control">Instrumentation &amp; Control</option>
                    <option value="Other Engineering College">Other College / Institute</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Academic Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                  >
                    <option value="First Year B.Tech">First Year B.Tech</option>
                    <option value="Second Year B.Tech">Second Year B.Tech</option>
                    <option value="Third Year B.Tech">Third Year B.Tech</option>
                    <option value="Final Year B.Tech">Final Year B.Tech</option>
                    <option value="M.Tech Scholar">M.Tech Scholar</option>
                    <option value="Ph.D. Researcher">Ph.D. Researcher</option>
                  </select>
                </div>
              </div>

              {/* College / Institute */}
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  College / Institute
                </label>
                <input
                  type="text"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/60 border border-white/15 focus:border-cyan-400 focus:outline-none text-white text-xs font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 hover:from-cyan-400 hover:to-teal-300 text-black font-mono font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                      <span>SUBMITTING REGISTRATION...</span>
                    </>
                  ) : (
                    <span>CONFIRM &amp; REGISTER NOW →</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
